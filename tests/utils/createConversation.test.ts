import dotenv from 'dotenv'
dotenv.config()

import { ConversationInstance } from 'twilio/lib/rest/conversations/v1/conversation'
import { CreateConversation } from "../../src/utils/createConversation.util"

describe('conversations service', () => {
  const mockValue = {} as ConversationInstance
  const testInstance = new CreateConversation
  
  let spy = jest.spyOn(testInstance, 'callCreate').mockResolvedValue(mockValue) 

  test("It creates a conversation", async () => {
    await testInstance.createConversation({friendlyName: 'test', addresses: ['1', '2']})
    expect(spy).toBeCalled()
  })
})

