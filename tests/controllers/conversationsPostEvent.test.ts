import request from 'supertest'
import {app} from '../../src/app/app'
import * as DeleteConversation from '../../src/utils/deleteConversation.util'

describe('conversations post event controller', () => {
  jest.setTimeout(3600000)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  // Test parameters
  const eventTypeOnConversationUpdated = 'onConversationUpdated'
  const eventTypeOther = 'otherEvent123'
  const closedState = 'closed'
  const otherState = 'state123'
  const conversationSid = 'CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

  it('should delete conversation', async () => {
    const deleteConversationSpy = jest
      .spyOn(DeleteConversation, 'deleteConversation')
      .mockResolvedValue(true)

    const res = await request(app)
      .post('/conversations-post-event')
      .set('content-type', 'application/json')
      .send({
        EventType: eventTypeOnConversationUpdated,
        State: closedState,
        ConversationSid: conversationSid,
      })

    expect(res.status).toEqual(200)
    expect(res.text).toEqual(`${conversationSid} deleted`)
    expect(deleteConversationSpy).toBeCalledWith(conversationSid)
  })

  it('should ignore if status != closed', async () => {
    const deleteConversationSpy = jest
      .spyOn(DeleteConversation, 'deleteConversation')
      .mockResolvedValue(true)

    const res = await request(app)
      .post('/conversations-post-event')
      .set('content-type', 'application/json')
      .send({
        EventType: eventTypeOnConversationUpdated,
        State: otherState,
        ConversationSid: conversationSid,
      })

    expect(res.status).toEqual(200)
    expect(res.text).toEqual('not processed')
    expect(deleteConversationSpy).toBeCalledTimes(0)
  })

  it('should ignore if eventType != onConversationUpdated', async () => {
    const deleteConversationSpy = jest
      .spyOn(DeleteConversation, 'deleteConversation')
      .mockResolvedValue(true)

    const res = await request(app)
      .post('/conversations-post-event')
      .set('content-type', 'application/json')
      .send({
        EventType: eventTypeOther,
        State: closedState,
        ConversationSid: conversationSid,
      })

    expect(res.status).toEqual(200)
    expect(res.text).toEqual('not processed')
    expect(deleteConversationSpy).toBeCalledTimes(0)
  })

  it('should return 500 if throws', async () => {
    const errorCode = 'ErrorCode123'

    const deleteConversationSpy = jest
      .spyOn(DeleteConversation, 'deleteConversation')
      .mockRejectedValue(new Error(errorCode))

    const res = await request(app)
      .post('/conversations-post-event')
      .set('content-type', 'application/json')
      .send({
        EventType: eventTypeOnConversationUpdated,
        State: closedState,
        ConversationSid: conversationSid,
      })

    expect(res.status).toEqual(500)
    expect(res.text).toEqual(`${conversationSid} failed to delete: Error: ${errorCode}`)
    expect(deleteConversationSpy).toBeCalledWith(conversationSid)
  })
})
