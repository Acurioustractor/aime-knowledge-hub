-- Enable the pgvector extension for vector operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the document_chunks table for storing text chunks and embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    chunk_id TEXT UNIQUE NOT NULL,
    document_id TEXT NOT NULL,
    document_title TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- OpenAI text-embedding-3-small produces 1536-dimensional vectors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_id ON document_chunks(chunk_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_created_at ON document_chunks(created_at);

-- Create a vector similarity index using HNSW (Hierarchical Navigable Small World)
-- This enables fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Create a function to search for similar chunks
CREATE OR REPLACE FUNCTION match_chunks(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    chunk_id text,
    document_id text,
    document_title text,
    chunk_index int,
    content text,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        document_chunks.chunk_id,
        document_chunks.document_id,
        document_chunks.document_title,
        document_chunks.chunk_index,
        document_chunks.content,
        1 - (document_chunks.embedding <=> query_embedding) AS similarity
    FROM document_chunks
    WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    ORDER BY document_chunks.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Create a function to get document statistics
CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS TABLE (
    total_documents bigint,
    total_chunks bigint,
    avg_chunks_per_document float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT document_id) AS total_documents,
        COUNT(*) AS total_chunks,
        COUNT(*)::float / COUNT(DISTINCT document_id) AS avg_chunks_per_document
    FROM document_chunks;
END;
$$;

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_chunks_updated_at 
    BEFORE UPDATE ON document_chunks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows read access to all users
-- In production, you might want more restrictive policies
CREATE POLICY "Allow read access to document_chunks" ON document_chunks
    FOR SELECT USING (true);

-- Create a policy for insert/update operations
-- This should be restricted to authenticated users or service accounts
CREATE POLICY "Allow insert/update for authenticated users" ON document_chunks
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a view for easier querying without exposing embeddings
CREATE OR REPLACE VIEW document_chunks_view AS
SELECT
    chunk_id,
    document_id,
    document_title,
    chunk_index,
    content,
    created_at,
    updated_at
FROM document_chunks;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON document_chunks_view TO anon, authenticated;
GRANT SELECT ON document_chunks TO anon, authenticated;
GRANT ALL ON document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_chunks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_document_stats TO anon, authenticated; 