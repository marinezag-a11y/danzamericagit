ALTER TABLE raffle_campaigns ADD COLUMN IF NOT EXISTS is_test_mode boolean DEFAULT false;
