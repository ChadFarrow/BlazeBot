// test-improved-bot.js - Test the improved BlazeBot timezone functionality
import dotenv from 'dotenv';

dotenv.config();

// Import the BlazeBot class
import { BlazeBot } from './blaze-bot.js';

// Create a test instance
const testBot = new BlazeBot('test-nsec');

console.log('🧪 Testing Improved BlazeBot Timezone Functionality\n');

// Test 1: Get current 4:20 locations
console.log('📍 Current 4:20 Locations:');
const currentLocations = testBot.getCurrentTime420Locations();
if (currentLocations.hasCurrent) {
  currentLocations.current.forEach(loc => {
    console.log(`  • ${loc.name} - ${loc.time}`);
  });
} else {
  console.log('  No current 4:20 locations found');
}

// Test 2: Get next 4:20 locations
console.log('\n⏰ Next 4:20 Locations:');
if (currentLocations.next.length > 0) {
  currentLocations.next.forEach((loc, index) => {
    const hours = Math.floor(loc.minutesUntil / 60);
    const minutes = loc.minutesUntil % 60;
    console.log(`  ${index + 1}. ${loc.name} - in ${hours}h ${minutes}m`);
  });
}

// Test 3: Test specific timezone calculations
console.log('\n🌍 Sample Timezone Calculations:');
const sampleTimezones = [
  { name: "New York", offset: -5, dst: true },
  { name: "London", offset: 0, dst: true },
  { name: "Tokyo", offset: 9, dst: false },
  { name: "Mumbai", offset: 5.5, dst: false }
];

sampleTimezones.forEach(tz => {
  const localTime = testBot.getLocalTime(tz);
  const next420 = testBot.getNext420Time(tz);
  const hours = Math.floor(next420 / 60);
  const minutes = next420 % 60;
  
  console.log(`  ${tz.name}: ${localTime.hours.toString().padStart(2, '0')}:${localTime.minutes.toString().padStart(2, '0')} (next 4:20 in ${hours}h ${minutes}m)`);
});

// Test 4: Show what the post would look like
console.log('\n📝 Sample Post Content:');
if (currentLocations.hasCurrent) {
  const currentNames = currentLocations.current.map(loc => loc.name);
  const currentTimes = [...new Set(currentLocations.current.map(loc => loc.time))];
  console.log(`  🔥 BLAZE IT! 🔥\n`);
  console.log(`  🌍 It's ${currentTimes.join(' & ')} in:`);
  console.log(`  ${currentNames.join(', ')}\n`);
  console.log(`  🔥 Time to blaze! 🔥\n`);
} else {
  const nextLocation = currentLocations.next[0];
  const hours = Math.floor(nextLocation.minutesUntil / 60);
  const minutes = nextLocation.minutesUntil % 60;
  console.log(`  🔥 BLAZE IT! 🔥\n`);
  console.log(`  ⏰ Next 4:20 in ${hours}h ${minutes}m`);
  console.log(`  📍 ${nextLocation.name}\n`);
}
console.log(`  #blazeit #420 #nostr #worldwide`);

console.log('\n✅ Test completed successfully!'); 