import client from '../twilioClient'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

import {
  getConversationByAddressPair,
  participantsToDial,
  listConversationParticipants,
  generateConferenceName
} from '../utils/'

export const generateTwiml = async (from: string, to: string) => {
  const response = new VoiceResponse()

  const conversation = await getConversationByAddressPair(from, to)

  if (!conversation) {
    console.log(`No active session (conversation) for ${from}.`)
    response.say({
      voice: process.env.CALL_ANNOUCEMENT_VOICE as any,
      language: process.env.CALL_ANNOUCEMENT_LANGUAGE as any
    }, process.env.OUT_OF_SESSION_MESSAGE_FOR_CALL)
  } else {
    const participants = await listConversationParticipants(conversation.conversationSid)
    const dialList = participantsToDial(participants, from)

    response.say({
      voice: process.env.CALL_ANNOUCEMENT_VOICE as any,
      language: process.env.CALL_ANNOUCEMENT_LANGUAGE as any
    }, process.env.CONNECTING_CALL_ANNOUCEMENT)

    if (dialList.length > 1) {
      const conferenceName = generateConferenceName(from)

      const callPromises = dialList.map(pa => {
        console.log(`Dialing ${pa.address} from ${pa.proxyAddress}...`)

        return client.calls.create({
          url: `https://${process.env.DOMAIN}/join-conference?conferenceName=${encodeURIComponent(conferenceName)}`,
          to: pa.address,
          from: pa.proxyAddress
        })
      })

      await Promise.all(callPromises)

      const dial = response.dial()
      dial.conference({
        endConferenceOnExit: true
      }, conferenceName)
    } else {
      const callee = dialList[0]
      const dial = response.dial({
        callerId: callee.proxyAddress
      })

      dial.number(callee.address)
    }
  }

  return response
}
