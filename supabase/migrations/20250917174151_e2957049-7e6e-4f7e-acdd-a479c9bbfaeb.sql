-- Enable RLS on Atletas table if not already enabled
ALTER TABLE public."Atletas" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert (since there's no user authentication)
CREATE POLICY "Allow public insert on Atletas" 
ON public."Atletas" 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow public select for viewing data
CREATE POLICY "Allow public select on Atletas" 
ON public."Atletas" 
FOR SELECT 
USING (true);