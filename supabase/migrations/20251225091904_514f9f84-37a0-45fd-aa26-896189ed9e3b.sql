-- Add property_types array column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS property_types text[] DEFAULT ARRAY['flat']::text[];

-- Migrate existing data from property_type to property_types
UPDATE public.leads 
SET property_types = ARRAY[property_type::text]
WHERE property_types IS NULL OR property_types = ARRAY['flat']::text[];