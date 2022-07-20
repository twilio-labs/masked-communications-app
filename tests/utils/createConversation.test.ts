import { createConversation } from "../../src/utils";
import client from '../../src/twilioClient'

jest.mock('../../src/twilioClient')
let mockedClient = jest.mocked(client, true)

describe('createConversation util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  it('it creates conversation with options passed', async () => {
    const createSpy = jest.fn((options) => {})
    mockedClient['conversations'] = {
      conversations: {
        create: (options) => createSpy(options)
      }
    } as any

    createConversation({ friendlyName: "my conversation", addresses: ['1', '2'] })
    
    expect(createSpy).toBeCalledWith({ friendlyName: "my conversation", addresses: ['1', '2'] })
  })

  it('calls quit if error is not a 429 retry', async () => {
    
  })
})