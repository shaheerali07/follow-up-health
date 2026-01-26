-- Follow-Up Health Dashboard - Supabase Schema
-- Run this in Supabase SQL Editor to set up your tables

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  monthly_inquiries INT NOT NULL,
  response_time TEXT NOT NULL,
  follow_up_depth TEXT NOT NULL,
  patient_value TEXT NOT NULL,
  after_hours TEXT NOT NULL,
  grade TEXT NOT NULL,
  loss_rate DECIMAL NOT NULL,
  dropoff_pct INT NOT NULL,
  risk_low INT NOT NULL,
  risk_high INT NOT NULL,
  drivers TEXT[] NOT NULL,
  email TEXT
);

-- Create index for common queries
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_submissions_grade ON submissions(grade);
CREATE INDEX idx_submissions_email ON submissions(email) WHERE email IS NOT NULL;

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_range TEXT UNIQUE NOT NULL, -- 'A', 'BC', 'DF'
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default email templates
INSERT INTO email_templates (grade_range, subject, body) VALUES
  ('A', 'Your Follow-Up Health Score: Top Performer', 'You''re replying quickly. But are decisions actually moving?'),
  ('BC', 'Your Follow-Up Health Score: Room to Improve', 'Follow-up exists. It''s just not predictable yet.'),
  ('DF', 'Your Follow-Up Health Score: Needs Attention', 'When follow-up feels messy, this is usually why.');

-- Admin users table
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (adjust as needed)
CREATE POLICY "Service role can insert submissions" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can read submissions" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Service role can read templates" ON email_templates
  FOR SELECT USING (true);

CREATE POLICY "Service role can update templates" ON email_templates
  FOR UPDATE USING (true);

CREATE POLICY "Service role can insert templates" ON email_templates
  FOR INSERT WITH CHECK (true);
