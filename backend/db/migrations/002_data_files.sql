-- Data files = CSV/JSON uploads from each business (POS exports, etc.)
CREATE TABLE data_files (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id), -- whose account this file belongs to
  business_id INTEGER REFERENCES businesses(id),       -- which business it's for
  file_name TEXT NOT NULL,                             
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'json')),
  status TEXT DEFAULT 'uploaded',                      -- 'uploaded' (initial state), 'processing', 'processed', 'failed'
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);