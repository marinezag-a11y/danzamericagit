const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cybakgeeofynizvtaqlp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YmFrZ2VvZnluaXp2dGFxbHBoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ4MjU5NCwiZXhwIjoyMDkzMDU4NTk0fQ.jaEdnXt2r-Xr2vvT1JKJVpU4wS7oz7_GWe9wfzxl854';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setup() {
  console.log('Iniciando configuração do banco de dados...');

  // 1. Criar Tabelas e Políticas
  const { error: sqlError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS site_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        label TEXT NOT NULL,
        category TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      INSERT INTO site_settings (key, value, label, category) VALUES
        ('pix_key', '6093259@vakinha.com.br', 'Chave PIX', 'donations'),
        ('vakinha_url', 'https://www.vakinha.com.br/vaquinha/talentos-de-minas-nossa-turma-no-palco-internacional', 'Link da Vakinha', 'donations'),
        ('hero_title', 'A Jornada: 26 Anos de Dança', 'Título do Hero', 'content'),
        ('hero_subtitle', '"Transformando talento mineiro em excelência mundial. Nossa próxima parada: Danzamerica, Argentina."', 'Subtítulo do Hero', 'content'),
        ('target_amount', '20000', 'Meta de Arrecadação', 'donations'),
        ('current_amount', '5000', 'Valor Arrecadado', 'donations')
      ON CONFLICT (key) DO NOTHING;

      CREATE TABLE IF NOT EXISTS gallery (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        url TEXT NOT NULL,
        caption TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Allow public read" ON site_settings;
      CREATE POLICY "Allow public read" ON site_settings FOR SELECT USING (true);

      DROP POLICY IF EXISTS "Allow public read" ON gallery;
      CREATE POLICY "Allow public read" ON gallery FOR SELECT USING (true);
    `
  }).catch(e => ({ error: e }));

  if (sqlError) {
    console.log('Nota: O comando RPC execute_sql pode não estar habilitado por padrão. Tentando via query direta se possível...');
    // Se falhar o RPC (comum em novos projetos), o usuário deve rodar no SQL Editor conforme sugerido antes.
    // Mas vou tentar criar o Bucket de Storage de qualquer forma.
  }

  // 2. Criar Buckets de Storage
  const { data: buckets, error: bucketError } = await supabase.storage.createBucket('gallery', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/*']
  });

  if (bucketError && bucketError.message !== 'The resource already exists') {
    console.error('Erro ao criar bucket:', bucketError.message);
  } else {
    console.log('Bucket "gallery" configurado com sucesso.');
  }

  console.log('Configuração básica concluída.');
}

setup();
