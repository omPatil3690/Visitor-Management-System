/*
  # Initial Schema Setup for Visitor Management System

  1. New Tables
    - visitors
      - Basic visitor information
      - Contact details
      - Visit purpose and status
    - visits
      - Visit details including timestamps
      - Relations to visitors and hosts
    - hosts
      - Information about staff/faculty who can receive visitors
    - departments
      - Organizational structure

  2. Security
    - Enable RLS on all tables
    - Add policies for different user roles
    - Secure visitor data access

  3. Indexes
    - Optimize common queries
    - Improve search performance
*/

-- Create enum types for status
CREATE TYPE visit_status AS ENUM ('pending', 'approved', 'denied', 'completed', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'guard', 'host');

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hosts table
CREATE TABLE IF NOT EXISTS hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  department_id uuid REFERENCES departments(id),
  role user_role NOT NULL DEFAULT 'host',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  photo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, phone)
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid REFERENCES visitors(id),
  host_id uuid REFERENCES hosts(id),
  purpose text NOT NULL,
  status visit_status DEFAULT 'pending',
  check_in_time timestamptz,
  check_out_time timestamptz,
  valid_until timestamptz NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Create policies for departments
CREATE POLICY "Allow read access to all authenticated users"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access to admins"
  ON departments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hosts
      WHERE hosts.auth_id = auth.uid()
      AND hosts.role = 'admin'
    )
  );

-- Create policies for hosts
CREATE POLICY "Allow read access to all authenticated users"
  ON hosts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access to admins"
  ON hosts
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hosts
      WHERE hosts.auth_id = auth.uid()
      AND hosts.role = 'admin'
    )
  );

-- Create policies for visitors
CREATE POLICY "Allow insert access to all"
  ON visitors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read access to all authenticated users"
  ON visitors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow update access to guards and admins"
  ON visitors
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hosts
      WHERE hosts.auth_id = auth.uid()
      AND (hosts.role = 'guard' OR hosts.role = 'admin')
    )
  );

-- Create policies for visits
CREATE POLICY "Allow insert access to all authenticated users"
  ON visits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read access to all authenticated users"
  ON visits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow update access to guards, hosts, and admins"
  ON visits
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hosts
      WHERE hosts.auth_id = auth.uid()
      AND (
        hosts.role = 'guard' 
        OR hosts.role = 'admin'
        OR hosts.id = visits.host_id
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_host_id ON visits(host_id);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_hosts_email ON hosts(email);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosts_updated_at
    BEFORE UPDATE ON hosts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitors_updated_at
    BEFORE UPDATE ON visitors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial departments
INSERT INTO departments (name) VALUES
  ('Administration'),
  ('Faculty'),
  ('Security'),
  ('IT Department'),
  ('Facilities')
ON CONFLICT DO NOTHING;