import client from '../twilioClient'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { logger } from '../utils/logger'
import { createRecordingTwiml } from './recording.service'
import {
  getConversationByAddressPair,
  participantsToDial,
  listConversationParticipants,
  generateConferenceName
} from '../utils/'

export function joinConferenceTwiml(conferenceName: string): VoiceResponse {
  const response = new VoiceResponse()
  const dial = response.dial()
  dial.conference(`${decodeURIComponent(conferenceName)}`)

  return response
}

export interface GenerateTwimlOptions {
  recordingEnabled?: boolean
  recordingCallbackUrl?: string
  transcriptionEnabled?: boolean
  transcriptionCallbackUrl?: string
}

export const generateTwiml = async (
  from: string,
  to: string,
  options: GenerateTwimlOptions = {}
): Promise<VoiceResponse> => {
  const response = new VoiceResponse()

  const conversation = await getConversationByAddressPair(from, to)

  if (conversation) {
    const participants = await listConversationParticipants(conversation.conversationSid)
    const dialList = participantsToDial(participants, from)

    response.say(
      {
        voice: process.env.CALL_ANNOUCEMENT_VOICE as any,
        language: process.env.CALL_ANNOUCEMENT_LANGUAGE as any
      },
      process.env.CONNECTING_CALL_ANNOUCEMENT as string
    )

    if (dialList.length > 1) {
      const conferenceName = generateConferenceName(from)

      const callPromises = dialList.map(pa => {
        logger.debug({
          address: pa.address,
          proxyAddress: pa.proxyAddress
        }, 'Dialing participant')

        return client.calls.create({
          to: pa.address,
          from: pa.proxyAddress,
          twiml: joinConferenceTwiml(conferenceName).toString()
        })
      })

      await Promise.all(callPromises)

      if (options.recordingEnabled) {
        return createRecordingTwiml(conferenceName, {
          recordingStatusCallback: options.recordingCallbackUrl,
          recordingTrack: 'both',
          transcribe: options.transcriptionEnabled,
          transcriptionCallback: options.transcriptionCallbackUrl
        })
      }

      const dial = response.dial()
      dial.conference(
        {
          endConferenceOnExit: true
        },
        conferenceName
      )
    } else {
      const callee = dialList[0]
      const dial = response.dial({
        callerId: callee.proxyAddress
      })

      dial.number(callee.address)
    }
  } else {
    logger.info({ from, to }, 'No active session for caller')
    response.say(
      {
        voice: process.env.CALL_ANNOUCEMENT_VOICE as any,
        language: process.env.CALL_ANNOUCEMENT_LANGUAGE as any
      },
      process.env.OUT_OF_SESSION_MESSAGE_FOR_CALL as string
    )
  }

  return response
}
