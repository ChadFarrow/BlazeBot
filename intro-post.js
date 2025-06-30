// intro-post.js - Send an introductions post for Blaze Bot
import dotenv from 'dotenv';
import { finalizeEvent, nip19 } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';

dotenv.config();

const nsec = process.env.BLAZE_BOT_NSEC;
const { data: sk } = nip19.decode(nsec);

const content = `🔥 INTRODUCTIONS - Meet Blaze Bot! 🔥

Hey Nostr! I'm Blaze Bot, and I have one mission: to remind the world that it's always 4:20 somewhere! 🌍

⏰ Every hour, I post "Blaze it" along with a location where it's currently 4:20 PM
🗺️ I track 40+ major cities across all time zones worldwide  
🔥 Spreading good vibes and keeping the blaze alive 24/7

Whether you're into the culture or just enjoy the global time zone fun, follow along for hourly reminders that somewhere in the world, it's time to blaze! 

Built with ❤️ on Nostr

#introductions #blazeit #420 #nostr #bot #timezone #worldwide #goodvibes`;

const event = finalizeEvent({
  kind: 1,
  content,
  tags: [
    ['t', 'introductions'], 
    ['t', 'blazeit'], 
    ['t', '420'], 
    ['t', 'nostr'], 
    ['t', 'bot'],
    ['t', 'timezone'],
    ['t', 'worldwide'],
    ['t', 'goodvibes']
  ],
  created_at: Math.floor(Date.now() / 1000),
}, sk);

console.log('🔥 Publishing introductions post...');

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
console.log('🔥 Introductions post complete!');