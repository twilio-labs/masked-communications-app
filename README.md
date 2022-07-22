
# Masked Communications App
[![Tests](https://github.com/aymenn/masked-comms-app/actions/workflows/test.yml/badge.svg)](https://github.com/aymenn/masked-comms-app/actions/workflows/test.yml)

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
- A Twilio Account, you can get a free one [by signing up here](https://twilio.com/try-twilio)
- 1 or [more](https://www.twilio.com/docs/proxy/phone-numbers-needed) Twilio phone numbers to mask SMS and voice communications
- Node.js v14 or higher
- Yarn or NPM
- If you're running the app locally, you'll need a tool like [ngrok](https://ngrok.com/) so that Twilio can send webhooks to your app.

# Getting Started
Begin by cloning the repository, installing dependencies, and setting environment variables:

```bash
# Clone the repository:
$ git clone git@github.com:aymenn/masked-comms-app.git

# Make the repository your working directory:
$ cd masked-comms-app

# Install dependencies:
$ yarn install

# Copy the example envrionment variable file:
$ cp .env.example .env
```

| Variable Name                   | Description                                                                   | Example                                                    |
|---------------------------------|-------------------------------------------------------------------------------|------------------------------------------------------------|
| TWILIO_ACCOUNT_SID              | The identifier for your Twilio Account.                                       | ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX                             |
| TWILIO_AUTH_TOKEN               | The auth token for accessing the Twilio API.                                  | ******************************                             |
| NUMBER_POOL                     | An array of phone numbers to use as your number pool in e164 format.          | ["+141512345678", "+14230509876"]                          |
| CALL_ANNOUCEMENT_VOICE          | The type of voice to use for speech to text announcements.                    | "man", "woman", "alice", or any of the [Amazon Polly voices](https://www.twilio.com/docs/voice/twiml/say/text-speech#polly-standard-and-neural-voices). |
| CALL_ANNOUCEMENT_LANGUAGE       | The language to speak announcements in.                                       | "en" or any of the [supported languages](https://www.twilio.com/docs/voice/twiml/say#attributes-language).                    |
| OUT_OF_SESSION_MESSAGE_FOR_CALL | A message to play if someone calls the number pool without an active session. | "Your session is no longer active. Goodbye."               |
| CONNECTING_CALL_ANNOUCEMENT     | A message to play when a caller is being connected to the other party.        | "We're connecting you to your agent now."                  |
| DOMAIN                          | The domain where the application will be hosted.                              | "mysite.com" or "your-domain.ngrok.io" (no https://)             |
| AUTH_USERNAME                          | Basic auth username for request authorization                              | "mySecureUserName"           |
| AUTH_PASSWORD                          | Basic auth password for request authorization                              | "mySecretPassword"           |

Once you have your environment variables set, you can start the app with this command:

```bash
$ yarn dev

# or

$ npm run dev
```

To open a tunnel to your localhost that Twilio can send webhooks to, you can use ngrok:

```bash
$ ngrok http 3000
```

# Configuring Webhooks
Two webhooks can be configured in the Twilio Console:

1. Incoming call webhook: receives a request whenever a user makes an inbound call and connects them to the right people.
- Go to Twilio Console > Phone Numbers > Manage > Active Numbers > Click on the number to configure.
- Scroll down to the "Voice & Fax" configuration section to "A Call Comes In".
- Select "Webhook" from the dropdown and paste in your webhook: `https://[your-domain]/inbound-call`.

2. Conversation post-event webhook: this webhook can receive "conversation closed" events from Twilio Conversations and automatically delete the closed conversation. Keeping the pool of conversations small improves app performance and reduces cost.

- Go to Twilio Console > Conversations > Manage > Services > Your Service > Webhooks.
- Check the `onConversationStateUpdated` box.
- Paste your webhook (`https://[your-domain]/conversations-post-event`) into the Post-Event URL input box.
- Click "save" at the bottom of the page.

# Authentication & Webhook Validation
The app requires basic auth on request to the `/sessions` endpoint. This prevents an unauthorized person from creating sessions. To use basic auth, make sure `DOMAIN` (e.g. mysite.com, no http://), `AUTH_USERNAME`, and `AUTH_PASSWORD` are all set in your .env file, and restart the app.

Webhooks are automatically validated using the Twilio Webhook signature. This prevents an unauthorized request to start a phone call without your permission. For webhook validation to work, your app needs `DOMAIN` to be set along with `TWILIO_AUTH_TOKEN` in the .env file.

# Usage
You can create a new masked-number session between multiple users by making a post request to the `/sessions` endpoint:

```bash
curl --location --request POST 'localhost:3000/sessions' \
--header 'Authorization: Basic 123XYZ==' \
--header 'Content-Type: application/json' \
--data-raw '{
    "addresses": [
        "+1234567890",
        "+0123456789"
    ],
    "friendlyName": "My First Conversation"
}'
```
- The app supports basic auth, which can be configured in the .env file.
- Addresses is an array of e164 formatted phone numbers. You can add between 1-50 participants to a conversation at a time.
- The app also accepts all [conversations CREATE properties](https://www.twilio.com/docs/conversations/api/conversation-resource#conversation-properties), e.g. `friendlyName`.

The app will respond with the JSON from a typical Create Converation API call:

```json
{
    "accountSid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "chatServiceSid": "ISXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "messagingServiceSid": "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "sid": "CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "friendlyName": "My First Conversation",
    "uniqueName": null,
    "attributes": "{}",
    "state": "active",
    "dateCreated": "2022-07-22T05:41:18.000Z",
    "dateUpdated": "2022-07-22T05:41:18.000Z",
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

# Errors and Retries
- The app will retry requests to Twilio when it recieves a `429 - Too many requests` error code. You can configure the retry behavior in `src/config/retry.config.ts`.

- If you don't have enough phone numbers in your number pool, you'll receive a 500 response with the message `Not enough numbers available in pool for [phone_number]`.

# Running Tests
To execute unit tests, run:

```bash
$ yarn test
```

To conduct a load test on the app, run:
```bash
$ yarn loadtest
```
This will generate 300 conversations in 20ms intervals against the app.
