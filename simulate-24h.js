// simulate-24h.js - Simulate a 24-hour UTC day and log 4:20 events for all timezones
import { BlazeBot } from './blaze-bot.js';

const bot = new BlazeBot('test-nsec');

// Store results as { time: 'HH:MM', am: [names], pm: [names] }
const results = [];

for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute++) {
    // Simulate this UTC time
    const fakeNow = new Date(Date.UTC(2024, 3, 20, hour, minute, 0, 0)); // April 20, 2024
    const am420 = [];
    const pm420 = [];
    bot.timezones.forEach(tz => {
      // Calculate local time for this timezone at this UTC moment
      // Use the bot's DST logic
      const offset = bot.getCurrentOffset(tz, fakeNow);
      const local = new Date(fakeNow.getTime() + offset * 3600000);
      const h = local.getUTCHours();
      const m = local.getUTCMinutes();
      if (h === 4 && m === 20) am420.push(tz.name);
      if (h === 16 && m === 20) pm420.push(tz.name);
    });
    if (am420.length > 0 || pm420.length > 0) {
      results.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        am: am420,
        pm: pm420
      });
    }
  }
}

// Print summary
results.forEach(r => {
  if (r.am.length > 0) {
    console.log(`${r.time} UTC: 4:20 AM in: ${r.am.join('; ')}`);
  }
  if (r.pm.length > 0) {
    console.log(`${r.time} UTC: 4:20 PM in: ${r.pm.join('; ')}`);
  }
});

console.log(`\nTotal 4:20 events: ${results.length}`); 