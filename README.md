# Masked Communications App
[![Tests](https://github.com/twilio-labs/masked-communications-app/actions/workflows/test.yml/badge.svg)](https://github.com/twilio-labs/masked-communications-app/workflows/test.yml)

This is an open-source version of [Twilio Proxy](https://www.twilio.com/docs/proxy), built on top of the [Twilio Conversations API](https://www.twilio.com/docs/conversations). It adds the following features to conversations:

- 🤿 Add 2-50 SMS participants to a conversation with masked numbers
- 🔀 Automatic proxy number selection from a number pool
- ☎️ Supports 1:1 and conference calling via the Conversations proxy number.

Reasons you might use this app:
- 🏠 You're a real estate company that wants to connect realtors with prospective buyers over a masked number.
- 🚗 You're a rideshare service that wants to give riders a temporary number to call their driver.
- 🎁 You're a personal shopper platform that wants to connect shoppers with customers over a private number and log all conversation messages.

Using the underlying Twilio Conversations platform, you also have the capability to do things like:
- 🚫 Block messages from going out based on their content.
- 🗃 Store messages to a database for analysis.
- 🏁 Receive webhooks from the Conversations event framework.

# Prerequisites
- A Twilio Account ([sign up for free](https://twilio.com/try-twilio))
- **At least 2 Twilio phone numbers** ([see how many you need](https://www.twilio.com/docs/proxy/phone-numbers-needed))
- Node.js v14 or higher
- npm or yarn
- [ngrok](https://ngrok.com/) for local development (to receive webhooks)

# Quick Setup Summary

Before diving into detailed steps, here's what you need to do:

1. ✅ **Buy Phone Numbers**: Get at least 2 Twilio phone numbers
2. ✅ **Add to Messaging Service**: Add all numbers to a Twilio Messaging Service
3. ✅ **Copy Config Files**: `cp .env.example .env` and `cp phoneNumbers.txt.example phoneNumbers.txt`
4. ✅ **Configure .env**: Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `NUMBER_POOL`, `AUTH_USERNAME`, `AUTH_PASSWORD`, and `DOMAIN`
5. ✅ **Add Your Phone Numbers**: Edit `phoneNumbers.txt` with your actual numbers
6. ✅ **Generate Phone Map**: Run `npm run prepare`
7. ✅ **Start Server**: Run `npm run dev`
8. ✅ **Set Up ngrok**: Expose local server with `ngrok http 3000`
9. ✅ **Configure Webhooks**: Point phone numbers to `/inbound-call` endpoint
10. ✅ **Create Session**: POST to `/sessions` with participant phone numbers
11. ✅ **Test**: Send SMS or make calls through proxy numbers

# Getting Started

## Step 1: Clone and Install

Begin by cloning the repository and installing dependencies:

```bash
# Clone the repository:
$ git clone git@github.com:twilio-labs/masked-communications-app.git

# Make the repository your working directory:
$ cd masked-communications-app

# Install dependencies:
$ npm install

# Copy the example configuration files:
$ cp .env.example .env
$ cp phoneNumbers.txt.example phoneNumbers.txt
```

**Note:** Both `.env` and `phoneNumbers.txt` are gitignored - your credentials and phone numbers will never be committed to the repository. Only the `.example` files are tracked in git.

## Step 2: Configure Twilio Phone Numbers

You need **at least 2 phone numbers** to create masked sessions (one proxy number per participant).

### A. Add Phone Numbers to Your Messaging Service

1. Go to [Twilio Console > Messaging > Services](https://console.twilio.com/us1/develop/sms/services)
2. Find or create a Messaging Service (e.g., "Default Conversations Service")
3. Click on your service, then go to **Sender Pool**
4. Click **Add Senders** and add your phone numbers to the pool

**Via Twilio CLI:**
```bash
# Find your Messaging Service SID
twilio api:messaging:v1:services:list

# Add phone numbers to the service (repeat for each number)
twilio api:messaging:v1:services:phone-numbers:create \
  --service-sid MGXXXXX \
  --phone-number-sid PNXXXXX
```

### B. Configure Messaging Service Integration

1. Go to your Messaging Service > **Integration** settings
2. Under **Incoming Messages**, select: **"Defer to sender's webhook"** (recommended for basic proxying)
   - OR select **"Send a webhook"** if you want custom message handling
3. Save the configuration

## Step 3: Set Up Environment Variables

Edit your `.env` file with the following required variables:

| Variable Name                   | Required | Description                                                                   | Example                                                    |
|---------------------------------|----------|-------------------------------------------------------------------------------|------------------------------------------------------------|
| TWILIO_ACCOUNT_SID              | **Yes**  | Your Twilio Account SID from [console.twilio.com](https://console.twilio.com) | `ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX`                           |
| TWILIO_AUTH_TOKEN               | **Yes**  | Your Twilio Auth Token from [console.twilio.com](https://console.twilio.com)  | `********************************`                          |
| NUMBER_POOL                     | **Yes**  | Array of phone numbers (E.164 format) for masking. **Need at least 2 numbers for a 2-person session.** | `["+15551234567", "+15559876543"]`                         |
| DOMAIN                          | **Yes**  | Domain where app is hosted (no `https://`). Required for webhook validation.  | `"myapp.ngrok.io"` or `"mysite.com"`                       |
| AUTH_USERNAME                   | **Yes**  | Basic auth username for `/sessions` endpoint                                  | `"admin"`                                                  |
| AUTH_PASSWORD                   | **Yes**  | Basic auth password for `/sessions` endpoint                                  | `"SecurePassword123"`                                      |
| CALL_ANNOUCEMENT_VOICE          | No       | Voice for speech announcements ([Polly voices](https://www.twilio.com/docs/voice/twiml/say/text-speech#polly-standard-and-neural-voices)) | `"Polly.Joanna"`, `"man"`, `"woman"`, `"alice"`            |
| CALL_ANNOUCEMENT_LANGUAGE       | No       | Language for announcements ([supported languages](https://www.twilio.com/docs/voice/twiml/say#attributes-language)) | `"en-US"`, `"es-ES"`, `"fr-FR"`                            |
| OUT_OF_SESSION_MESSAGE_FOR_CALL | No       | Message played when calling without active session                            | `"Sorry, you do not have an active session."`              |
| CONNECTING_CALL_ANNOUCEMENT     | No       | Message played when connecting callers                                        | `"Please wait while we connect your call."`                |
| PORT                            | No       | Server port (defaults to 3000)                                                | `3000`                                                     |

**Important**: The `NUMBER_POOL` must contain phone numbers that exist in your Twilio account AND are added to your Messaging Service (from Step 2).

## Step 4: Configure Your Phone Numbers

Edit the `phoneNumbers.txt` file in the root directory and add your phone numbers (one per line, E.164 format):

```txt
+15551234567
+15559876543
+15551111111
```

**Important Notes:**
- Use E.164 format (e.g., `+15551234567`)
- One phone number per line
- These should match the numbers in your `NUMBER_POOL` from `.env`
- This file is **gitignored** - your numbers won't be committed to git

## Step 5: Generate Phone Number Map

Run this command to generate the phone number map used by the geo-routing system:

```bash
$ npm run prepare
```

This reads `phoneNumbers.txt` and generates `src/data/phoneNumberMap.json`. 

**When to run this:**
- After initial setup
- Whenever you add/remove numbers from `phoneNumbers.txt`

**Note:** Both `phoneNumbers.txt` and the generated `phoneNumberMap.json` are gitignored - they won't be committed.

## Step 6: Start the Server

Start the development server:

```bash
$ npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

## Step 7: Set Up ngrok (for local development)

To receive webhooks from Twilio, expose your local server:

```bash
$ ngrok http 3000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update your `.env`:

```bash
DOMAIN=abc123.ngrok.io
```

**Then restart the server** to load the new DOMAIN.

# Step 8: Configure Webhooks

Configure these webhooks in the Twilio Console:

## A. Voice Webhook (for each phone number)

Configure **each phone number** in your pool to handle incoming calls:

1. Go to [Twilio Console > Phone Numbers > Manage > Active Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click on a phone number
3. Scroll to **Voice Configuration > A CALL COMES IN**
4. Select **Webhook** and enter: `https://[your-domain]/inbound-call`
5. Method: **HTTP POST**
6. Click **Save**
7. **Repeat for all numbers in your pool**

**Via Twilio CLI:**
```bash
# Update each phone number (repeat for all numbers in pool)
twilio api:core:incoming-phone-numbers:update PNXXXXX \
  --voice-url="https://your-domain.ngrok.io/inbound-call" \
  --voice-method="POST"
```

## B. Conversations Post-Event Webhook (optional but recommended)

Automatically clean up closed conversations to improve performance:

1. Go to [Twilio Console > Conversations > Services](https://console.twilio.com/us1/develop/conversations/manage/services)
2. Click on your Conversations Service
3. Go to **Webhooks** tab
4. Under **Post-Event URL**, enter: `https://[your-domain]/conversations-post-event`
5. Method: **HTTP POST**
6. Check the box: ☑ **onConversationStateUpdated**
7. Click **Save**

# Authentication & Webhook Validation
The app requires basic auth on request to the `/sessions` endpoint. This prevents an unauthorized person from creating sessions. To use basic auth, make sure `DOMAIN` (e.g. mysite.com, no http://), `AUTH_USERNAME`, and `AUTH_PASSWORD` are all set in your .env file, and restart the app.

Webhooks are automatically validated using the Twilio Webhook signature. This prevents an unauthorized request to start a phone call without your permission. For webhook validation to work, your app needs `DOMAIN` to be set along with `TWILIO_AUTH_TOKEN` in the .env file.

# Usage

## Creating a Masked Session

Create a new masked communication session by making a POST request to `/sessions`:

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Authorization: Basic $(echo -n 'admin:SecurePassword123' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["+15551234567", "+15559876543"],
    "friendlyName": "Customer Support Session"
  }'
```

**Important Notes:**
- **Authentication Required**: Use Basic Auth with credentials from your `.env` (`AUTH_USERNAME:AUTH_PASSWORD`)
- **Phone Numbers**: Must be in E.164 format (e.g., `+15551234567`)
- **Number of Participants**: 2-50 participants per session
- **Proxy Number Requirement**: You need **at least as many proxy numbers as participants**. A 2-person session needs 2 numbers in `NUMBER_POOL`.
- **Additional Properties**: Accepts all [Conversations CREATE properties](https://www.twilio.com/docs/conversations/api/conversation-resource#conversation-properties)

### Example: Creating a Session with cURL

If your password contains special characters (like `$`), use explicit Base64 encoding:

```bash
# Generate Base64 auth header
echo -n "admin:MyP@ssw0rd" | base64
# Output: YWRtaW46TXlQQHNzdzByZA==

# Use in request
curl -X POST http://localhost:3000/sessions \
  -H "Authorization: Basic YWRtaW46TXlQQHNzdzByZA==" \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["+15551234567", "+15559876543"],
    "friendlyName": "My Session"
  }'
```

### Successful Response

The app returns the created Conversation object:

```json
{
    "accountSid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "chatServiceSid": "ISXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "messagingServiceSid": "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "sid": "CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "friendlyName": "My Session",
    "uniqueName": null,
    "attributes": "{}",
    "state": "active",
    "dateCreated": "2024-03-31T04:24:04.000Z",
    "dateUpdated": "2024-03-31T04:24:04.000Z",
    "timers": {},
    "url": "https://conversations.twilio.com/v1/Conversations/CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "links": {
        "participants": "https://conversations.twilio.com/v1/Conversations/CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Participants",
        "messages": "https://conversations.twilio.com/v1/Conversations/CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Messages",
        "webhooks": "https://conversations.twilio.com/v1/Conversations/CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Webhooks"
    },
    "bindings": null
}
```

Save the `sid` to reference this conversation later.

## How It Works

When you create a session with participants `["+15551234567", "+15559876543"]`:

1. **Proxy Assignment**: Each participant gets a unique proxy number from your `NUMBER_POOL`
   - Participant 1 → Proxy Number A (e.g., `+15551111111`)
   - Participant 2 → Proxy Number B (e.g., `+15552222222`)

2. **SMS Communication**:
   - When Participant 1 texts their proxy number, Participant 2 sees it coming from Proxy B
   - When Participant 2 texts their proxy number, Participant 1 sees it coming from Proxy A
   - **Neither sees the other's real phone number**

3. **Voice Communication**:
   - When Participant 1 calls their proxy number, they're connected to Participant 2
   - For 3+ participants: everyone joins a conference call
   - All calls are anonymous - no real numbers exposed

## Testing Your Session

After creating a session, test it:

**SMS Test:**
```
1. From +15551234567, send an SMS to your assigned proxy number
2. +15559876543 will receive the message from a different proxy number
3. Reply from +15559876543 - the message routes back through the proxies
```

**Voice Test:**
```
1. From +15551234567, call your assigned proxy number
2. The system connects you to +15559876543
3. Neither party sees each other's real number
```

# Troubleshooting

## Common Errors

### 401 Unauthorized
**Problem**: Basic auth credentials are incorrect or not properly encoded.

**Solution**: 
- Verify `AUTH_USERNAME` and `AUTH_PASSWORD` in `.env`
- If password has special characters, use explicit Base64 encoding:
  ```bash
  echo -n "username:password" | base64
  ```

### 500 Internal Server Error: "Not enough numbers available in pool"
**Problem**: You don't have enough proxy numbers for your session participants.

**Solution**: 
- Add more phone numbers to `NUMBER_POOL` in `.env`
- Add the same numbers to `phoneNumbers.txt` (one per line)
- Run `npm run prepare` to regenerate the map
- You need **at least as many numbers as participants** (2-person session = 2 numbers minimum)

### "No active session for caller"
**Problem**: User called a proxy number but doesn't have an active session.

**Solution**:
- Create a session first via `/sessions` endpoint
- Verify the caller's number is in the session's `addresses` array
- Check that the conversation hasn't been closed

### Phone Number Not in Messaging Service
**Problem**: SMS messages receive default responses instead of routing through Conversations.

**Solution**:
1. Go to Twilio Console > Messaging > Services
2. Find your Messaging Service (e.g., "Default Conversations Service")
3. Add your phone numbers to the Sender Pool
4. Configure Integration settings to "Defer to sender's webhook"

### TypeScript Compilation Errors
**Problem**: Strict TypeScript checks may fail on first run.

**Solution**: The codebase uses strict TypeScript settings. See commit history for type fixes, or temporarily disable strict mode in `tsconfig.json` (not recommended for production).

## Retry Behavior

- The app automatically retries Twilio API calls on `429 - Too many requests` errors
- Configure retry behavior in `src/config/retry.config.ts`

# Architecture Notes

## Conversations Service

The app uses your Twilio account's **default Conversations service**. Every Twilio account has exactly one default service that doesn't require configuration. The app automatically uses it via:

```typescript
client.conversations.conversations.create(options)
```

If you want to use a **named Conversations service** instead, you'll need to modify the code to specify the service SID.

## Phone Number Geo-Routing

The app includes geo-routing to assign proxy numbers from the same geographic area as participants:

- `phoneNumbers.txt` - Your phone numbers (gitignored, one per line)
- `phoneNumbers.txt.example` - Example file to copy and customize
- `src/data/phoneNumberMap.json` - Generated mapping by country/area code (gitignored)
- `src/services/geoRouter.service.ts` - Geo-routing logic

**Setup:**
1. Copy `phoneNumbers.txt.example` to `phoneNumbers.txt`
2. Add your real phone numbers to `phoneNumbers.txt`
3. Run `npm run prepare` to generate the mapping

**When to regenerate:**
- After adding/removing numbers from `phoneNumbers.txt`
- The generated `phoneNumberMap.json` is gitignored and won't be committed

**Currently supports**: US, Canada, and international numbers (mapped by country code)

## Call Recording & Transcription

The app includes optional call recording and transcription features:

- **Recording**: Captures conference calls
- **Transcription**: Converts speech to text and posts to Conversation
- **Webhooks**: `/recording-status` and `/transcription-status` endpoints

See `src/services/recording.service.ts` and `src/services/transcription.service.ts` for implementation details.

# Testing

## Run Unit Tests
```bash
$ npm test
```

## Run Load Tests
```bash
$ npm run loadtest
```
Generates 300 conversations in 20ms intervals to test performance.
