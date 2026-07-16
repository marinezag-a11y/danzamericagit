CREATE TABLE IF NOT EXISTS public.social_links (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    url text NOT NULL,
    icon text,
    is_pix boolean DEFAULT false,
    is_active boolean DEFAULT true,
    "order" integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.social_links
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.social_links
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.social_links
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.social_links
    FOR DELETE USING (auth.role() = 'authenticated');
