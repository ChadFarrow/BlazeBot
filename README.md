# Blaze Bot 🔥

A Nostr bot that posts "Blaze it" every hour, naming places in the world where it's currently 4:20 AM and 4:20 PM.

## Features

- Posts every hour to Nostr
- Finds cities where it's currently 4:20 AM or 4:20 PM
- Shows both morning and evening 4:20 times in each post
- Includes major cities from all time zones worldwide
- Uses multiple Nostr relays for reliability
- Test mode for development

## Setup

1. **Install dependencies:**
   ```bash
   cd BlazeBot
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your BLAZE_BOT_NSEC
   ```

3. **Generated Nostr Keys:**
   - **Private Key (nsec)**: `nsec10xhkw6g5ejmafyhg2rkukcjlwldva3z987srvr3cetkmkzc4cjms7zhfss`
   - **Public Key (npub)**: `npub1uavtgc2qrtr0jlfplym2xxva56vnt63lwytl77lk428t6ums5n9srl80eg`
   - Keys are already configured in `.env` file
   - To generate new keys: `node generate-keys.js`

## Usage

### Run the bot:
```bash
npm start
```

### Test mode (logs without posting):
```bash
TEST_MODE=true npm start
```

### Development with auto-restart:
```bash
npm run dev
```

## How it works

1. **Hourly Schedule**: Posts every hour on the hour
2. **Timezone Logic**: Calculates which cities currently have 4:20 AM or 4:20 PM local time
3. **Location Selection**: 
   - Finds cities with exact 4:20 AM and 4:20 PM matches
   - If no exact matches, finds cities in 4 AM/PM hours
   - Shows both AM and PM locations in the same post
   - Fallback to random city if needed
4. **Nostr Publishing**: Posts to multiple relays simultaneously

## Example Posts

```
🔥 BLAZE IT! 🔥

🌅 4:20 AM in Tokyo, Japan
🌇 4:20 PM in New York, New York

#blazeit #420 #nostr #worldwide
```

```
🔥 BLAZE IT! 🔥

🌅 4:20 AM in Sydney, Australia, Auckland, New Zealand
🌇 4:20 PM in London, England, Berlin, Germany

#blazeit #420 #nostr #worldwide
```

## Configuration

### Environment Variables

- `BLAZE_BOT_NSEC`: Your Nostr private key (required)
- `TEST_MODE`: Set to `true` for testing without posting

### Default Relays

- wss://relay.damus.io
- wss://relay.nostr.band  
- wss://nostr.mom
- wss://relay.primal.net

## Cities Included

The bot includes 40+ major cities across all time zones:

- **Americas**: Los Angeles, Denver, Chicago, New York, São Paulo, Buenos Aires, Mexico City, Vancouver, Toronto, Honolulu, Anchorage
- **Europe**: London, Berlin, Paris, Rome, Madrid, Amsterdam, Stockholm, Helsinki, Warsaw, Prague, Vienna, Zurich
- **Africa/Middle East**: Cairo, Lagos, Johannesburg, Dubai, Istanbul
- **Asia**: Mumbai, Bangkok, Beijing, Tokyo, Seoul, Singapore
- **Oceania**: Sydney, Perth, Auckland

## Development

The bot is designed to be simple and reliable:

- **No database required** - everything is calculated in real-time
- **Timezone aware** - handles UTC offsets correctly
- **Error handling** - continues running even if some relays fail
- **Graceful shutdown** - handles SIGINT/SIGTERM properly

## Stopping the Bot

```bash
# Ctrl+C if running in foreground
# Or find and kill the process:
ps aux | grep blaze-bot
kill [PID]
```