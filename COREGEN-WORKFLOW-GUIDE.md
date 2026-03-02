# CoreGen — Full Platform Workflow Guide
## Every Button, Every Tool, Every Workflow

---

## TABLE OF CONTENTS
1. [Navigation Overview](#navigation)
2. [Dashboard (Discover)](#dashboard)
3. [Image Generation](#image-generation)
4. [Video Generation](#video-generation)
5. [Influencer / Avatar Training](#influencer-training)
6. [Face Enhance](#face-enhance)
7. [Face Swap](#face-swap)
8. [Image Upscale](#image-upscale)
9. [Image Editor](#image-editor)
10. [Prompt Generator](#prompt-generator)
11. [LoRA Marketplace](#lora-marketplace)
12. [Get Credits & Subscriptions](#credits-subscriptions)
13. [Affiliate Program](#affiliate)
14. [Support](#support)
15. [Settings](#settings)
16. [Credit Cost Reference](#credit-costs)
17. [Full User Journey (End-to-End)](#full-journey)

---

## 1. NAVIGATION OVERVIEW <a name="navigation"></a>

### Top Navbar
| Element | What It Does |
|---------|-------------|
| **CoreGen Logo** | Navigates back to landing page `/` |
| **Credit Counter** | Shows remaining credits (e.g. "245 credits") — click to go to Get Credits page |
| **User Avatar** | Opens profile dropdown with account settings, sign out |

### Sidebar Navigation

**OVERVIEW Section:**
| Button | Route | What It Does |
|--------|-------|-------------|
| **Discover** | `/dashboard` | Main dashboard — shows stats, quick actions, recent creations |
| **Influencers** | `/tools/influencers` | Manage your trained AI influencer models |
| **Marketplace** | `/dashboard/lora-market` | Browse and purchase community LoRA models |

**TOOLS Section:**
| Button | Route | What It Does |
|--------|-------|-------------|
| **Generate Image** | `/tools/image-generation` | Create AI images from text prompts |
| **Generate Video** | `/tools/video-generation` | Create AI videos from images or text |
| **Face Enhance** | `/tools/face-enhance` | Improve facial details and skin quality |
| **Face Swap** | `/tools/face-swap` | Swap faces between two images |
| **Upscale** | `/tools/image-upscale` | Increase image resolution (2x-4x) |
| **Edit Image** | `/tools/image-editor` | Brush-based AI image editing |
| **Generate Prompt** | `/tools/prompt-generation` | AI-powered prompt writing assistant |

**PAYMENTS Section:**
| Button | Route | What It Does |
|--------|-------|-------------|
| **Get Credits** | `/dashboard/get-credits` | Purchase credit packs or subscribe |
| **Manage Subscriptions** | `/settings` | View/change/cancel subscription plan |
| **Payment History** | `/dashboard/billing` | View all past transactions |

**OTHERS Section:**
| Button | Route | What It Does |
|--------|-------|-------------|
| **Affiliate** | `/dashboard/affiliate` | Manage referral links and commissions |
| **Support** | `/dashboard/support` | FAQ, contact support, view tickets |

---

## 2. DASHBOARD (Discover) <a name="dashboard"></a>

### What You See
The main hub showing your activity overview.

### Elements on Screen
| Element | What It Does |
|---------|-------------|
| **Stats Cards** | Shows Images Generated, Videos Created, Credits Used, Active Models |
| **Quick Action Cards** | Shortcut cards to Generate Image, Create Video, Train Model |
| **Recent Creations** | Gallery of your latest generated images and videos |
| **Influencer Carousel** | Scroll through your trained AI influencer models |

### Workflow
```
Open Dashboard → See stats → Click any Quick Action card → Jump to that tool
```

---

## 3. IMAGE GENERATION <a name="image-generation"></a>

### What It Does
Generate AI images from text prompts, optionally using your trained LoRA models for consistent character faces.

### Buttons & Controls

| Control | Options | What It Does |
|---------|---------|-------------|
| **Prompt Input** | Free text | Describe the image you want to create |
| **Model Selector** | Kontext, V1, LoRA, NanoBannaPro | Choose which AI model generates the image |
| **Aspect Ratio** | Square, Portrait 4:3, Portrait 16:9, Landscape 4:3, Landscape 16:9 | Set the dimensions of the output |
| **Number of Images** | 1-4 | How many variations to generate at once |
| **Output Format** | PNG, JPEG | File format for download |
| **Safety Level** | 1-6 | Content filtering strictness (1 = strictest) |
| **Guidance Scale** | Slider | How closely the AI follows your prompt (higher = more literal) |
| **Inference Steps** | Slider | Quality/speed tradeoff (more steps = better quality, slower) |
| **Seed** | Number | Lock a specific seed to reproduce the same result |
| **Training Photo** | Upload/Select | Use a LoRA model for face consistency |
| **Generate Button** | Click | Starts generation (costs 1 credit) |

### After Generation
| Button | What It Does |
|--------|-------------|
| **Download** | Save the image to your device |
| **Upscale** | Send to Image Upscaler tool (4 credits) |
| **Enhance** | Send to Face Enhance tool (5 credits) |
| **Regenerate** | Generate a new variation with same settings |
| **Use as Video Input** | Send to Video Generation tool |

### Full Workflow
```
1. Navigate to Generate Image
2. Type your prompt (e.g. "Professional headshot, studio lighting, confident smile")
3. Select a LoRA model if you want your AI influencer's face
4. Choose aspect ratio (e.g. Portrait 4:3 for social media)
5. Set quality (Guidance Scale ~7, Steps ~28)
6. Click "Generate Image" → 1 credit deducted
7. Wait 5-15 seconds for result
8. Download, Upscale, Enhance, or send to Video
```

---

## 4. VIDEO GENERATION <a name="video-generation"></a>

### What It Does
Create AI-generated videos from images or text prompts using multiple video AI models.

### Buttons & Controls

| Control | Options | What It Does |
|---------|---------|-------------|
| **Input Image** | Upload | Starting frame for the video |
| **Prompt** | Free text | Describe the motion/action you want |
| **Negative Prompt** | Free text | Describe what you DON'T want |
| **Video Model** | Kling, Kling Motion Control, Bytedance, Wan, Veo | Choose the AI video engine |
| **Duration** | 5s or 10s | Length of output video |
| **Aspect Ratio** | Portrait (9:16), Landscape (16:9), HD 4K (4:3) | Video dimensions |
| **CFG Scale** | Slider | Prompt adherence strength |
| **Seed** | Number | Reproducibility lock |
| **Safety Checker** | Toggle | Enable/disable content filter |
| **Generate Button** | Click | Starts generation |

### Video Model Breakdown

| Model | Duration | Credits | Best For |
|-------|----------|---------|----------|
| **Kling Standard** | 5s | 11 | General purpose, high quality |
| **Kling Standard** | 10s | 22 | Longer clips, storytelling |
| **Kling Motion Control** | 5-10s | 11-22 | Precise character movements |
| **Bytedance** | 5s | 8 | Budget-friendly, fast |
| **Bytedance** | 10s | 16 | Budget longer clips |
| **Wan 720p** | 5s | 8 | Realistic motion, audio sync |
| **Veo** | 4s | 51 | Premium cinematic quality |
| **Veo** | 8s | 101 | Premium longer format |

### After Generation
| Button | What It Does |
|--------|-------------|
| **Download MP4** | Save video to device |
| **Regenerate** | Create a new variation |

### Full Workflow
```
1. Generate an image first (or upload one)
2. Navigate to Generate Video
3. Upload your starting image
4. Write a motion prompt (e.g. "Subtle smile, gentle head turn, soft lighting")
5. Select model (Kling for quality, Bytedance for speed, Veo for cinematic)
6. Choose duration (5s or 10s)
7. Set aspect ratio (Portrait 9:16 for TikTok/Reels, Landscape 16:9 for YouTube)
8. Click "Generate Video" → Credits deducted based on model
9. Wait 30-120 seconds for result
10. Download MP4
```

---

## 5. INFLUENCER / AVATAR TRAINING <a name="influencer-training"></a>

### What It Does
Train a custom AI model (LoRA) on your face or a character's face so you can generate consistent images and videos of that person.

### Creation Steps

**Step 1: Basic Info**
| Field | What It Does |
|-------|-------------|
| **Name** | Name your AI influencer |
| **Description** | Describe the character |
| **Gender** | Male / Female — helps the AI understand the face |
| **Mode** | Character, Product, Style, General — what type of model |
| **Content Type** | SFW / NSFW — content classification |
| **Public/Private** | Whether other users can see/purchase this model |

**Step 2: Advanced Settings (Admin Only)**
| Field | What It Does |
|-------|-------------|
| **Learning Rate** | How fast the AI learns (default 0.00005, lower = more accurate) |
| **Steps** | Training iterations (more = better quality, longer training) |

**Step 3: Upload Training Photos**
| Control | What It Does |
|---------|-------------|
| **Upload Area** | Drag & drop or click to upload 8-10 reference photos |
| **Requirements** | Clear face shots, different angles, good lighting, consistent person |

**Step 4: Train**
| Button | What It Does |
|--------|-------------|
| **Train Influencer** | Starts LoRA training (67-72 credits depending on plan) |

### After Training
| Action | What It Does |
|--------|-------------|
| **Use in Image Gen** | Select this LoRA when generating images for face consistency |
| **Use in Video Gen** | Generate videos featuring this character |
| **List on Marketplace** | If public, others can purchase your model |
| **Generate Intro Video** | Auto-create a showcase video of the avatar |

### Full Workflow
```
1. Navigate to Influencers
2. Click "Create New Influencer"
3. Fill in name, description, gender, mode
4. Upload 8-10 high-quality face photos
   - Different angles (front, 3/4, side)
   - Different expressions
   - Good lighting, clear face
   - Same person in every photo
5. Click "Train Influencer" → 67-72 credits
6. Wait 15-30 minutes for training to complete
7. Your LoRA model is now available in Image Generation
8. Go to Generate Image → Select your LoRA → Generate consistent content
```

---

## 6. FACE ENHANCE <a name="face-enhance"></a>

### What It Does
AI-powered facial enhancement — improves skin texture, facial details, and overall image quality.

### Controls

| Control | What It Does |
|---------|-------------|
| **Upload Image** | Select the photo to enhance |
| **Guidance Scale** | How aggressively to enhance (higher = more noticeable changes) |
| **Inference Steps** | Quality of enhancement processing |
| **Output Format** | PNG or JPEG |
| **Aspect Ratio** | Maintain or change dimensions |
| **Safety Level** | Content filter (1-6) |
| **Enhance Button** | Start processing (5 credits) |

### Full Workflow
```
1. Navigate to Face Enhance
2. Upload a generated or real photo
3. Adjust guidance scale (start at default)
4. Click "Enhance" → 5 credits
5. Wait 10-20 seconds
6. Download enhanced result
7. Compare before/after
```

---

## 7. FACE SWAP <a name="face-swap"></a>

### What It Does
Swap one person's face onto another person's body/photo.

### Controls

| Control | What It Does |
|---------|-------------|
| **Source Face** | Upload the face you want to USE |
| **Target Image** | Upload the image you want to put the face ON |
| **Source Gender** | Male/Female for the source face |
| **Target Gender** | Male/Female for the target |
| **Workflow Type** | `user_hair` (keep source hair) or `target_hair` (keep target hair) |
| **2x Upscale** | Toggle to upscale the result |
| **Face Detailer** | Toggle for extra facial detail processing |
| **Swap Button** | Start processing |

### Full Workflow
```
1. Navigate to Face Swap
2. Upload SOURCE face (the face you want to transfer)
3. Upload TARGET image (the body/scene to put the face on)
4. Select genders for both
5. Choose workflow type:
   - user_hair: Face + hair from source
   - target_hair: Only face from source, keep target's hair
6. Toggle 2x Upscale if you want higher resolution
7. Click "Swap" → Credits deducted
8. Wait 15-30 seconds
9. Download result
```

---

## 8. IMAGE UPSCALE <a name="image-upscale"></a>

### What It Does
Increase image resolution by 2x-4x using AI upscaling.

### Controls

| Control | What It Does |
|---------|-------------|
| **Upload Image** | Select image to upscale |
| **Scale Factor** | How much to enlarge (2x, 4x) |
| **Steps** | Processing quality |
| **Dynamic** | Adaptive detail enhancement |
| **Creativity** | How much the AI can "fill in" new details |
| **Resemblance** | How closely to match the original |
| **Prompt Adherence** | If using a text prompt, how closely to follow it |
| **Safety Filter** | Content filtering toggle |
| **Upscale Button** | Start processing (4 credits) |

### Full Workflow
```
1. Navigate to Upscale
2. Upload your image
3. Set scale factor (2x for most cases, 4x for small images)
4. Adjust creativity (low = faithful, high = AI-enhanced details)
5. Click "Upscale" → 4 credits
6. Wait 15-30 seconds
7. Download high-res result
```

---

## 9. IMAGE EDITOR <a name="image-editor"></a>

### What It Does
Brush-based AI image editing — paint over areas you want to change, describe what you want, and the AI fills it in.

### Controls

| Control | What It Does |
|---------|-------------|
| **Upload Image** | Base image to edit |
| **Brush Tool** | Paint over the area you want to change |
| **Prompt** | Describe what should replace the brushed area |
| **Strength** | How much to change (low = subtle, high = dramatic) |
| **Steps** | Processing quality |
| **Adherence** | How closely to follow your prompt |
| **Edit Button** | Apply the edit (4 credits) |

### Full Workflow
```
1. Navigate to Edit Image
2. Upload the image you want to modify
3. Use the brush to paint over the area to change
   (e.g. paint over the shirt to change clothing)
4. Type what you want in that area (e.g. "red leather jacket")
5. Adjust strength (0.5-0.8 for natural results)
6. Click "Edit" → 4 credits
7. Wait 10-20 seconds
8. Download edited image
```

---

## 10. PROMPT GENERATOR <a name="prompt-generator"></a>

### What It Does
AI-powered prompt writing assistant — generates optimized prompts for image and video generation.

### Controls

| Control | Options | What It Does |
|---------|---------|-------------|
| **Topic/Idea** | Free text | Describe what you want (e.g. "beach photoshoot") |
| **AI Model** | Claude 3.5 Sonnet, GPT-4o, Gemini Pro, Llama, Deepseek | Which LLM writes the prompt |
| **Style** | Minimalist, Simple, Detailed, Descriptive, Dynamic, Cinematic, Documentary, Animation, Action, Experimental | Visual style direction |
| **Camera Style** | Steadicam, Drone, Handheld, Crane, Dolly, VR 360, etc. (15 options) | Camera movement type |
| **Camera Direction** | Zoom in/out, Pan left/right, Tilt up/down, Orbital, Push in/Pull out, etc. (16 options) | Specific camera movement |
| **Pacing** | Slow burn, Rhythmic, Frantic, Hypnotic, Time-lapse, etc. (14 options) | Video rhythm/tempo |
| **Special Effects** | Practical, CGI, Glitches, Light painting, Particles, Holographic, etc. (19 options) | VFX additions |
| **Prompt Length** | Short, Medium, Long | Output verbosity |
| **Generate Button** | Click | Create the prompt (1 credit) |

### After Generation
| Button | What It Does |
|--------|-------------|
| **Copy to Clipboard** | Copy the generated prompt |
| **Use in Image Gen** | Send directly to Image Generation tool |
| **Optimize** | Run the prompt through the Prompt Optimizer (1 credit) |
| **Regenerate** | Get a new variation |

### Full Workflow
```
1. Navigate to Generate Prompt
2. Describe your idea (e.g. "luxury fashion editorial on a rooftop at sunset")
3. Select style: Cinematic
4. Select camera: Drone aerials
5. Select direction: Orbital rotation
6. Select pacing: Slow burn
7. Select effects: Light painting
8. Choose length: Long
9. Click "Generate" → 1 credit
10. Review the AI-written prompt
11. Copy it → Paste into Image Generation
12. Or click "Optimize" for a refined version → 1 additional credit
```

---

## 11. LORA MARKETPLACE <a name="lora-marketplace"></a>

### What It Does
Browse, preview, and purchase community-created LoRA models to use in your image generation.

### Elements

| Element | What It Does |
|---------|-------------|
| **Browse Grid** | See all available public LoRA models |
| **Preview Images** | See sample outputs from each model |
| **Model Details** | View training info, creator, and description |
| **Purchase Button** | Buy the LoRA to use in your generations |
| **Use in Gen** | After purchase, select it in Image Generation |

### Full Workflow
```
1. Navigate to Marketplace
2. Browse available LoRA models
3. Click on one to see preview images and details
4. Click "Purchase" to add it to your account
5. Go to Generate Image → Select the purchased LoRA
6. Generate images with that model's style/face
```

---

## 12. GET CREDITS & SUBSCRIPTIONS <a name="credits-subscriptions"></a>

### Subscription Plans

| Plan | Monthly Price | Quarterly Price | Credits/Month | Avatar Slots |
|------|-------------|----------------|---------------|-------------|
| **Free** | $0 | — | 30 | 0 |
| **Basic** | $29.95 | $55.95 | 300 | 1 |
| **Pro** | $69.99 | $129.95 | 650 | 3 |
| **Elite** | $129.99 | $229.95 | 1,500 | 5 |

### Credit Packs (One-Time Purchase)

| Pack | Credits | Price | Per Credit |
|------|---------|-------|-----------|
| **Starter** | 50 | $10 | $0.20 |
| **Creator** | 139 | $25 | $0.18 |
| **Pro** | 350 | $50 | $0.14 |
| **Extra** | 800 | $100 | $0.13 |
| **Master** | 2,381 | $250 | $0.10 |

### Buttons

| Button | What It Does |
|--------|-------------|
| **Subscribe** | Start a monthly/quarterly subscription |
| **Buy Credits** | One-time credit pack purchase |
| **Manage Subscription** | View/change/cancel current plan |
| **Update Payment** | Change payment method |

---

## 13. AFFILIATE PROGRAM <a name="affiliate"></a>

### What It Does
Earn 20% commission on every purchase made by users you refer.

### Elements

| Element | What It Does |
|---------|-------------|
| **Your Referral Link** | Unique URL to share (e.g. `https://coregen.ai/?ref=yourcode`) |
| **Copy Link** | Copy referral URL to clipboard |
| **Stats Cards** | Total referred users, active buyers, total commission earned |
| **Request Payout** | Submit a payout request (minimum $50) |
| **Social Post Templates** | Pre-written posts to share on social media |

### Details
- **Commission**: 20% of every purchase
- **Cookie Duration**: 90 days (referral stays active)
- **Payout Methods**: PayPal or bank transfer
- **Minimum Payout**: $50

---

## 14. SUPPORT <a name="support"></a>

### Tabs

| Tab | What It Does |
|-----|-------------|
| **FAQ** | Searchable frequently asked questions |
| **Contact Support** | Opens live chat (Crisp) |
| **My Tickets** | View submitted support tickets |

### Response Times
| Plan | Response Time |
|------|-------------|
| Basic | 48 hours |
| Pro | 24 hours |
| Elite | 12 hours |

---

## 15. SETTINGS <a name="settings"></a>

### Elements

| Element | What It Does |
|---------|-------------|
| **Current Plan** | Shows your active subscription with next billing date |
| **Subscription Button** | Manage/cancel subscription via payment provider |
| **Available Plans** | View and switch between Free/Basic/Pro/Elite |
| **Cancellation Notice** | Warning about what you lose when canceling |

---

## 16. CREDIT COST REFERENCE <a name="credit-costs"></a>

| Tool | Credits per Use |
|------|----------------|
| **Generate Image** | 1 |
| **Generate Video (Bytedance 5s)** | 8 |
| **Generate Video (Wan 720p)** | 8 |
| **Generate Video (Kling 5s)** | 11 |
| **Generate Video (Bytedance 10s)** | 16 |
| **Generate Video (Kling 10s)** | 22 |
| **Generate Video (Veo 4s)** | 51 |
| **Generate Video (Veo 8s)** | 101 |
| **Face Enhance** | 5 |
| **Face Swap** | Varies |
| **Image Upscale** | 4 |
| **Image Editor** | 4 |
| **Prompt Generator** | 1 |
| **Prompt Optimizer** | 1 |
| **Avatar Training** | 67-72 |
| **Avatar to Video** | 11 |

---

## 17. FULL USER JOURNEY (End-to-End) <a name="full-journey"></a>

### The Complete Content Creation Pipeline

```
STEP 1: SIGN UP & SUBSCRIBE
├── Create account (Clerk auth)
├── Complete onboarding slideshow (5 steps)
├── Choose a plan (Free to start, Pro recommended)
└── Get your monthly credits

STEP 2: TRAIN YOUR AI INFLUENCER
├── Go to Influencers → Create New
├── Upload 8-10 clear face photos
├── Set name, gender, mode
├── Click "Train" → 67-72 credits
├── Wait 15-30 minutes
└── LoRA model ready to use

STEP 3: GENERATE IMAGES
├── Go to Generate Image
├── Select your trained LoRA model
├── Write prompt (or use Prompt Generator first → 1 credit)
├── Set aspect ratio, quality settings
├── Click "Generate" → 1 credit
├── Download or send to next step
└── Repeat for different poses, outfits, scenarios

STEP 4: ENHANCE & EDIT
├── Face Enhance → Fix skin, sharpen details → 5 credits
├── Image Upscale → Increase resolution for print/ads → 4 credits
├── Image Editor → Change outfit, background, accessories → 4 credits
└── Face Swap → Put your face on a different body/scene → varies

STEP 5: CREATE VIDEOS
├── Go to Generate Video
├── Upload your best generated image as starting frame
├── Write motion prompt ("subtle smile, gentle head turn")
├── Choose model and duration
│   ├── Quick social clip: Bytedance 5s → 8 credits
│   ├── Quality social post: Kling 5s → 11 credits
│   ├── Extended content: Kling 10s → 22 credits
│   └── Cinematic quality: Veo 4-8s → 51-101 credits
├── Click "Generate" → wait 30-120 seconds
└── Download MP4

STEP 6: PUBLISH & MONETIZE
├── Post content to social media platforms
├── Use Affiliate program to earn referral income
├── Share your LoRA on Marketplace to earn from other creators
└── Rinse and repeat!
```

### Quick Reference: "I want to..."

| I want to... | Go to | Credits |
|--------------|-------|---------|
| Create a photo of my AI character | Image Gen + LoRA | 1 |
| Make a TikTok/Reel video | Video Gen (Kling 5s, Portrait 9:16) | 11 |
| Fix blurry skin on a photo | Face Enhance | 5 |
| Make my image higher resolution | Upscale | 4 |
| Change the outfit in a photo | Image Editor (brush + prompt) | 4 |
| Put my face on a stock photo | Face Swap | varies |
| Get help writing a good prompt | Prompt Generator | 1 |
| Create a new AI character from scratch | Influencer Training | 67-72 |
| Turn a photo into a YouTube video | Video Gen (Kling 10s, Landscape 16:9) | 22 |
| Get the best possible video quality | Video Gen (Veo 8s) | 101 |
| Earn money referring friends | Affiliate Dashboard | free |
| Browse other people's AI models | LoRA Marketplace | purchase price |

---

## COMPARISON: CoreGen vs Higgsfield

| Feature | CoreGen (Current) | Higgsfield |
|---------|-------------------|-----------|
| Image Generation | Flux Pro, LoRA, NanoBanna | Nano Banana Pro, Seedream, Flux Kontext, GPT Image |
| Video Generation | Kling, Bytedance, Wan, Veo | Kling 2.5/2.6/3.0, Sora 2, Veo 3, WAN 2.5, Seedance, MiniMax |
| Avatar/Character | LoRA Training | Soul ID, AI Influencer Studio |
| Face Swap | Yes | Yes (Recast, Character Swap 2.0) |
| Face Enhance | Yes | Skin Enhancer |
| Image Upscale | Yes | Topaz, Video Upscale, Sora 2 Upscale |
| Image Edit | Brush-based inpaint | Edit Image, Draw to Edit, Inpaint |
| Prompt Tools | Multi-model AI prompt gen | Higgsfield Assist (GPT-5) |
| Camera Presets | 16 direction options | 80+ cinema presets (Bullet Time, Crash Zoom, etc.) |
| VFX Library | Special effects in prompts | 150+ named VFX effects |
| Mixed Media | Not yet | 130+ style presets |
| Cinema Studio | Not yet | 3D scene control, lens simulation |
| Lipsync | Not yet | Lipsync Studio |
| Talking Avatars | Not yet | Kling Avatars 2.0 |
| Apps/Presets | Not yet | 100+ specialized mini-apps |
| Community | Not yet | Mixed media, Sora 2, Wan communities |
| Contests | Not yet | $500K action video contest |
| Mobile App | Not yet | Diffuse app (iOS/Android) |

### Key Gaps to Consider Building
1. **Cinema Studio** — 3D scene + camera lens control (major differentiator)
2. **VFX Presets Library** — Named effects users can one-click apply
3. **Lipsync Studio** — Talking head videos from text/audio
4. **Mini-Apps** — Pre-built one-click workflows (Click to Ad, Outfit Swap, etc.)
5. **Community/Gallery** — User showcase + social features
6. **Camera Presets** — Expand from 16 to 70+ named cinema presets
7. **Mixed Media Styles** — One-click style transfer (Sketch, Comic, Noir, etc.)
8. **Contests** — Community engagement through competitions

---

*Generated for CoreGen V2 — AI Content Creation Platform*
