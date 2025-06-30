// generate-keys.js - Generate Nostr keys for Blaze Bot
import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { nip19 } from 'nostr-tools';

console.log('🔥 Generating new Nostr keys for Blaze Bot...\n');

// Generate a new private key
const secretKey = generateSecretKey();

// Get the corresponding public key
const publicKey = getPublicKey(secretKey);

// Encode in bech32 format
const nsec = nip19.nsecEncode(secretKey);
const npub = nip19.npubEncode(publicKey);

console.log('🔑 New Nostr Keys Generated:');
console.log('================================');
console.log(`Private Key (nsec): ${nsec}`);
console.log(`Public Key (npub):  ${npub}`);
console.log('================================\n');

console.log('📝 Setup Instructions:');
console.log('1. Copy the nsec (private key) above');
console.log('2. Set it as environment variable:');
console.log(`   export BLAZE_BOT_NSEC="${nsec}"`);
console.log('3. Or add it to your .env file:');
console.log(`   BLAZE_BOT_NSEC=${nsec}`);
console.log('\n🔒 Keep your private key (nsec) secret!');
console.log('📢 Share your public key (npub) to let others follow the bot');

// Also save to a keys file for reference
const keysData = {
  generated: new Date().toISOString(),
  privateKey: nsec,
  publicKey: npub,
  note: "Keep the private key secret! This is for the Blaze Bot."
};

import { writeFileSync } from 'fs';
writeFileSync('blaze-bot-keys.json', JSON.stringify(keysData, null, 2));
console.log('\n💾 Keys saved to blaze-bot-keys.json (keep this file secure!)');