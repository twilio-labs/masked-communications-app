import { createConversation } from "../../src/utils";
import client from '../../src/twilioClient'

jest.mock('../../src/twilioClient')
let mockedClient = jest.mocked(client, true)

describe('createConversation util', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  
  it('it creates conversation with options passed', async () => {
    const createSpy = jest.fn((options) => { return options })
    mockedClient['conversations'] = {
      conversations: {
        create: (options) => createSpy(options)
      }
    } as any

    const result = await createConversation({ friendlyName: "my conversation", addresses: ['1', '2'] })
    
    expect(createSpy).toBeCalledWith({ friendlyName: "my conversation", addresses: ['1', '2'] })
    expect(result).toEqual({ friendlyName: "my conversation", addresses: ['1', '2'] })
  })

  it('calls quit if error is not a 429 retry', async () => {
    mockedClient['conversations'] = {
      conversations: {
        create: (options) => {
          throw new Error('Twilio Problem') 
        }
      }
    } as any

    const consoleSpy = jest.spyOn(console, 'log');

    try {
      await createConversation({ friendlyName: "my conversation", addresses: ['1', '2'] });
    } catch (e) {
      expect(consoleSpy).toHaveBeenCalledWith('Quit without retry');
    }
  })
})