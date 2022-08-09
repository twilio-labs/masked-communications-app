import type { Request, Response } from 'express'
import { ConversationsPostEventBody } from '../@types/types'
import { deleteConversation } from '../utils/deleteConversation.util'

export const post = async (
  req: Request<{}, {}, ConversationsPostEventBody>,
  res: Response
) => {
  const {
    EventType: eventType,
    State: state,
    ConversationSid: conversationSid
  } = req.body

  if (eventType === 'onConversationUpdated' && state === 'closed') {
    try {
      await deleteConversation(conversationSid)
    } catch (err) {
      return res.status(500).send(`${conversationSid} failed to delete: ${err}`)
    }
    return res.status(200).send(`${conversationSid} deleted`)
  }
  return res.status(200).send('not processed')
}
