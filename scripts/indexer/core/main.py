#!/usr/bin/env python3
"""
AIME Knowledge Hub Document Indexer

This service:
1. Fetches documents from Airtable
2. Extracts and chunks text content
3. Generates embeddings using OpenAI
4. Stores vectors in Supabase
5. Updates Airtable with chunk references
"""

import os
import sys
import time
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

import schedule
from dotenv import load_dotenv
from pyairtable import Api
from openai import OpenAI
from supabase import create_client, Client

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langchain.schema import Document
from theme_extractor import ThemeExtractor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('indexer.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class DocumentIndexer:
    def __init__(self):
        """Initialize the document indexer with API clients."""
        self.setup_clients()
        self.setup_text_splitter()
        
        # Initialize theme extractor
        self.theme_extractor = ThemeExtractor()
        
    def setup_clients(self):
        """Initialize API clients for Airtable, OpenAI, and Supabase."""
        # Airtable
        api_key = os.getenv('AIRTABLE_API_KEY')
        if not api_key:
            raise ValueError("AIRTABLE_API_KEY is required")
        
        self.airtable_api = Api(api_key)
        self.base_id = os.getenv('AIRTABLE_BASE_ID')
        self.documents_table = os.getenv('AIRTABLE_DOCUMENTS_TABLE', 'Documents')
        self.themes_table = os.getenv('AIRTABLE_THEMES_TABLE', 'Themes')
        
        if not self.base_id:
            raise ValueError("AIRTABLE_BASE_ID is required")
        
        # OpenAI
        openai_key = os.getenv('OPENAI_API_KEY')
        if not openai_key:
            raise ValueError("OPENAI_API_KEY is required")
        
        self.openai_client = OpenAI(api_key=openai_key)
        
        # Supabase
        self.setup_supabase()
        
    def setup_supabase(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv('SUPABASE_URL')
        # Use service role key for write operations, fallback to anon key
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase URL and key are required")
            
        self.supabase: Client = create_client(supabase_url, supabase_key)
        logger.info(f"Initialized Supabase client with {'service role' if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else 'anon'} key")
        
    def setup_text_splitter(self):
        """Initialize the text splitter for chunking documents."""
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
    def fetch_unprocessed_documents(self) -> List[Dict[str, Any]]:
        """Fetch documents from Airtable that haven't been processed yet."""
        try:
            table = self.airtable_api.table(self.base_id, self.documents_table)
            
            # Fetch all records first, then filter in Python
            # This avoids complex Airtable formula issues
            all_records = table.all()
            
            unprocessed = []
            for record in all_records:
                fields = record['fields']
                has_full_text = bool(fields.get('Full Text', '').strip())
                has_attachments = bool(fields.get('File', []))
                has_chunk_ids = bool(fields.get('Chunk IDs', '').strip())
                
                # Process if has full text OR has attachments, but no chunk IDs
                if (has_full_text or has_attachments) and not has_chunk_ids:
                    unprocessed.append(record)
            
            logger.info(f"Found {len(unprocessed)} unprocessed documents out of {len(all_records)} total")
            return unprocessed
            
        except Exception as e:
            logger.error(f"Error fetching documents from Airtable: {e}")
            return []
            
    def extract_text_from_attachment(self, attachment_url: str, attachment_info: Dict[str, Any] = None) -> str:
        """Extract text from PDF, markdown, or other document attachments."""
        try:
            # Get file type from filename or content type
            filename = attachment_info.get('filename', '') if attachment_info else ''
            content_type = attachment_info.get('type', '') if attachment_info else ''
            
            # Download the file content
            import requests
            response = requests.get(attachment_url)
            response.raise_for_status()
            
            # Determine file type
            is_pdf = (filename.lower().endswith('.pdf') or 
                     content_type.startswith('application/pdf') or
                     attachment_url.lower().endswith('.pdf'))
            
            is_markdown = (filename.lower().endswith(('.md', '.markdown')) or 
                          content_type in ['text/x-markdown', 'text/markdown'] or
                          attachment_url.lower().endswith(('.md', '.markdown')))
            
            is_text = (filename.lower().endswith(('.txt', '.text')) or 
                      content_type.startswith('text/plain') or
                      attachment_url.lower().endswith(('.txt', '.text')))
            
            # Handle different file types
            if is_pdf:
                # For PDFs, use PyPDFLoader
                loader = PyPDFLoader(attachment_url)
                documents = loader.load()
                return "\n".join([doc.page_content for doc in documents])
            
            elif is_markdown:
                # For markdown files, get the text content directly
                text_content = response.text
                logger.info(f"Processing markdown file: {filename} ({len(text_content)} characters)")
                
                # Remove markdown formatting for cleaner text
                import re
                # Remove headers (convert to regular text)
                text_content = re.sub(r'^#+\s*(.+)$', r'\1', text_content, flags=re.MULTILINE)
                # Remove emphasis markers
                text_content = re.sub(r'\*\*(.*?)\*\*', r'\1', text_content)
                text_content = re.sub(r'\*(.*?)\*', r'\1', text_content)
                # Remove code blocks
                text_content = re.sub(r'```.*?```', '', text_content, flags=re.DOTALL)
                # Remove links but keep text
                text_content = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text_content)
                # Clean up extra whitespace
                text_content = re.sub(r'\n\s*\n', '\n\n', text_content)
                return text_content.strip()
            
            elif is_text:
                # For plain text files
                return response.text
                
            else:
                logger.warning(f"Unsupported file type - filename: {filename}, content-type: {content_type}, url: {attachment_url[:100]}...")
                return ""
                
        except Exception as e:
            logger.error(f"Error extracting text from {attachment_url}: {e}")
            return ""
            
    def chunk_document(self, text: str, document_id: str, title: str) -> List[Document]:
        """Split document text into chunks."""
        try:
            chunks = self.text_splitter.split_text(text)
            
            documents = []
            for i, chunk in enumerate(chunks):
                doc = Document(
                    page_content=chunk,
                    metadata={
                        'document_id': document_id,
                        'document_title': title,
                        'chunk_index': i,
                        'chunk_id': f"{document_id}_chunk_{i}"
                    }
                )
                documents.append(doc)
                
            logger.info(f"Created {len(documents)} chunks for document {document_id}")
            return documents
            
        except Exception as e:
            logger.error(f"Error chunking document {document_id}: {e}")
            return []
            
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks using OpenAI."""
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            embeddings = [data.embedding for data in response.data]
            logger.info(f"Generated embeddings for {len(texts)} chunks")
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return []
            
    def store_vectors_supabase(self, documents: List[Document], embeddings: List[List[float]]):
        """Store document chunks and embeddings in Supabase."""
        try:
            for doc, embedding in zip(documents, embeddings):
                data = {
                    'chunk_id': doc.metadata['chunk_id'],
                    'document_id': doc.metadata['document_id'],
                    'document_title': doc.metadata['document_title'],
                    'chunk_index': doc.metadata['chunk_index'],
                    'content': doc.page_content,
                    'embedding': embedding,
                    'created_at': datetime.utcnow().isoformat()
                }
                
                result = self.supabase.table('document_chunks').insert(data).execute()
                
            logger.info(f"Stored {len(documents)} chunks in Supabase")
            
        except Exception as e:
            logger.error(f"Error storing vectors in Supabase: {e}")
            
    def update_airtable_with_chunks(self, document_id: str, chunk_ids: List[str]):
        """Update Airtable document record with chunk IDs."""
        try:
            table = self.airtable_api.table(self.base_id, self.documents_table)
            
            table.update(document_id, {
                'Chunk IDs': ', '.join(chunk_ids),
                'Processed At': datetime.utcnow().isoformat(),
                'Status': 'Indexed'
            })
            
            logger.info(f"Updated Airtable record {document_id} with {len(chunk_ids)} chunk IDs")
            
        except Exception as e:
            logger.error(f"Error updating Airtable record {document_id}: {e}")
            
    def classify_themes(self, text: str) -> List[str]:
        """Use LLM to classify document themes."""
        try:
            # Get existing themes from Airtable
            themes_table = self.airtable_api.table(self.base_id, self.themes_table)
            existing_themes = [record['fields'].get('Name', '') for record in themes_table.all()]
            
            prompt = f"""
            Analyze the following text and assign 2-3 relevant themes from this list: {', '.join(existing_themes)}
            
            If the text covers topics not in the list, suggest 1-2 new theme names (keep them concise, 1-3 words).
            
            Text: {text[:1000]}...
            
            Return only the theme names, separated by commas.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0.3
            )
            
            themes = [theme.strip() for theme in response.choices[0].message.content.split(',')]
            return themes[:3]  # Limit to 3 themes
            
        except Exception as e:
            logger.error(f"Error classifying themes: {e}")
            return []
            
    def process_document(self, record: Dict[str, Any]):
        """Process a single document: extract, chunk, embed, and store."""
        try:
            document_id = record['id']
            fields = record['fields']
            
            title = fields.get('Title', 'Untitled')
            full_text = fields.get('Full Text', '')
            file_attachments = fields.get('File', [])
            
            logger.info(f"Processing document: {title}")
            
            # Extract text from attachments if full text is not available
            if not full_text and file_attachments:
                for attachment in file_attachments:
                    # Pass both URL and attachment metadata for better file type detection
                    extracted_text = self.extract_text_from_attachment(attachment['url'], attachment)
                    full_text += extracted_text + "\n"
                
                # Save extracted text back to Airtable (if not too large)
                if full_text.strip():
                    # Airtable has a field limit of ~100k characters
                    if len(full_text) <= 100000:
                        table = self.airtable_api.table(self.base_id, self.documents_table)
                        table.update(document_id, {'Full Text': full_text.strip()})
                        logger.info(f"Saved extracted text to Airtable for document {document_id}")
                    else:
                        # Save a truncated version with note
                        truncated_text = full_text[:95000] + "\n\n[Text truncated - full content processed for search]"
                        table = self.airtable_api.table(self.base_id, self.documents_table)
                        table.update(document_id, {'Full Text': truncated_text})
                        logger.info(f"Saved truncated text to Airtable for document {document_id} (original: {len(full_text)} chars)")
                    
                    # Continue processing with full text for chunking/embedding
                    full_text = full_text.strip()
                    
            if not full_text:
                logger.warning(f"No text content found for document {document_id}")
                return
                
            # Extract and assign themes using ThemeExtractor
            themes = self.theme_extractor.process_document(document_id, full_text, title)
            
            # Chunk the document
            chunks = self.chunk_document(full_text, document_id, title)
            if not chunks:
                return
                
            # Generate embeddings
            texts = [chunk.page_content for chunk in chunks]
            embeddings = self.generate_embeddings(texts)
            if not embeddings:
                return
                
            # Store vectors in Supabase
            self.store_vectors_supabase(chunks, embeddings)
                
            # Update Airtable
            chunk_ids = [chunk.metadata['chunk_id'] for chunk in chunks]
            self.update_airtable_with_chunks(document_id, chunk_ids)
                
            logger.info(f"Successfully processed document {document_id}")
            
        except Exception as e:
            logger.error(f"Error processing document {record.get('id', 'unknown')}: {e}")
            
    def run_indexing_job(self):
        """Main indexing job that processes all unprocessed documents."""
        logger.info("Starting document indexing job")
        
        try:
            # Fetch unprocessed documents
            documents = self.fetch_unprocessed_documents()
            
            if not documents:
                logger.info("No unprocessed documents found")
                return
                
            # Process each document
            for record in documents:
                self.process_document(record)
                time.sleep(1)  # Rate limiting
                
            logger.info(f"Indexing job completed. Processed {len(documents)} documents")
            
        except Exception as e:
            logger.error(f"Error in indexing job: {e}")

def main():
    """Main function to run the indexer."""
    logger.info("Starting AIME Knowledge Hub Document Indexer")
    
    try:
        indexer = DocumentIndexer()
        
        # Run immediately
        indexer.run_indexing_job()
        
        # Schedule to run every hour
        schedule.every().hour.do(indexer.run_indexing_job)
        
        logger.info("Indexer scheduled to run every hour")
        
        # Keep the script running
        while True:
            schedule.run_pending()
            time.sleep(60)
            
    except KeyboardInterrupt:
        logger.info("Indexer stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 