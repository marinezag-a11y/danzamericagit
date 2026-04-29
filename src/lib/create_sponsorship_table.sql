-- 1. Create sponsorship_tiers table (if not exists)
CREATE TABLE IF NOT EXISTS sponsorship_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  benefits TEXT[] DEFAULT '{}',
  highlight BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Clear existing tiers to avoid duplicates
DELETE FROM sponsorship_tiers;

-- 3. Insert the new tiers from the provided images
INSERT INTO sponsorship_tiers (name, price, benefits, highlight, display_order)
VALUES 
  ('Cota Ouro', '53.656,00', ARRAY['Todas as contrapartidas listadas', 'Destaque máximo da logomarca', 'Participação em evento de agradecimento', 'Menção especial em comunicações à imprensa'], true, 1),
  ('Cota Prata', '26.828,00', ARRAY['Todas as contrapartidas listadas', 'Destaque da logomarca em materiais digitais e físicos', 'Menção em comunicados de imprensa'], true, 2),
  ('Cota Bronze', '13.414,00', ARRAY['Todas as contrapartidas listadas', 'Menção da logomarca em posts de agradecimento nas redes sociais'], true, 3),
  ('Cota Grand Plié', '2.000,00', ARRAY['Impulso Máximo: Todas as contrapartidas listadas', 'Destaque da logomarca em posts individuais de agradecimento', 'Presença em todos os materiais digitais de divulgação da viagem'], false, 4),
  ('Cota Pirouette', '1.000,00', ARRAY['Papel de Destaque', 'Menção da logomarca em posts coletivos de agradecimento nas redes sociais oficiais do Núcleo de Dança Tatiana Figueiredo'], false, 5),
  ('Cota Adagio', '500,00', ARRAY['Gesto de Apoio', 'Agradecimento especial (nome ou logo) em publicação dedicada aos apoiadores e entusiastas do projeto nas redes sociais'], false, 6);

-- 4. Re-enable RLS and Policies (if they weren't set)
ALTER TABLE sponsorship_tiers ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'sponsorship_tiers') THEN
        CREATE POLICY "Allow public read access" ON sponsorship_tiers FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow admin all access' AND tablename = 'sponsorship_tiers') THEN
        CREATE POLICY "Allow admin all access" ON sponsorship_tiers FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
