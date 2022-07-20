import twilio from "twilio";
require('dotenv').config(); // Needed to work with jest

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN)
  throw Error(
    "TWILIO_ACCOUNT_SID &/or TWILIO_AUTH_TOKEN are missing from environment variables."
  );

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default client;
