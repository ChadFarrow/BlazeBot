// blaze-bot.js - Blaze Bot that posts "Blaze it" every hour with a location where it's 4:20 PM
import dotenv from 'dotenv';
import { finalizeEvent, nip19 } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';

dotenv.config();

class BlazeBot {
  constructor(nsec, relays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nostr.mom', 'wss://relay.primal.net']) {
    this.nsec = nsec;
    this.relays = relays;
    this.worldCities = [
      // Major cities across all time zones
      { name: "Los Angeles, California", offset: -8 },
      { name: "Denver, Colorado", offset: -7 },
      { name: "Chicago, Illinois", offset: -6 },
      { name: "New York, New York", offset: -5 },
      { name: "São Paulo, Brazil", offset: -3 },
      { name: "London, England", offset: 0 },
      { name: "Berlin, Germany", offset: 1 },
      { name: "Cairo, Egypt", offset: 2 },
      { name: "Moscow, Russia", offset: 3 },
      { name: "Dubai, UAE", offset: 4 },
      { name: "Mumbai, India", offset: 5.5 },
      { name: "Bangkok, Thailand", offset: 7 },
      { name: "Beijing, China", offset: 8 },
      { name: "Tokyo, Japan", offset: 9 },
      { name: "Sydney, Australia", offset: 10 },
      { name: "Auckland, New Zealand", offset: 12 },
      { name: "Honolulu, Hawaii", offset: -10 },
      { name: "Anchorage, Alaska", offset: -9 },
      { name: "Mexico City, Mexico", offset: -6 },
      { name: "Buenos Aires, Argentina", offset: -3 },
      { name: "Lagos, Nigeria", offset: 1 },
      { name: "Johannesburg, South Africa", offset: 2 },
      { name: "Istanbul, Turkey", offset: 3 },
      { name: "Singapore", offset: 8 },
      { name: "Seoul, South Korea", offset: 9 },
      { name: "Perth, Australia", offset: 8 },
      { name: "Vancouver, Canada", offset: -8 },
      { name: "Toronto, Canada", offset: -5 },
      { name: "Paris, France", offset: 1 },
      { name: "Rome, Italy", offset: 1 },
      { name: "Madrid, Spain", offset: 1 },
      { name: "Amsterdam, Netherlands", offset: 1 },
      { name: "Stockholm, Sweden", offset: 1 },
      { name: "Helsinki, Finland", offset: 2 },
      { name: "Warsaw, Poland", offset: 1 },
      { name: "Prague, Czech Republic", offset: 1 },
      { name: "Vienna, Austria", offset: 1 },
      { name: "Zurich, Switzerland", offset: 1 }
    ];
  }

  getSecretKey() {
    // In test mode, generate a valid test key
    if (process.env.TEST_MODE === 'true') {
      // Generate a valid 32-byte private key for testing
      const testKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        testKey[i] = Math.floor(Math.random() * 256);
      }
      // Ensure it's a valid private key (not zero and less than curve order)
      testKey[0] = Math.max(1, testKey[0]); // Ensure not zero
      testKey[31] = Math.min(254, testKey[31]); // Keep it well below curve order
      return testKey;
    }
    
    try {
      const { data } = nip19.decode(this.nsec);
      return data;
    } catch {
      throw new Error('Invalid nsec format');
    }
  }

  getCurrentTime420Locations() {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    
    // Find cities where it's currently 4:20 AM (04:20)
    const am420Locations = this.worldCities.filter(city => {
      const localHour = (utcHour + city.offset + 24) % 24;
      return localHour === 4 && utcMinute === 20;
    });
    
    // Find cities where it's currently 4:20 PM (16:20)
    const pm420Locations = this.worldCities.filter(city => {
      const localHour = (utcHour + city.offset + 24) % 24;
      return localHour === 16 && utcMinute === 20;
    });
    
    // If no exact matches, find fallback cities in 4 AM/PM hours
    let fallbackAM = [];
    let fallbackPM = [];
    
    if (am420Locations.length === 0) {
      const am4HourCities = this.worldCities.filter(city => {
        const localHour = (utcHour + city.offset + 24) % 24;
        return localHour === 4;
      });
      if (am4HourCities.length > 0) {
        fallbackAM = [am4HourCities[Math.floor(Math.random() * am4HourCities.length)]];
      }
    }
    
    if (pm420Locations.length === 0) {
      const pm4HourCities = this.worldCities.filter(city => {
        const localHour = (utcHour + city.offset + 24) % 24;
        return localHour === 16;
      });
      if (pm4HourCities.length > 0) {
        fallbackPM = [pm4HourCities[Math.floor(Math.random() * pm4HourCities.length)]];
      }
    }
    
    return {
      am: am420Locations.length > 0 ? am420Locations : fallbackAM,
      pm: pm420Locations.length > 0 ? pm420Locations : fallbackPM,
      exactMatch: am420Locations.length > 0 || pm420Locations.length > 0
    };
  }

  async publishToRelays(event) {
    // Test mode - just log what would be posted without actually posting
    if (process.env.TEST_MODE === 'true') {
      console.log('TEST MODE - Would post to relays:', { 
        content: event.content,
        tags: event.tags,
        relays: this.relays 
      });
      return;
    }

    console.log(`🔥 Publishing to ${this.relays.length} relays`);
    
    const publishPromises = this.relays.map(async (relayUrl) => {
      try {
        console.log(`Connecting to ${relayUrl}`);
        const relay = await Relay.connect(relayUrl);
        console.log(`Publishing to ${relayUrl}`);
        await relay.publish(event);
        relay.close();
        console.log(`✅ Successfully published to ${relayUrl}`);
      } catch (error) {
        console.error(`❌ Failed to publish to ${relayUrl}:`, error?.message || error);
      }
    });

    await Promise.allSettled(publishPromises);
  }

  async postBlazeMessage() {
    const sk = this.getSecretKey();
    const locations = this.getCurrentTime420Locations();
    
    let locationText = "🔥 BLAZE IT! 🔥\n\n";
    
    // Add AM locations
    if (locations.am.length > 0) {
      const amNames = locations.am.map(loc => loc.name);
      const amTime = locations.exactMatch && locations.am.some(loc => 
        this.worldCities.includes(loc)) ? "4:20 AM" : "4:00 AM hour";
      locationText += `🌅 ${amTime} in ${amNames.join(', ')}\n`;
    }
    
    // Add blank line between AM and PM if both exist
    if (locations.am.length > 0 && locations.pm.length > 0) {
      locationText += "\n";
    }
    
    // Add PM locations  
    if (locations.pm.length > 0) {
      const pmNames = locations.pm.map(loc => loc.name);
      const pmTime = locations.exactMatch && locations.pm.some(loc => 
        this.worldCities.includes(loc)) ? "4:20 PM" : "4:00 PM hour";
      locationText += `🌇 ${pmTime} in ${pmNames.join(', ')}\n`;
    }
    
    // Fallback if no locations found
    if (locations.am.length === 0 && locations.pm.length === 0) {
      locationText += "Somewhere in the world, it's always 4:20! 🌍\n";
    }
    
    locationText += "\n#blazeit #420 #nostr #worldwide";

    const event = finalizeEvent({
      kind: 1,
      content: locationText,
      tags: [
        ['t', 'blazeit'],
        ['t', '420'],
        ['t', 'nostr'],
        ['t', 'worldwide'],
      ],
      created_at: Math.floor(Date.now() / 1000),
    }, sk);

    await this.publishToRelays(event);
    
    const logMsg = [];
    if (locations.am.length > 0) logMsg.push(`AM: ${locations.am.map(l => l.name).join(', ')}`);
    if (locations.pm.length > 0) logMsg.push(`PM: ${locations.pm.map(l => l.name).join(', ')}`);
    console.log(`🔥 Posted: ${logMsg.join(' | ')}`);
  }

  start() {
    console.log('🔥 Starting Blaze Bot...');
    console.log(`🔥 Bot will post every hour`);
    
    if (process.env.TEST_MODE === 'true') {
      console.log('🧪 Running in TEST MODE - no actual posts will be made');
    }

    // Post immediately on start
    this.postBlazeMessage();
    
    // Then post every hour (3600000 ms)
    setInterval(() => {
      this.postBlazeMessage();
    }, 3600000);
  }
}

// Create and start the bot
function createBlazeBot() {
  const botNsec = process.env.BLAZE_BOT_NSEC;
  
  if (!botNsec) {
    console.error('❌ BLAZE_BOT_NSEC environment variable not set');
    console.error('Please set your Nostr private key: export BLAZE_BOT_NSEC=nsec1...');
    process.exit(1);
  }

  return new BlazeBot(botNsec);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔥 Blaze Bot shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔥 Blaze Bot shutting down...');
  process.exit(0);
});

// Start the bot
const bot = createBlazeBot();
bot.start();