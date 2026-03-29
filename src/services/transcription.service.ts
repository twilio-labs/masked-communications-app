import client from '../twilioClient'
import { logger } from '../utils/logger'

export interface TranscriptionMetadata {
  recordingSid: string
  transcriptionSid: string
  conversationSid?: string
  status: 'completed' | 'failed'
  transcriptionText?: string
  confidence?: number
  createdAt: Date
}

/**
 * Handle transcription status callback
 * Processes completed or failed transcriptions
 */
export async function handleTranscriptionComplete(
  transcriptionSid: string,
  transcriptionText: string,
  recordingSid: string,
  conversationSid?: string
): Promise<TranscriptionMetadata> {
  try {
    const metadata: TranscriptionMetadata = {
      recordingSid,
      transcriptionSid,
      conversationSid,
      status: 'completed',
      transcriptionText,
      confidence: extractConfidence(),
      createdAt: new Date()
    }

    logger.info({
      transcriptionSid,
      recordingSid,
      conversationSid,
      textLength: transcriptionText.length
    }, 'Transcription completed')

    // Optional: Send transcription to conversation as message
    if (conversationSid) {
      await postTranscriptionToConversation(conversationSid, transcriptionText, transcriptionSid)
    }

    // TODO: Store transcription metadata in database

    return metadata
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      transcriptionSid,
      recordingSid
    }, 'Failed to handle transcription')
    throw error
  }
}

/**
 * Handle transcription failure
 */
export async function handleTranscriptionFailed(
  transcriptionSid: string,
  recordingSid: string,
  conversationSid?: string
): Promise<TranscriptionMetadata> {
  const metadata: TranscriptionMetadata = {
    recordingSid,
    transcriptionSid,
    conversationSid,
    status: 'failed',
    createdAt: new Date()
  }

  logger.warn({
    transcriptionSid,
    recordingSid,
    conversationSid
  }, 'Transcription failed')

  // TODO: Store failed transcription metadata in database

  return metadata
}

/**
 * Post transcription to conversation as a system message
 */
export async function postTranscriptionToConversation(
  conversationSid: string,
  transcriptionText: string,
  transcriptionSid: string
): Promise<void> {
  try {
    await client.conversations.conversations(conversationSid).messages.create({
      author: 'system',
      body: `📝 Call Transcript:\n\n${transcriptionText}`,
      attributes: JSON.stringify({
        type: 'transcription',
        transcriptionSid,
        timestamp: new Date().toISOString()
      })
    })

    logger.info({
      conversationSid,
      transcriptionSid
    }, 'Posted transcription to conversation')
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      conversationSid,
      transcriptionSid
    }, 'Failed to post transcription to conversation')
    // Don't throw - transcription was captured, just couldn't post it
  }
}

/**
 * Retrieve transcription details from Twilio
 */
export async function getTranscriptionDetails(transcriptionSid: string) {
  try {
    // Note: Twilio SDK may not have direct transcription endpoint
    // This is a placeholder for if/when it becomes available
    logger.info({ transcriptionSid }, 'Retrieved transcription details')
    return { transcriptionSid }
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      transcriptionSid
    }, 'Failed to retrieve transcription')
    throw error
  }
}

/**
 * Extract confidence score from transcription
 * Default to high confidence; can parse from metadata if available
 */
function extractConfidence(): number {
  // TODO: Parse confidence from Twilio metadata if available
  // For now, return default high confidence
  return 0.95
}
