import client from '../twilioClient'
import { logger } from '../utils/logger'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

export interface RecordingConfig {
  recordingStatusCallback?: string
  recordingStatusCallbackMethod?: 'GET' | 'POST'
  recordingTrack?: 'inbound' | 'outbound' | 'both'
  transcribe?: boolean
  transcriptionCallback?: string
}

/**
 * Generate TwiML with recording enabled
 * @param conferenceName Conference name for the call
 * @param config Recording configuration
 * @returns VoiceResponse with recording
 */
export function createRecordingTwiml(
  conferenceName: string,
  config: RecordingConfig
): VoiceResponse {
  const response = new VoiceResponse()

  // Configure conference with recording
  const dial = response.dial()
  dial.conference(
    {
      recordingStatusCallback: config.recordingStatusCallback,
      recordingStatusCallbackMethod: config.recordingStatusCallbackMethod || 'POST',
      record: 'record-from-start'
    },
    decodeURIComponent(conferenceName)
  )

  return response
}

/**
 * Handle recording status callback
 * @param recordingSid Recording ID from Twilio
 * @param recordingUrl URL to download the recording
 * @param status Recording status
 * @param conversationSid Associated conversation
 */
export async function handleRecordingStatusCallback(
  recordingSid: string,
  recordingUrl: string,
  status: 'in-progress' | 'completed',
  conversationSid?: string
): Promise<void> {
  try {
    logger.info({
      recordingSid,
      recordingUrl,
      status,
      conversationSid
    }, 'Recording status update')

    // TODO: Store recording metadata in database
    // Example structure:
    // {
    //   recordingSid,
    //   recordingUrl,
    //   status,
    //   conversationSid,
    //   createdAt: new Date()
    // }
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      recordingSid
    }, 'Failed to handle recording status callback')
    throw error
  }
}

/**
 * Retrieve recording details from Twilio
 * @param recordingSid Recording ID
 * @returns Recording details
 */
export async function getRecordingDetails(recordingSid: string) {
  try {
    const recording = await client.recordings(recordingSid).fetch()
    logger.info({ recordingSid, duration: recording.duration }, 'Retrieved recording details')
    return recording
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      recordingSid
    }, 'Failed to retrieve recording')
    throw error
  }
}

/**
 * Delete a recording from Twilio
 * @param recordingSid Recording ID
 */
export async function deleteRecording(recordingSid: string): Promise<void> {
  try {
    await client.recordings(recordingSid).remove()
    logger.info({ recordingSid }, 'Recording deleted')
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      recordingSid
    }, 'Failed to delete recording')
    throw error
  }
}
