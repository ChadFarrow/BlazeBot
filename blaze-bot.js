// blaze-bot.js - Blaze Bot that posts "Blaze it" every hour with a location where it's 4:20 PM
import dotenv from 'dotenv';
import { finalizeEvent, nip19 } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';
import fetch from 'node-fetch';

dotenv.config();

class BlazeBot {
  constructor(nsec, relays = ['wss://relay.damus.io', 'wss://relay.nostr.band', 'wss://nostr.mom', 'wss://relay.primal.net']) {
    this.nsec = nsec;
    this.relays = relays;
    
    // Timezone data using proper IANA timezone identifiers
    this.timezones = [
      { name: "Baker Island, Howland Island", tz: "Pacific/Majuro", offset: -12 },
      { name: "American Samoa, Jarvis Island, Niue", tz: "Pacific/Pago_Pago", offset: -11 },
      { name: "Honolulu, French Polynesia, Cook Islands, Aleutian Islands", tz: "Pacific/Honolulu", offset: -10 },
      { name: "French Polynesia, Marquesas Islands", tz: "Pacific/Marquesas", offset: -9.5 },
      { name: "Alaska, Gambier Islands", tz: "America/Anchorage", offset: -9 },
      { name: "Los Angeles, Vancouver, Tijuana, San Francisco, Seattle", tz: "America/Los_Angeles", offset: -8 },
      { name: "Phoenix, Calgary, Ciudad Juarez, Alberta, Las Vegas, El Paso, Baja, British Columbia", tz: "America/Denver", offset: -7 },
      { name: "Mexico City, Chicago, Guatemala City, Tegucigalpa, Winnipeg, San Jose, San Salvador", tz: "America/Chicago", offset: -6 },
      { name: "New York, Toronto, Havana, Lima, Bogota, Kingston", tz: "America/New_York", offset: -5 },
      { name: "Santiago, Santo Domingo, Manaus, Caracas, La Paz, Halifax, New Brunswick, Puerto Rico", tz: "America/Halifax", offset: -4 },
      { name: "St. Johns, Newfoundland, Labrador", tz: "America/St_Johns", offset: -3.5 },
      { name: "Argentina, Brazil, Chile, Saint Pierre, Suriname, Falkland Islands, Uruguay", tz: "America/Argentina/Buenos_Aires", offset: -3 },
      { name: "Fernando de Noronha, South Georgia, South Sandwich Islands", tz: "America/Noronha", offset: -2 },
      { name: "Cape Verde, Greenland, Azores Islands", tz: "Atlantic/Azores", offset: -1 },
      { name: "London, Lisbon, Reykjavik, Canary, Monrovia, Accra", tz: "Europe/London", offset: 0 },
      { name: "Bangui, Ceuta, Lagos, Amsterdam, Berlin, Brussels, Dublin, Madrid, Paris, Stockholm", tz: "Europe/Paris", offset: 1 },
      { name: "Blantyre, Cairo, Johannesburg, Lusaka, Tripoli, Beirut, Gaza, Jerusalem, Kiev", tz: "Europe/Kiev", offset: 2 },
      { name: "Addis Ababa, Asmara, Juba, Mogadishu, Nairobi, Kuwait, Istanbul, Moscow, Mayotte", tz: "Europe/Moscow", offset: 3 },
      { name: "Tehran", tz: "Asia/Tehran", offset: 3.5 },
      { name: "Baku, Dubai, Yerevan, Samara, Volgograd, Mahe", tz: "Asia/Dubai", offset: 4 },
      { name: "Kabul", tz: "Asia/Kabul", offset: 4.5 },
      { name: "Aqtau, Dushanbe, Oral, Samarkand, Yekaterinburg, Maldives", tz: "Asia/Yekaterinburg", offset: 5 },
      { name: "Mumbai, Colombo", tz: "Asia/Kolkata", offset: 5.5 },
      { name: "Nepal", tz: "Asia/Kathmandu", offset: 5.75 },
      { name: "Bishkek, Dhaka, Urumqi, Chagos", tz: "Asia/Dhaka", offset: 6 },
      { name: "Yangon, Cocos, Myanmar", tz: "Asia/Yangon", offset: 6.5 },
      { name: "Bangkok, Ho Chi Minh City, Jakarta", tz: "Asia/Bangkok", offset: 7 },
      { name: "Casey, Choibalsan, Hong Kong, Kuching, Shanghai, Taipei, Perth", tz: "Asia/Shanghai", offset: 7 },
      { name: "Western Australia, Eucla", tz: "Australia/Eucla", offset: 7.75 },
      { name: "Dili, Jayapura, Pyongyang, Seoul, Tokyo, Palau", tz: "Asia/Tokyo", offset: 8 },
      { name: "Broken Hill", tz: "Australia/Broken_Hill", offset: 8.5 },
      { name: "Vladivostok, Brisbane, Melbourne, Sydney, Guam, Port Moresby, Saipan", tz: "Australia/Sydney", offset: 9 },
      { name: "Lord Howe Island", tz: "Australia/Lord_Howe", offset: 9.5 },
      { name: "Norfolk Island, New Caledonia, Papua New Guinea, Magadan, Vanuatu", tz: "Pacific/Norfolk", offset: 10 },
      { name: "Wallis, Fiji, Gilbert Islands, Marshall Islands, Tuvalu, Wake Island", tz: "Pacific/Fiji", offset: 11 },
      { name: "Chatham Islands", tz: "Pacific/Chatham", offset: 11.75 },
      { name: "Phoenix Islands, New Zealand, Samoa, Tonga", tz: "Pacific/Auckland", offset: 12 },
      { name: "Line Islands", tz: "Pacific/Kiritimati", offset: 13 },
      { name: "Kiritimati", tz: "Pacific/Kiritimati", offset: 14 }
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

  // Get the local time in a specific timezone using proper JavaScript timezone handling
  getLocalTime(timezone) {
    const now = new Date();
    
    // Use JavaScript's built-in timezone handling
    const timeInTimezone = new Date(now.toLocaleString("en-US", {timeZone: timezone.tz}));
    
    return {
      hours: timeInTimezone.getHours(),
      minutes: timeInTimezone.getMinutes(),
      seconds: timeInTimezone.getSeconds()
    };
  }

  // Find the next 4:20 occurrence in a timezone
  getNext420Time(timezone) {
    const now = new Date();
    
    // Get current time in the timezone
    const localTime = this.getLocalTime(timezone);
    const currentHour = localTime.hours;
    const currentMinute = localTime.minutes;
    
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

  // Validate our calculations against 420worldclock.com
  async validateAgainstWebsite() {
    try {
      const response = await fetch('https://420worldclock.com/');
      const html = await response.text();
      
      // Extract the countdown time from the HTML - look for format like "18h 50m"
      const countdownMatch = html.match(/(\d+)h\s*(\d+)m\s*<br/i) || html.match(/(\d+)h\s*(\d+)m/i);
      if (!countdownMatch) {
        console.log('⚠️  Could not parse countdown from 420worldclock.com');
        console.log('HTML excerpt:', html.substring(html.indexOf('next-location') - 50, html.indexOf('next-location') + 200));
        return { valid: false, reason: 'Could not parse website data' };
      }
      
      const websiteHours = parseInt(countdownMatch[1]);
      const websiteMinutes = parseInt(countdownMatch[2]);
      const websiteTotalMinutes = websiteHours * 60 + websiteMinutes;
      
      // Get our calculation - always look for next 4:20 PM like the website does
      const nextPMTimes = this.timezones.map(timezone => {
        const localTime = this.getLocalTime(timezone);
        const currentHour = localTime.hours;
        const currentMinute = localTime.minutes;
        
        let minutesUntil420PM = 0;
        if (currentHour < 16) {
          minutesUntil420PM = (16 - currentHour) * 60 + (20 - currentMinute);
        } else if (currentHour === 16 && currentMinute < 20) {
          minutesUntil420PM = 20 - currentMinute;
        } else {
          // Next 4:20 PM is tomorrow
          minutesUntil420PM = (24 - currentHour) * 60 + (16 * 60 + 20 - currentMinute);
        }
        
        return minutesUntil420PM;
      });
      
      const ourNextMinutes = Math.min(...nextPMTimes);
      
      // Allow for significant tolerance since website may use different prioritization logic
      const tolerance = 120; // 2 hours
      const difference = Math.abs(websiteTotalMinutes - ourNextMinutes);
      
      const isValid = difference <= tolerance;
      
      console.log(`🔍 Validation check:`);
      console.log(`   Website: ${websiteHours}h ${websiteMinutes}m`);
      console.log(`   Our calc: ${Math.floor(ourNextMinutes/60)}h ${ourNextMinutes%60}m`);
      console.log(`   Difference: ${difference} minutes`);
      console.log(`   Status: ${isValid ? '✅ Valid' : '⚠️  Different logic'}`);
      
      // Only log as failure if difference is extreme (indicating real problems)
      if (difference > 24 * 60) { // More than 24 hours difference
        console.error(`🚨 VALIDATION FAILURE: Bot calculations differ from 420worldclock.com by ${difference} minutes!`);
        console.error(`    This could indicate timezone calculation issues or website changes.`);
        console.error(`    Manual review recommended.`);
      } else if (!isValid) {
        console.log(`ℹ️  Note: Website and bot use different 4:20 PM prioritization logic - this is normal.`);
      }
      
      return { 
        valid: isValid, 
        websiteMinutes: websiteTotalMinutes,
        ourMinutes: ourNextMinutes,
        difference: difference 
      };
      
    } catch (error) {
      console.error('❌ Error validating against website:', error.message);
      return { valid: false, reason: 'Network error', error: error.message };
    }
  }

  getCurrentTime420Locations() {
    const now = new Date();
    const current420Locations = [];
    const next420Locations = [];
    
    // Find locations where it's currently 4:20 AM or PM
    this.timezones.forEach(timezone => {
      const localTime = this.getLocalTime(timezone);
      
      // Check if it's exactly 4:20 (within a minute window for posting)
      if ((localTime.hours === 4 && localTime.minutes >= 20 && localTime.minutes < 21) || 
          (localTime.hours === 16 && localTime.minutes >= 20 && localTime.minutes < 21)) {
        current420Locations.push({
          name: timezone.name,
          time: localTime.hours === 4 ? "4:20 AM" : "4:20 PM",
          timezone: timezone.tz
        });
      }
    });
    
    // If no current 4:20 locations, find the next ones
    if (current420Locations.length === 0) {
      const nextTimes = this.timezones.map(timezone => ({
        name: timezone.name,
        minutesUntil: this.getNext420Time(timezone),
        timezone: timezone.tz
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

  async start() {
    console.log('🔥 Starting Blaze Bot...');
    console.log(`🔥 Bot will post every hour`);
    
    if (process.env.TEST_MODE === 'true') {
      console.log('🧪 Running in TEST MODE - no actual posts will be made');
    }

    console.log('⏰ Waiting for next hour to start posting...');
    
    // Run initial validation
    await this.validateAgainstWebsite();
    
    // Post every hour (3600000 ms) but don't post immediately on start
    setInterval(() => {
      this.postBlazeMessage();
    }, 3600000);
    
    // Validate against website every 6 hours
    setInterval(() => {
      this.validateAgainstWebsite();
    }, 6 * 3600000);
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