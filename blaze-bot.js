// blaze-bot.js - Blaze Bot that posts "Blaze it" every hour with a location where it's 4:20 PM
import dotenv from 'dotenv';
import { finalizeEvent, nip19 } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';

dotenv.config();

class BlazeBot {
  constructor(nsec, relays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nostr.mom', 'wss://relay.primal.net']) {
    this.nsec = nsec;
    this.relays = relays;
    
    // Comprehensive timezone data based on 420worldclock.com
    this.timezones = [
      // UTC -12 to UTC +14 coverage with proper DST handling
      { name: "Baker Island, Howland Island", offset: -12, dst: false },
      { name: "American Samoa, Jarvis Island, Niue", offset: -11, dst: false },
      { name: "Honolulu, French Polynesia, Cook Islands, Aleutian Islands", offset: -10, dst: false },
      { name: "French Polynesia, Marquesas Islands", offset: -9.5, dst: false },
      { name: "Alaska, Gambier Islands", offset: -9, dst: true },
      { name: "Los Angeles, Vancouver, Tijuana, San Francisco, Seattle", offset: -8, dst: true },
      { name: "Phoenix, Calgary, Ciudad Juarez, Alberta, Las Vegas, El Paso, Baja, British Columbia", offset: -7, dst: true },
      { name: "Mexico City, Chicago, Guatemala City, Tegucigalpa, Winnipeg, San Jose, San Salvador", offset: -6, dst: true },
      { name: "New York, Toronto, Havana, Lima, Bogota, Kingston", offset: -5, dst: true },
      { name: "Santiago, Santo Domingo, Manaus, Caracas, La Paz, Halifax, New Brunswick, Puerto Rico", offset: -4, dst: true },
      { name: "St. Johns, Newfoundland, Labrador", offset: -3.5, dst: true },
      { name: "Argentina, Brazil, Chile, Saint Pierre, Suriname, Falkland Islands, Uruguay", offset: -3, dst: false },
      { name: "Fernando de Noronha, South Georgia, South Sandwich Islands", offset: -2, dst: false },
      { name: "Cape Verde, Greenland, Azores Islands", offset: -1, dst: true },
      { name: "London, Lisbon, Reykjavik, Canary, Monrovia, Accra", offset: 0, dst: true },
      { name: "Bangui, Ceuta, Lagos, Amsterdam, Berlin, Brussels, Dublin, Madrid, Paris, Stockholm", offset: 1, dst: true },
      { name: "Blantyre, Cairo, Johannesburg, Lusaka, Tripoli, Beirut, Gaza, Jerusalem, Kiev", offset: 2, dst: true },
      { name: "Addis Ababa, Asmara, Juba, Mogadishu, Nairobi, Kuwait, Istanbul, Moscow, Mayotte", offset: 3, dst: false },
      { name: "Tehran", offset: 3.5, dst: false },
      { name: "Baku, Dubai, Yerevan, Samara, Volgograd, Mahe", offset: 4, dst: false },
      { name: "Kabul", offset: 4.5, dst: false },
      { name: "Aqtau, Dushanbe, Oral, Samarkand, Yekaterinburg, Maldives", offset: 5, dst: false },
      { name: "Mumbai, Colombo", offset: 5.5, dst: false },
      { name: "Nepal", offset: 5.75, dst: false },
      { name: "Bishkek, Dhaka, Urumqi, Chagos", offset: 6, dst: false },
      { name: "Yangon, Cocos, Myanmar", offset: 6.5, dst: false },
      { name: "Casey, Choibalsan, Hong Kong, Kuching, Shanghai, Taipei, Perth", offset: 7, dst: false },
      { name: "Western Australia, Eucla", offset: 7.75, dst: false },
      { name: "Dili, Jayapura, Pyongyang, Seoul, Tokyo, Palau", offset: 8, dst: false },
      { name: "Broken Hill", offset: 8.5, dst: false },
      { name: "Vladivostok, Brisbane, Melbourne, Sydney, Guam, Port Moresby, Saipan", offset: 9, dst: false },
      { name: "Lord Howe Island", offset: 9.5, dst: false },
      { name: "Norfolk Island, New Caledonia, Papua New Guinea, Magadan, Vanuatu", offset: 10, dst: false },
      { name: "Wallis, Fiji, Gilbert Islands, Marshall Islands, Tuvalu, Wake Island", offset: 11, dst: false },
      { name: "Chatham Islands", offset: 11.75, dst: false },
      { name: "Phoenix Islands, New Zealand, Samoa, Tonga", offset: 12, dst: false },
      { name: "Line Islands", offset: 13, dst: false },
      { name: "Kiritimati", offset: 14, dst: false }
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

  // Get the actual UTC offset for a timezone, accounting for DST
  getCurrentOffset(timezone) {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    
    // Create a date object for this timezone
    const timeInTimezone = new Date(utcTime + (timezone.offset * 3600000));
    
    // If DST is enabled for this timezone, we need to check if it's currently in DST
    if (timezone.dst) {
      // Simple DST detection - this could be improved with a proper DST library
      // For now, we'll use a basic approach based on typical DST rules
      const month = timeInTimezone.getUTCMonth();
      const day = timeInTimezone.getUTCDate();
      const dayOfWeek = timeInTimezone.getUTCDay();
      
      // Northern Hemisphere DST (March to November)
      // This is a simplified version - in production you'd want a proper DST library
      let isDST = false;
      if (timezone.offset >= -8 && timezone.offset <= 2) { // Northern Hemisphere
        // March second Sunday to November first Sunday
        if (month >= 2 && month <= 9) {
          if (month === 2) { // March
            const secondSunday = 8 + (7 - new Date(timeInTimezone.getUTCFullYear(), 2, 8).getUTCDay()) % 7;
            isDST = day >= secondSunday;
          } else if (month === 9) { // October
            const firstSunday = 1 + (7 - new Date(timeInTimezone.getUTCFullYear(), 9, 1).getUTCDay()) % 7;
            isDST = day < firstSunday;
          } else {
            isDST = true;
          }
        }
      }
      
      if (isDST) {
        return timezone.offset + 1;
      }
    }
    
    return timezone.offset;
  }

  // Get the local time in a specific timezone
  getLocalTime(timezone) {
    const now = new Date();
    const offset = this.getCurrentOffset(timezone);
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (offset * 3600000));
    
    return {
      hours: localTime.getUTCHours(),
      minutes: localTime.getUTCMinutes(),
      seconds: localTime.getUTCSeconds()
    };
  }

  // Find the next 4:20 occurrence in a timezone
  getNext420Time(timezone) {
    const now = new Date();
    const offset = this.getCurrentOffset(timezone);
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localTime = new Date(utcTime + (offset * 3600000));
    
    const currentHour = localTime.getUTCHours();
    const currentMinute = localTime.getUTCMinutes();
    
    // Calculate minutes until next 4:20
    let minutesUntil420 = 0;
    
    if (currentHour < 4) {
      // Next 4:20 is today at 4:20 AM
      minutesUntil420 = (4 - currentHour) * 60 + (20 - currentMinute);
    } else if (currentHour === 4 && currentMinute < 20) {
      // Next 4:20 is today at 4:20 AM
      minutesUntil420 = 20 - currentMinute;
    } else if (currentHour < 16) {
      // Next 4:20 is today at 4:20 PM
      minutesUntil420 = (16 - currentHour) * 60 + (20 - currentMinute);
    } else if (currentHour === 16 && currentMinute < 20) {
      // Next 4:20 is today at 4:20 PM
      minutesUntil420 = 20 - currentMinute;
    } else {
      // Next 4:20 is tomorrow at 4:20 AM
      minutesUntil420 = (24 - currentHour) * 60 + (4 * 60 + 20 - currentMinute);
    }
    
    return minutesUntil420;
  }

  getCurrentTime420Locations() {
    const now = new Date();
    const current420Locations = [];
    const next420Locations = [];
    
    // Find locations where it's currently 4:20 AM or PM
    this.timezones.forEach(timezone => {
      const localTime = this.getLocalTime(timezone);
      
      if ((localTime.hours === 4 && localTime.minutes === 20) || 
          (localTime.hours === 16 && localTime.minutes === 20)) {
        current420Locations.push({
          name: timezone.name,
          time: localTime.hours === 4 ? "4:20 AM" : "4:20 PM",
          offset: this.getCurrentOffset(timezone)
        });
      }
    });
    
    // If no current 4:20 locations, find the next ones
    if (current420Locations.length === 0) {
      const nextTimes = this.timezones.map(timezone => ({
        name: timezone.name,
        minutesUntil: this.getNext420Time(timezone),
        offset: this.getCurrentOffset(timezone)
      }));
      
      // Sort by time until next 4:20
      nextTimes.sort((a, b) => a.minutesUntil - b.minutesUntil);
      
      // Get the next 3 locations
      next420Locations.push(...nextTimes.slice(0, 3));
    }
    
    return {
      current: current420Locations,
      next: next420Locations,
      hasCurrent: current420Locations.length > 0
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
    
    if (locations.hasCurrent) {
      // It's currently 4:20 somewhere!
      const currentNames = locations.current.map(loc => loc.name);
      const currentTimes = [...new Set(locations.current.map(loc => loc.time))];
      
      locationText += `🌍 It's ${currentTimes.join(' & ')} in:\n`;
      locationText += `${currentNames.join(', ')}\n\n`;
      locationText += `🔥 Time to blaze! 🔥\n`;
    } else {
      // Show countdown to next 4:20
      const nextLocation = locations.next[0];
      const hours = Math.floor(nextLocation.minutesUntil / 60);
      const minutes = nextLocation.minutesUntil % 60;
      
      locationText += `⏰ Next 4:20 in ${hours}h ${minutes}m\n`;
      locationText += `📍 ${nextLocation.name}\n\n`;
      
      if (locations.next.length > 1) {
        locationText += `🌍 Also coming up:\n`;
        locations.next.slice(1).forEach(loc => {
          const h = Math.floor(loc.minutesUntil / 60);
          const m = loc.minutesUntil % 60;
          locationText += `• ${loc.name} in ${h}h ${m}m\n`;
        });
      }
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
    
    if (locations.hasCurrent) {
      console.log(`🔥 Posted: Currently 4:20 in ${locations.current.map(l => l.name).join(', ')}`);
    } else {
      console.log(`🔥 Posted: Next 4:20 in ${locations.next[0].name} (${Math.floor(locations.next[0].minutesUntil / 60)}h ${locations.next[0].minutesUntil % 60}m)`);
    }
  }

  start() {
    console.log('🔥 Starting Blaze Bot...');
    console.log(`🔥 Bot will post every hour`);
    
    if (process.env.TEST_MODE === 'true') {
      console.log('🧪 Running in TEST MODE - no actual posts will be made');
    }

    console.log('⏰ Waiting for next hour to start posting...');
    
    // Post every hour (3600000 ms) but don't post immediately on start
    setInterval(() => {
      this.postBlazeMessage();
    }, 3600000);
  }
}

// Export the BlazeBot class for testing
export { BlazeBot };

// Only start the bot if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
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
}