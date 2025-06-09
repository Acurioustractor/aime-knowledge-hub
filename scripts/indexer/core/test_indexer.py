#!/usr/bin/env python3
"""
Test script to run the indexer once.
"""

from main import DocumentIndexer

if __name__ == "__main__":
    print("🚀 Starting document indexing test...")
    indexer = DocumentIndexer()
    indexer.run_indexing_job()
    print("✅ Indexing test completed!") 