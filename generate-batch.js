const fs = require('fs');
const https = require('https');

const FAL_KEY = fs.readFileSync('/Users/steveopenclaw/Desktop/CC-V2/.env', 'utf-8').trim();
const OUTPUT_DIR = '/Users/steveopenclaw/Desktop/CC-V2/CC-Content';

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

async function submitAndWait(endpoint, body, name, ext = 'jpg') {
  console.log(`\n🎨 ${name}...`);
  const r = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${FAL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const submit = await r.json();
  if (!submit.request_id) {
    console.log(`  Error: ${JSON.stringify(submit).substring(0, 300)}`);
    throw new Error('No request_id');
  }
  console.log(`  Queued: ${submit.request_id}`);

  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const s = await fetch(submit.status_url, { headers: { 'Authorization': `Key ${FAL_KEY}` } });
    const status = await s.json();
    if (i % 4 === 0) console.log(`  [${i * 5}s] ${status.status}`);
    if (status.status === 'COMPLETED') {
      const res = await fetch(submit.response_url, { headers: { 'Authorization': `Key ${FAL_KEY}` } });
      const result = await res.json();
      
      // Images
      if (result.images && result.images.length > 0) {
        const dest = `${OUTPUT_DIR}/${name}.${ext}`;
        await downloadFile(result.images[0].url, dest);
        console.log(`  ✅ ${dest}`);
        return dest;
      }
      // Video
      if (result.video && result.video.url) {
        const dest = `${OUTPUT_DIR}/${name}.mp4`;
        await downloadFile(result.video.url, dest);
        console.log(`  ✅ ${dest}`);
        return dest;
      }
      // Try other formats
      console.log(`  Result keys: ${Object.keys(result)}`);
      console.log(`  ${JSON.stringify(result).substring(0, 500)}`);
      throw new Error('Could not find media in result');
    }
    if (status.status === 'FAILED') throw new Error('Generation failed');
  }
  throw new Error('Timeout');
}

// Convert model-1.png to base64 data URL for video gen
function imageToDataUrl(path) {
  const data = fs.readFileSync(path);
  const base64 = data.toString('base64');
  const ext = path.endsWith('.png') ? 'png' : 'jpeg';
  return `data:image/${ext};base64,${base64}`;
}

// Upload image to fal storage
async function uploadImage(path) {
  const data = fs.readFileSync(path);
  const r = await fetch('https://fal.run/fal-ai/any/upload', {
    method: 'PUT',
    headers: { 
      'Authorization': `Key ${FAL_KEY}`, 
      'Content-Type': 'image/png',
    },
    body: data,
  });
  if (r.ok) {
    const result = await r.json();
    return result.url;
  }
  // Fallback: use data URL
  return imageToDataUrl(path);
}

async function main() {
  console.log('=== Tavira Labs Batch Generation ===\n');

  // 1. Nano Banana Pro - Attractive AI influencer with handbag
  try {
    await submitAndWait('fal-ai/nano-banana-pro', {
      prompt: 'stunning attractive young female AI influencer, early 20s, long flowing hair, perfect skin, glamorous natural makeup, wearing a chic designer outfit, holding a luxury leather handbag in her hand, city street background with soft bokeh, golden hour lighting, fashion editorial photography style, full body shot, confident pose, looking at camera with a slight smile, ultra realistic, high quality portrait photography',
      image_size: { width: 768, height: 1024 },
    }, 'influencer-handbag');
  } catch (e) { console.error(`  ❌ ${e.message}`); }

  // 2. Kling v2.5 - Talking head video from model-1
  try {
    const modelPath = `${OUTPUT_DIR}/model-1.png`;
    const imageUrl = imageToDataUrl(modelPath);
    
    await submitAndWait('fal-ai/kling-video/v2.5/standard/image-to-video', {
      image_url: imageUrl,
      prompt: 'a young woman talking directly to camera, natural head movements, subtle expressions, slight smile, casual conversation, natural lip movement as if speaking, warm indoor lighting, smooth motion',
      duration: '5',
      aspect_ratio: '9:16',
    }, 'talking-head-model1', 'mp4');
  } catch (e) { console.error(`  ❌ ${e.message}`); }

  // 3. Nano Banana Pro - Female influencer lifestyle 1
  try {
    await submitAndWait('fal-ai/nano-banana-pro', {
      prompt: 'beautiful young female influencer in her mid 20s at a luxury rooftop restaurant at sunset, wearing an elegant summer dress, glass of wine on table, city skyline in background, warm golden hour lighting, candid lifestyle photography, natural smile, soft skin texture, shallow depth of field, high quality realistic photo, instagram lifestyle aesthetic',
      image_size: { width: 768, height: 1024 },
    }, 'lifestyle-rooftop');
  } catch (e) { console.error(`  ❌ ${e.message}`); }

  // 4. Nano Banana Pro - Female influencer lifestyle 2
  try {
    await submitAndWait('fal-ai/nano-banana-pro', {
      prompt: 'gorgeous young female influencer early 20s doing yoga on a balcony overlooking the ocean at sunrise, wearing stylish athletic wear, peaceful serene expression, tropical setting with palm trees, beautiful natural lighting, fitness lifestyle photography, toned body, real skin texture, high quality candid photo, wellness influencer content',
      image_size: { width: 768, height: 1024 },
    }, 'lifestyle-yoga');
  } catch (e) { console.error(`  ❌ ${e.message}`); }

  console.log('\n=== All done! ===');
}

main();
