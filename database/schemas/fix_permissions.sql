-- Disable row-level security for document_chunks table to allow inserts
-- This is for development purposes - in production you'd configure proper RLS policies

ALTER TABLE document_chunks DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create a policy that allows all operations
-- ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations on document_chunks" ON document_chunks
--   FOR ALL USING (true) WITH CHECK (true);

-- Verify the change
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'document_chunks'; 