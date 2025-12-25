-- Property types array column already exists in the leads table
-- This migration ensures the property_types column is properly configured
-- No changes needed - the column is already present and functioning

-- Verify the column exists and is NOT NULL
ALTER TABLE public.leads
ALTER COLUMN property_types SET NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.leads.property_types IS 'Array of property types the lead is interested in';
