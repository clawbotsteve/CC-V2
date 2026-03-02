const fs = require('fs');
const https = require('https');

const FAL_KEY = fs.readFileSync('/Users/steveopenclaw/Desktop/CC-V2/.env', 'utf-8').trim();
const OUTPUT_DIR = '/Users/steveopenclaw/Desktop/CC-V2/public/showcase';

const prompts = [
  { name: '01-grwm', prompt: 'candid iPhone mirror selfie of a young woman getting ready in her bedroom, casual oversized graphic tee, curly hair, holding a makeup bag, natural messy bedroom background with dresser, warm indoor lighting, authentic get ready with me style, real looking, no makeup, casual vibe' },
  { name: '02-product', prompt: 'aesthetic product photography close up of a rose gold hair clip on a soft pink beige background, minimalist flat lay, luxury beauty product, clean commercial photography, soft shadows, high end product shot' },
  { name: '03-ugc-girl', prompt: 'close up selfie photo of a beautiful young latina woman with long dark wavy hair, wearing oversized tortoiseshell glasses, hands under chin, cute excited expression, brown sweater, looking directly at camera, natural skin, warm lighting, authentic social media selfie style' },
  { name: '04-outfit', prompt: 'full body mirror selfie of a young asian woman showing off a cute floral summer dress, standing in a bedroom doorway, natural lighting, casual pose, one hand on hip, authentic instagram outfit of the day style photo, real looking' },
  { name: '05-fashion-ad', prompt: 'dramatic fashion editorial photo of a person wearing an oversized bright blue metallic puffer jacket with ski goggles on head, dark skin, moody blue studio lighting, high fashion streetwear campaign style, bold new drop vibes, professional fashion photography' },
  { name: '06-product-luggage', prompt: 'sleek product photography of a premium black hard shell suitcase luggage on a dark moody background, orange accent details, dramatic studio lighting with rim light, luxury travel gear, commercial product shot, minimalist' },
  { name: '07-lifestyle', prompt: 'candid photo of a young woman laughing while applying lipstick in a bathroom mirror, natural morning routine, messy bun hair, tank top, warm soft bathroom lighting, authentic lifestyle content, real looking casual' },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function generate(prompt, name) {
  console.log(`\n🎨 ${name}...`);
  const r = await fetch('https://queue.fal.run/fal-ai/nano-banana-pro', {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image_size: { width: 768, height: 1024 } }),
  });
  const submit = await r.json();
  if (!submit.request_id) throw new Error(JSON.stringify(submit).substring(0,200));
  
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const s = await fetch(submit.status_url, { headers: { 'Authorization': `Key ${FAL_KEY}` } });
    const status = await s.json();
    if (status.status === 'COMPLETED') {
      const res = await fetch(submit.response_url, { headers: { 'Authorization': `Key ${FAL_KEY}` } });
      const result = await res.json();
      const images = result.images || result.output;
      if (images && images.length > 0) {
        const dest = `${OUTPUT_DIR}/${name}.jpg`;
        await downloadFile(images[0].url || images[0], dest);
        console.log(`  ✅ ${dest}`);
        return;
      }
      if (result.image?.url) {
        const dest = `${OUTPUT_DIR}/${name}.jpg`;
        await downloadFile(result.image.url, dest);
        console.log(`  ✅ ${dest}`);
        return;
      }
      throw new Error('No images found');
    }
    if (status.status === 'FAILED') throw new Error('Failed');
  }
  throw new Error('Timeout');
}

async function main() {
  console.log('=== Generating UGC-style showcase ===');
  for (const p of prompts) {
    try { await generate(p.prompt, p.name); } 
    catch (e) { console.error(`  ❌ ${e.message}`); }
  }
  console.log('\n✅ All done!');
}
main();
