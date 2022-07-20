[![Tests](https://github.com/aymenn/masked-comms-app/actions/workflows/test.yml/badge.svg)](https://github.com/aymenn/masked-comms-app/actions/workflows/test.yml)

# About
This is an example masked communicaiton application that demonstrates how build it by using [Conversations API](https://twilio.com/docs/conversations) and [Programmable Voice](https://twilio.com/docs/voice).

This application supports masking communicaitons between SMS, WhatsApp, and voice participants

# Prerequisites
- Twilio Account
- 1 or more Twilio phone numbers (either bought or verified) to mask SMS and voice communications
- Node.js v14 or higher
- ngrok if running a local server

# Getting Started
1. Copy .env.template to .env
2. Set your account sid and auth token in the corresponding variables
3. Set NUMBER_POOL to an array of phone number(s) e.g.
> NUMBER_POOL=["+19255551111","+19257775555"]
1. If using ngrok, start ngrok for port 9000 
> ngrok http 9000
5. Configure your phone number's inbound call handler with the url *https://your_ngrok_server/proxypoc/inboundCall*
6. Install the app dependency packages
> npm install
7. Start your npm server
> npm start

# Authorization
This app protects API calls to /sessions with basic auth. You can set your basic auth username and password in the .env file.

# Using
This application provides an endpoint to create a conversation for participants to communicate and a landing page to simplify getting started.

1. Navigate your browser to *http://localhost:9000/*
2. You will see the configured phone numbers and a section titled *Create a new proxy session*
3. Enter the numbers of two participant that you wish to connect anonymously
4. Click *Submit*
5. A JSON string is presented which contains an array of the participants added to the conversation. Each participant will have a messaging_binding.proxy_address. This is the address that the participants will send and receive numbers to and from
6. Have participant A send a message to their proxy_number
7. Participant B should receive the message from the Participant A's proxy_number
8. You can also have participant A call the proxy_number. This should set up a call to Participant B and participant B should see Participant A's proxy phone number

# Endpoint
## /sessions
The sessions endpoint accepts one or more addresses. It creates a Conversation, finds a Proxy number for each participant and adds them to the conversation

## /inboundCall
This endpoint receives inbound call events. It will query Twilio Conversations for a matching participant address and connect the other participant to the caller

# Number Choosing
The number chooser included is a simple algorithm that picks a number from NUMBER_POOL that isnt used by the given participant's address.
