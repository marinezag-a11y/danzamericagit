
const https = require('https');

const PROJECT_REF = 'cybakgeofynizvtaqlph';
const TOKEN = 'sbp_72fe32388cda2c3daf0f10e4bacfc4e63b1615e3';

const sql = `CREATE TABLE IF NOT EXISTS hero_banners (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), image_url TEXT NOT NULL, title TEXT, subtitle TEXT, order_index INT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()); ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Public Read" ON hero_banners; CREATE POLICY "Public Read" ON hero_banners FOR SELECT USING (true); DROP POLICY IF EXISTS "Admin All" ON hero_banners; CREATE POLICY "Admin All" ON hero_banners FOR ALL USING (auth.role() = 'authenticated'); INSERT INTO hero_banners (image_url, title, subtitle, order_index) SELECT '/hero-bg.jpg', 'A Jornada:', '26 Anos de Dança', 0 WHERE NOT EXISTS (SELECT 1 FROM hero_banners);`;

const data = JSON.stringify({ query: sql });

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/sql`, // Mudando para /sql que é o endpoint da CLI
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`ERRO: ${e.message}`);
});

req.write(data);
req.end();
