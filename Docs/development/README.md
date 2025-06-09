# AIME Knowledge Hub

An AI-powered knowledge management system that transforms Airtable into an intelligent, searchable repository with RAG (Retrieval-Augmented Generation) capabilities.

## 🚀 Features

- **Document Management**: Store and organize PDFs and Markdown files in Airtable
- **AI-Powered Search**: Semantic search using vector embeddings
- **RAG Chat Interface**: Ask questions and get answers with citations
- **Theme Classification**: Automatic categorization of documents
- **Multiple AI Models**: Support for OpenAI GPT-4 and Anthropic Claude
- **Modern UI**: Beautiful, responsive Next.js frontend
- **Scalable Architecture**: Supports both Supabase and Pinecone for vector storage

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Airtable     │    │   Next.js App    │    │  Vector Store   │
│   (Documents)   │◄──►│  (Frontend/API)  │◄──►│ (Supabase/Pine) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                        ▲                       ▲
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Make.com      │    │   OpenAI/Claude  │    │  Python Indexer │
│  (Automation)   │    │   (AI Models)    │    │  (Processing)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Airtable account and API key
- OpenAI API key
- Supabase account (or Pinecone)
- Make.com account (optional, for automation)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd aime-knowledge-hub

# Install Node.js dependencies
npm install

# Install Python dependencies
cd indexer
pip install -r requirements.txt
cd ..
```

### 2. Set Up Airtable Base

Create an Airtable base with the following structure:

#### Documents Table
| Field Name | Field Type | Description |
|------------|------------|-------------|
| Title | Single line text | Document title |
| Author | Single line text | Document author |
| Date | Date | Publication date |
| Topics | Multiple select | Document themes/topics |
| File | Attachment | PDF/Markdown files |
| Full Text | Long text | Extracted text content |
| Chunk IDs | Long text | Generated chunk references |
| Status | Single select | Processing status |
| Processed At | Date & time | Last processing timestamp |

#### Themes Table
| Field Name | Field Type | Description |
|------------|------------|-------------|
| Name | Single line text | Theme name |
| Description | Long text | Theme description |
| Count | Number | Number of documents with this theme |

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Airtable Configuration
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_DOCUMENTS_TABLE=Documents
AIRTABLE_THEMES_TABLE=Themes

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Vector Database - Choose one:
# Supabase
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OR Pinecone
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_pinecone_environment_here
PINECONE_INDEX_NAME=aime-knowledge-hub
```

### 4. Set Up Vector Database

#### Option A: Supabase (Recommended)

1. Create a new Supabase project
2. Enable the `pgvector` extension in the SQL editor
3. Run the schema from `database/supabase_schema.sql`

#### Option B: Pinecone

1. Create a Pinecone account and project
2. Create an index with:
   - Dimensions: 1536
   - Metric: cosine
   - Pod type: p1.x1

### 5. Run the Application

```bash
# Start the Next.js development server
npm run dev

# In a separate terminal, start the Python indexer
cd indexer
python main.py
```

The application will be available at `http://localhost:3000`.

## 📚 Usage Guide

### Adding Documents

1. **Manual Upload**: Add documents directly to your Airtable base
2. **Automated Upload**: Set up Make.com automation to monitor a folder and auto-upload new files

### Document Processing

The Python indexer automatically:
1. Monitors Airtable for new documents
2. Extracts text from PDFs
3. Splits text into semantic chunks
4. Generates embeddings using OpenAI
5. Stores vectors in your chosen database
6. Updates Airtable with processing status

### Using the Chat Interface

1. Navigate to the "AI Assistant" tab
2. Choose your preferred model (GPT-4 or Claude)
3. Ask questions about your documents
4. View responses with source citations
5. Click citations to view original documents

### Browsing Documents

1. Use the "Browse Documents" tab
2. Filter by themes using the sidebar
3. Search using the search bar
4. Switch between grid and list views
5. Click "View in Airtable" to see full details

## 🔧 Configuration Options

### Text Chunking

Modify chunk settings in `indexer/main.py`:

```python
self.text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,        # Adjust chunk size
    chunk_overlap=50,      # Adjust overlap
    length_function=len,
    separators=["\n\n", "\n", " ", ""]
)
```

### AI Model Settings

Configure model parameters in `app/api/chat/route.ts`:

```typescript
// OpenAI settings
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  max_tokens: 1000,
  temperature: 0.7,
})

// Anthropic settings
const response = await anthropic.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1000,
})
```

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Indexer (Railway/Heroku)

1. Create a new service on Railway or Heroku
2. Add environment variables
3. Deploy the `indexer` directory
4. Set up scheduled runs using cron or platform scheduler

### Database

- **Supabase**: Already hosted, just configure connection
- **Pinecone**: Already hosted, just configure connection

## 🔒 Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Airtable Access**: Use read-only API keys where possible
3. **Database Security**: Enable RLS (Row Level Security) in Supabase
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **CORS**: Configure CORS properly for production

## 📊 Monitoring and Analytics

### Logs

- Frontend logs: Check Vercel function logs
- Indexer logs: Check `indexer.log` file
- Database logs: Monitor Supabase/Pinecone dashboards

### Metrics

Track key metrics:
- Document processing rate
- Search query performance
- User engagement
- API usage and costs

## 🛠️ Troubleshooting

### Common Issues

1. **Indexer not processing documents**
   - Check Airtable API credentials
   - Verify document has "Full Text" field populated
   - Check indexer logs for errors

2. **Chat not returning results**
   - Verify vector database connection
   - Check if documents are properly indexed
   - Ensure embeddings are generated correctly

3. **Slow search performance**
   - Check vector database indexes
   - Consider reducing chunk size
   - Monitor API rate limits

### Debug Mode

Enable debug logging in the indexer:

```python
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built following the blueprint for AI-ready knowledge hubs
- Uses LangChain for document processing
- Powered by OpenAI and Anthropic AI models
- Vector search enabled by Supabase pgvector or Pinecone

## 📞 Support

For questions and support:
- Create an issue in this repository
- Check the troubleshooting section
- Review the configuration options

---

**Happy knowledge hunting! 🔍✨** 