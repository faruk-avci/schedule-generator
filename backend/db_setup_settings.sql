-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert current academic term
INSERT INTO site_settings (key, value) 
VALUES ('current_term', '2024-2025 Spring')
ON CONFLICT (key) DO UPDATE SET value = '2024-2025 Spring', updated_at = CURRENT_TIMESTAMP;
