#!/bin/bash

echo "🎯 AIME Knowledge Hub - Document Processor"
echo "=========================================="

# Check if we're in the right directory
if [ ! -d "indexer" ]; then
    echo "❌ Error: Please run this script from the AIME LLM root directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: .../AIME LLM/"
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo "🔍 Checking for new documents in Airtable..."

cd indexer

# Check if python3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed or not in PATH"
    exit 1
fi

echo "🐍 Using Python: $(python3 --version)"

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
    echo "✅ Virtual environment activated"
else
    echo "⚠️  No virtual environment found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    echo "✅ Virtual environment created and activated"
fi

echo ""
echo "🚀 Running document processor..."
echo "   This will:"
echo "   1. Check Airtable for new documents"
echo "   2. Extract text from PDFs/attachments"
echo "   3. Split documents into chunks"
echo "   4. Generate AI embeddings"
echo "   5. Store in Supabase vector database"
echo "   6. Update Airtable with processing status"
echo ""

# Run the main indexer
python3 main.py

echo ""
echo "✅ Document processing complete!"
echo "🔍 New documents are now available for AI search"
echo ""
echo "💡 Test your new documents:"
echo "   1. Go to http://localhost:3000"
echo "   2. Click 'AI Assistant' tab"
echo "   3. Ask about your new document content"
echo "   4. Visit individual document pages for focused chat"
echo "" 