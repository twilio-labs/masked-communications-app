import { Request, Response } from 'express'
import { TranscriptionStatusCallbackSchema } from '../utils/validation'
import {
  handleTranscriptionComplete,
  handleTranscriptionFailed
} from '../services/transcription.service'
import { logger } from '../utils/logger'

export const post = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const parsed = TranscriptionStatusCallbackSchema.safeParse(req.body)

    if (!parsed.success) {
      logger.warn({
        errors: parsed.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }, 'Invalid transcription status callback')
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors })
      return
    }

    const { TranscriptionSid, TranscriptionText, TranscriptionStatus, RecordingSid, ConversationSid } =
      parsed.data

    if (TranscriptionStatus === 'completed') {
      const metadata = await handleTranscriptionComplete(
        TranscriptionSid,
        TranscriptionText || '',
        RecordingSid,
        ConversationSid
      )
      res.status(200).json(metadata)
    } else {
      const metadata = await handleTranscriptionFailed(TranscriptionSid, RecordingSid, ConversationSid)
      res.status(200).json(metadata)
    }
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      body: req.body
    }, 'Transcription status callback failed')
    res.status(500).json({ error: 'Failed to process transcription status' })
  }
}
