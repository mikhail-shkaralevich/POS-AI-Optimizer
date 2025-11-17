-- Accounts = people who log into the dashboard (owners/managers)
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT,                          -- 'owner', 'manager', etc.
  status TEXT,                        -- 'active', 'suspended', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses = retail businesses they manage (boutique, cafe, restaurant)
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  name TEXT NOT NULL,                 -- e.g. 'Kira x Miffy'
  industry TEXT,                      -- e.g. 'boutique', 'cafe'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
