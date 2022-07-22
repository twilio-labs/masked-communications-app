import twilio from "twilio";

let TWILIO_ACCOUNT_SID
let TWILIO_AUTH_TOKEN

if (process.env.NODE_ENV === "test") {
  TWILIO_ACCOUNT_SID = "ACabc"
  TWILIO_AUTH_TOKEN = "123"
} else {
  TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN = process.env. TWILIO_AUTH_TOKEN
}


if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  throw Error(
    "TWILIO_ACCOUNT_SID &/or TWILIO_AUTH_TOKEN are missing from environment variables."
  );
}

const client = twilio(
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
);

export default client;
