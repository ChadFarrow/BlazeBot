// test-new-format.js - Test the new AM/PM format
import dotenv from 'dotenv';
import { finalizeEvent, nip19 } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';

dotenv.config();

const nsec = process.env.BLAZE_BOT_NSEC;
const { data: sk } = nip19.decode(nsec);

// Create a test post with the new format
const content = `🔥 BLAZE IT! 🔥

🌅 4:20 AM in Tokyo, Japan

🌇 4:20 PM in New York, New York

Testing the new AM/PM format with better spacing! 

#blazeit #420 #nostr #worldwide #test`;

const event = finalizeEvent({
  kind: 1,
  content,
  tags: [
    ['t', 'blazeit'], 
    ['t', '420'], 
    ['t', 'nostr'], 
    ['t', 'worldwide'],
    ['t', 'test']
  ],
  created_at: Math.floor(Date.now() / 1000),
}, sk);

console.log('🔥 Publishing test post with new AM/PM format...');

const relays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nostr.mom', 'wss://relay.primal.net'];
const publishPromises = relays.map(async (relayUrl) => {
  try {
    console.log(`Connecting to ${relayUrl}`);
    const relay = await Relay.connect(relayUrl);
    await relay.publish(event);
    relay.close();
    console.log(`✅ Successfully published to ${relayUrl}`);
  } catch (error) {
    console.error(`❌ Failed to publish to ${relayUrl}:`, error?.message);
  }
});

await Promise.allSettled(publishPromises);
console.log('🔥 Test post with new AM/PM format complete!');