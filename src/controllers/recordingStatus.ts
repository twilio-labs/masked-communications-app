import { Request, Response } from 'express'
import { RecordingStatusCallbackSchema } from '../utils/validation'
import { handleRecordingStatusCallback } from '../services/recording.service'
import { logger } from '../utils/logger'

export const post = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const parsed = RecordingStatusCallbackSchema.safeParse(req.body)

    if (!parsed.success) {
      logger.warn({
        errors: parsed.error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }, 'Invalid recording status callback')
      res.status(400).json({ error: 'Invalid request body', details: parsed.error.errors })
      return
    }

    const { RecordingSid, RecordingUrl, RecordingStatus, ConversationSid } = parsed.data

    await handleRecordingStatusCallback(RecordingSid, RecordingUrl, RecordingStatus, ConversationSid)

    res.status(200).send()
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      body: req.body
    }, 'Recording status callback failed')
    res.status(500).json({ error: 'Failed to process recording status' })
  }
}
