import VoiceResponse from "twilio/lib/twiml/VoiceResponse";

import { getConversationByAddressPair } from "../utils/getConversationByAddressPair.util";

import client from '../twilioClient'

export const generateTwiml = async (from: string, to: string) => {
  let response = new VoiceResponse();

  const conversation = await getConversationByAddressPair(from, to)

  if (!conversation) {
    console.log(`No active session (conversation) for ${from}.`)
    response.say({
      voice: process.env.CALL_ANNOUCEMENT_VOICE as any,
      language: process.env.CALL_ANNOUCEMENT_LANGUAGE as any,
    }, process.env.OUT_OF_SESSION_MESSAGE_FOR_CALL);
  } else {
    const participants = await client.conversations
      .conversations(conversation.conversationSid)
      .participants
      .list()

    const participantsToDial = participants.reduce((result, p) => {
      if (p.messagingBinding.type === "sms" && p.messagingBinding.address != from) {
          console.log(`Adding ${p.messagingBinding.address} to list of numbers to dial.\n`)

          result.push({
              address: p.messagingBinding.address,
              proxyAddress: p.messagingBinding.proxy_address
          })
      }

      return result;
    }, [])

    response.say({
      voice: process.env.CALL_ANNOUCEMENT_VOICE as any,
      language: process.env.CALL_ANNOUCEMENT_LANGUAGE as any
    }, process.env.CONNECTING_CALL_ANNOUCEMENT);

    if (participantsToDial.length > 1) {
      const conferenceName = `${from}_at_${Date.now()}`

      const callPromises = participantsToDial.map(pa => {
          console.log(`Dialing ${pa.address} from ${pa.proxyAddress}...`);

          return client.calls.create({
              url: `https://${process.env.DOMAIN}/join-conference?conferenceName=${encodeURIComponent(conferenceName)}`,
              to: pa.address,
              from: pa.proxyAddress
          });
      });

      try {
        await Promise.all(callPromises)
      } catch(err) {
        console.log(err)
        throw new Error(err)
      }

      const dial = response.dial();
      dial.conference({
          endConferenceOnExit: true
      }, conferenceName);


    } else {
      const callee = participantsToDial[0]
      const dial = response.dial({
        callerId: callee.proxyAddress
      });

      dial.number(callee.address);
    }

  }

  return response;
}
