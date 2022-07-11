import type { Request, Response } from "express";
import { twiml } from 'twilio'
import { getConversationByAddressPair } from "../utils/getConversationByAddressPair.util";
const { VoiceResponse } = twiml

import client from '../twilioClient'

const generateTwiml = async (to: string, from: string) => {
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

    const otherParticipants = participants.filter((participant) => {
      if (participant.messagingBinding.address !== from) {
        return participant;
      }
    })

    response.say({
      voice: process.env.CALL_ANNOUCEMENT_VOICE as any,
      language: process.env.CALL_ANNOUCEMENT_LANGUAGE as any
    }, process.env.CONNECTING_CALL_ANNOUCEMENT);

    if (otherParticipants.length > 1) {
      // Converence Participants
    } else {
      const callee = otherParticipants[0]
      const dial = response.dial({
        callerId: callee.messagingBinding.proxy_address
      });

      dial.number(callee.messagingBinding.address);
    }

  }

  return response;

}

export const post = async (
  req: Request,
  res: Response
) => {
  const { body } = req.body;
  const { to, from } = body;

  const twiml = generateTwiml(to, from);

  res.set('Content-Type', 'text/xml')
  res.send(twiml.toString())

};