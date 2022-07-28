
import client from '../../src/twilioClient'
jest.mock('../../src/twilioClient')
import { deleteConversation } from "../../src/utils";


describe('deleteConversation util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  it('it deletes conversation', async () => {
    let mockedClient = jest.mocked(client, true)

    let removeSpy = jest.fn(() => {
      return true
    })

    let conversationsSpy = jest.fn((options) => {
      return {
        remove: removeSpy
      }
    })
    
    mockedClient['conversations'] = {
      conversations: conversationsSpy
    } as any

    const result = await deleteConversation("myConversationSid")
    expect(result).toBe(true)
    
    expect(conversationsSpy).toBeCalledWith("myConversationSid")
    expect(removeSpy).toBeCalled()
  })

  it.skip('throws an error if Twilio client throws', async () => {

  })

  it.skip('retrys if error is 429', () => {

  })
})