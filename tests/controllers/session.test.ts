import request from 'supertest'
import * as SessionService from '../../src/services/session.service'
import * as CreateConversation from '../../src/utils/createConversation.util'
import * as DeleteConversation from '../../src/utils/deleteConversation.util'
import { ConversationInstance } from 'twilio/lib/rest/conversations/v1/conversation'
import { Mock } from 'moq.ts'
import { app } from '../../src/app/app'

describe('sessions controller', () => {
  jest.setTimeout(60000)

  // Test parameters
  const requestedPhoneNumbers = ['+1001', '+1002']
  const activeProxyAddresses = {
    '+1001': ['+2001', '+2002'],
    '+1002': []
  }
  const availableProxyAddresses = {
    '+1001': ['+2003', '+2004'],
    '+1002': ['+2001', '+2002', '+2003', '+2004']
  }
  const conversationsSid = 'CHXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

  // Mocks
  const getActiveProxyAddressesSpy = jest
    .spyOn(SessionService, 'getActiveProxyAddresses')
    .mockResolvedValue(activeProxyAddresses)

  const matchAvailableProxyAddressesSpy = jest
    .spyOn(SessionService, 'matchAvailableProxyAddresses')
    .mockResolvedValue(availableProxyAddresses)

  // Apparently with jest following is not possible, at least I couldn't find anything like this
  const mockedConversationInstance = new Mock<ConversationInstance>()
    .setup(instance => instance.sid)
    .returns(conversationsSid)
    .object()

  const createConversationSpy = jest
    .spyOn(CreateConversation, 'createConversation')
    .mockResolvedValue(mockedConversationInstance)

  createConversationSpy.mockResolvedValue(mockedConversationInstance)

  // Tests
  it('should create a session', async () => {
    const addParticipantsToConversationSpy = jest
      .spyOn(SessionService, 'addParticipantsToConversation')
      .mockResolvedValue([])

    const res = await request(app)
      .post('/sessions')
      .set('Content-Type', 'application/json')
      .set('Authorization', process.env.AUTH_HEADER)
      .send({
        addresses: requestedPhoneNumbers
      })

    expect(res.status).toEqual(200)
    expect(getActiveProxyAddressesSpy).toBeCalledWith(requestedPhoneNumbers)
    expect(matchAvailableProxyAddressesSpy).toBeCalledWith(activeProxyAddresses)
    expect(createConversationSpy).toBeCalledWith({ addresses: requestedPhoneNumbers })
    expect(addParticipantsToConversationSpy).toBeCalledWith(conversationsSid, availableProxyAddresses)
  })

  it('should delete conversation on failure and return 500', async () => {
    const addParticipantsToConversationSpy = jest
      .spyOn(SessionService, 'addParticipantsToConversation')
      .mockRejectedValue([])

    const deleteConversationSpy = jest
      .spyOn(DeleteConversation, 'deleteConversation')
      .mockResolvedValue(true)

    const res = await request(app)
      .post('/sessions')
      .set('content-type', 'application/json')
      .set('Authorization', process.env.AUTH_HEADER)
      .send({
        addresses: requestedPhoneNumbers
      })

    expect(res.status).toEqual(500)
    expect(getActiveProxyAddressesSpy).toBeCalledWith(requestedPhoneNumbers)
    expect(matchAvailableProxyAddressesSpy).toBeCalledWith(activeProxyAddresses)
    expect(createConversationSpy).toBeCalledWith({ addresses: requestedPhoneNumbers })
    expect(addParticipantsToConversationSpy).toBeCalledWith(conversationsSid, availableProxyAddresses)
    expect(deleteConversationSpy).toBeCalledWith(conversationsSid)
  })
})
