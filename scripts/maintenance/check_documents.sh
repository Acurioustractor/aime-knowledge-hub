#!/bin/bash

echo "📊 AIME Knowledge Hub - Document Status Check"
echo "============================================="

# Check if we're in the right directory
if [ ! -d "indexer" ]; then
    echo "❌ Error: Please run this script from the AIME LLM root directory"
    exit 1
fi

cd indexer

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    source venv/bin/activate
fi

echo "🔍 Checking document status..."
echo ""

# Run quick status check
python3 quick_status_check.py

echo ""
echo "💡 To add new documents:"
echo "   1. Add documents to your Airtable Documents table"
echo "   2. Run: ./process_new_documents.sh"
echo ""
echo "🔧 To process documents manually:"
echo "   cd indexer && python3 main.py"
echo "" 