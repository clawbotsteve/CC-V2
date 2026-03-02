import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix for __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceEnvPath = path.resolve(__dirname, '../../cc-ai-landing/.env');
const targetEnvPath = path.resolve(__dirname, '../.env');
const targetEnvPathLocal = path.resolve(__dirname, '../.env.local');

if (!fs.existsSync(sourceEnvPath)) {
  console.error('❌ Landing Page .env file not found');
  process.exit(1);
}

const sourceEnv = dotenv.parse(fs.readFileSync(sourceEnvPath));
const baseUrl = sourceEnv['NEXT_PUBLIC_APP_URL'];

if (!baseUrl) {
  console.error('❌ NEXT_PUBLIC_APP_URL not found in Project A .env');
  process.exit(1);
}

let targetEnv: Record<string, string> = {};
if (fs.existsSync(targetEnvPath)) {
  targetEnv = dotenv.parse(fs.readFileSync(targetEnvPath));
}

const trimmedBaseUrl = baseUrl.replace(/\/+$/, '');
targetEnv['NEXT_PUBLIC_CLERK_SIGN_IN_URL'] = `${trimmedBaseUrl}/sign-in`;
targetEnv['NEXT_PUBLIC_CLERK_SIGN_UP_URL'] = `${trimmedBaseUrl}/sign-up`;

const envLines = Object.entries(targetEnv).map(([key, value]) => `${key}=${value}`);

try {
  fs.writeFileSync(targetEnvPathLocal, envLines.join('\n') + '\n');
  console.log('✅ Synced Clerk URLs to .env at:', targetEnvPathLocal);

  const writtenContent = fs.readFileSync(targetEnvPathLocal, 'utf-8');
  console.log('📄 .env content:\n', writtenContent);
} catch (error) {
  console.error('❌ Failed to write .env:', error);
  process.exit(1);
}
