# 📚 Adding Documents to AIME Knowledge Hub

This guide explains how to add new documents to your AIME Knowledge Hub system. Your documents will be automatically processed, chunked, embedded, and made available for AI-powered search and chat.

## 🎯 Quick Start

### 1. Add Document to Airtable
- Go to your **Airtable Documents table**
- Create new record with required fields
- Upload files OR paste text content

### 2. Process Document
```bash
./process_new_documents.sh
```

### 3. Test Your Document
- Visit http://localhost:3000
- Try asking about your new document content!

---

## 📋 Detailed Process

### Step 1: Add Documents to Airtable

Your system supports multiple document types:

#### **Option A: PDF Documents**
```
✅ Required Fields:
- Title: "My Research Paper"
- Author: "Dr. Jane Smith"  
- Date: "2024-01-15"
- File: [Upload PDF attachment]

✅ Optional Fields:
- Summary: "Brief description of content"
- Topics: ["Education", "Innovation"]
```

#### **Option B: Text Documents**
```
✅ Required Fields:
- Title: "Meeting Minutes - Q1 2024"
- Author: "Team Lead"
- Date: "2024-01-15"
- Full Text: [Paste complete text content]

✅ Optional Fields:
- Summary: "Key decisions and action items"
- Topics: ["Meetings", "Strategy"]
```

#### **Option C: Markdown Documents**
```
✅ Upload .md files as attachments
- System automatically processes markdown formatting
- Removes formatting for clean text search
- Preserves content structure
```

### Step 2: Process Documents

#### **Automatic Processing (Recommended)**
```bash
# From AIME LLM root directory
./process_new_documents.sh
```

This script will:
- ✅ Check Airtable for new documents
- ✅ Extract text from PDFs/attachments  
- ✅ Split documents into searchable chunks
- ✅ Generate AI embeddings using OpenAI
- ✅ Store vectors in Supabase database
- ✅ Update Airtable with processing status

#### **Manual Processing**
```bash
cd indexer
source venv/bin/activate  # If using virtual environment
python3 main.py
```

#### **Check Processing Status**
```bash
./check_documents.sh
```

### Step 3: Verify Integration

#### **Test Global AI Assistant**
1. Go to http://localhost:3000
2. Click **"AI Assistant"** tab
3. Ask: `"What is [your document title] about?"`
4. Verify AI responds with content from your document

#### **Test Document-Specific Chat**
1. Go to http://localhost:3000
2. Click on your document in the list
3. Scroll to bottom → **"Ask Questions About This Document"**
4. Try the suggested prompts or ask custom questions
5. Verify responses come only from that specific document

---

## 🔧 Supported File Types

| File Type | Extension | Notes |
|-----------|-----------|-------|
| **PDF** | `.pdf` | Automatically extracted using PyPDFLoader |
| **Markdown** | `.md`, `.markdown` | Formatting removed for clean search |
| **Text** | `.txt` | Plain text content |
| **Direct Text** | N/A | Paste directly into "Full Text" field |

---

## 💡 Smart Document Features

### **Intelligent Suggested Prompts**

Your system automatically generates relevant prompts based on document content:

**For Business Documents:**
- "What are the most successful business models described?"
- "How do these business cases show impact measurement?"
- "What scaling strategies are recommended?"

**For Research Papers:**
- "What are the key findings of this research?"
- "What methodology was used in this study?"
- "What are the implications of these results?"

**For Meeting Minutes:**
- "What were the main decisions made?"
- "What action items were assigned?"
- "What topics were discussed?"

### **Intelligence Enhancement**

Every query gets enhanced with:
- ✅ **Concept Recognition**: Identifies key concepts in queries
- ✅ **Related Concepts**: Suggests related topics to explore
- ✅ **Cross-Document Insights**: Finds connections between documents
- ✅ **Confidence Scoring**: Shows reliability of AI insights

---

## 🔍 Troubleshooting

### **Document Not Appearing**

1. **Check Airtable Record:**
   ```bash
   ./check_documents.sh
   ```

2. **Verify Required Fields:**
   - Title ✅
   - Author ✅
   - Date ✅
   - Full Text OR File attachment ✅

3. **Reprocess Document:**
   ```bash
   ./process_new_documents.sh
   ```

### **PDF Text Not Extracted**

- ✅ Ensure PDF is text-based (not scanned image)
- ✅ Try uploading to "Full Text" field manually
- ✅ Check PDF isn't password protected

### **Search Not Finding Content**

1. **Check Processing Status:**
   ```bash
   cd indexer
   python3 quick_status_check.py
   ```

2. **Verify Embeddings:**
   - Document should have "Chunk IDs" in Airtable
   - Check Supabase `document_chunks` table

3. **Test Specific Content:**
   - Try exact phrases from your document
   - Use document-specific chat for focused search

---

## 📊 System Architecture

```
Airtable Documents → Text Extraction → Chunking → AI Embeddings → Supabase → RAG Search
       ↓                   ↓              ↓            ↓              ↓           ↓
   Source of Truth     PDF/MD/TXT      500-char     OpenAI API    Vector DB   Smart Chat
```

### **Processing Pipeline:**

1. **Document Detection**: Finds new documents in Airtable
2. **Text Extraction**: Extracts from PDFs/files or uses Full Text
3. **Intelligent Chunking**: Splits into 500-character chunks with 50-char overlap
4. **Embedding Generation**: Creates vector embeddings using OpenAI
5. **Vector Storage**: Stores in Supabase with metadata
6. **AI Integration**: Makes available for RAG search and chat

---

## 🚀 Advanced Features

### **Theme Classification**
Documents are automatically tagged with relevant themes:
- Education, Innovation, Business, Research, etc.
- Used for finding related documents
- Enables cross-document insights

### **Document-Specific Intelligence**
Each document gets custom suggested prompts:
- Analyzes document title and content
- Generates relevant conversation starters
- Tailored to document type and subject matter

### **Hybrid Search**
Combines multiple search approaches:
- Vector similarity search for semantic matching
- Direct keyword matching for specific terms
- Document diversity to avoid single-source bias

---

## 📝 Best Practices

### **Document Titles**
- ✅ Use clear, descriptive titles
- ✅ Include key topics/themes
- ✅ Avoid generic names like "Document 1"

### **Content Quality**
- ✅ Ensure text is clean and readable
- ✅ Remove unnecessary formatting
- ✅ Include complete content (not summaries)

### **Organization**
- ✅ Use consistent author names
- ✅ Set accurate publication dates  
- ✅ Add relevant topics/themes
- ✅ Write helpful summaries

### **Testing**
- ✅ Test both global and document-specific chat
- ✅ Try various question types
- ✅ Verify content accuracy
- ✅ Check suggested prompts work

---

## 🎉 Success Indicators

Your document is successfully integrated when:

✅ **Appears in document list** at http://localhost:3000  
✅ **Has "Chunk IDs" populated** in Airtable  
✅ **Responds to AI queries** in global chat  
✅ **Shows document-specific chat** on document page  
✅ **Generates relevant suggested prompts**  
✅ **Provides intelligence enhancements** in responses  

---

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**: `indexer/indexer.log`
2. **Verify environment**: API keys, database connections
3. **Test with simple text document first**
4. **Run status check**: `./check_documents.sh`

Your AIME Knowledge Hub is designed to be robust and handle various document types automatically. The system will guide you through any issues and provide helpful feedback! 