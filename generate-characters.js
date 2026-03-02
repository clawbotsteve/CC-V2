const fs = require('fs');
const https = require('https');

const FAL_KEY = fs.readFileSync('/Users/steveopenclaw/Desktop/CC-V2/.env', 'utf-8').trim();
const OUTPUT_DIR = '/Users/steveopenclaw/Desktop/CC-V2/CC-Content/characters';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const characters = [
  { name: 'luna', prompt: 'professional headshot portrait of a stunning young woman early 20s, long dark wavy hair, warm brown eyes, soft natural makeup, slight confident smile, wearing a white off-shoulder top, clean studio background with soft gradient, beauty influencer aesthetic, photorealistic, high quality portrait photography, soft lighting' },
  { name: 'atlas', prompt: 'professional headshot portrait of a handsome young man mid 20s, sharp jawline, short styled dark hair with slight fade, light stubble, intense blue eyes, wearing a fitted black crew neck t-shirt, clean studio background, male model aesthetic, photorealistic, high quality portrait photography, dramatic lighting' },
  { name: 'pixel', prompt: 'professional headshot portrait of an AI robot humanoid with smooth white metallic skin, glowing blue LED eyes, sleek futuristic design, subtle circuitry patterns on the temples, friendly expression, clean dark studio background with blue rim lighting, sci-fi aesthetic, photorealistic, high quality, cyberpunk' },
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
    body: JSON.stringify({ prompt, image_size: { width: 768, height: 768 } }),
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
      if (result.images?.length > 0) {
        const dest = `${OUTPUT_DIR}/${name}.jpg`;
        await downloadFile(result.images[0].url, dest);
        console.log(`  ✅ ${dest}`);
        return;
      }
    }
    if (status.status === 'FAILED') throw new Error('Failed');
  }
}

async function main() {
  for (const c of characters) {
    try { await generate(c.prompt, c.name); }
    catch (e) { console.error(`  ❌ ${e.message}`); }
  }
  console.log('\n✅ Done!');
}
main();
