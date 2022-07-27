
import { generateTwiml } from '../../src/services/inboundCall.service'
import { getConversationByAddressPair } from "../../src/utils/getConversationByAddressPair.util";
import { listConversationParticipants } from '../../src/utils/listConversationParticipants.util';
import { participantsToDial } from '../../src/utils/participantsToDial.util'


jest.mock("../../src/utils/getConversationByAddressPair.util")

jest.mock("../../src/utils/listConversationParticipants.util")

jest.mock('../../src/utils/participantsToDial.util')

describe('inbound call service', () => {
  const env = process.env
  const mockGetConversationAddressPair = jest.mocked(getConversationByAddressPair, true)
  const mockListConversationParticipants = jest.mocked(listConversationParticipants, true)
  const mockParticipantsToDial = jest.mocked(participantsToDial, true)


  beforeEach(() => {
    jest.resetModules()
    process.env = { ...env }

  })

  afterEach(() => {
    process.env = env
    jest.resetAllMocks()
  })

  it('returns out of session call announcement if no conversation if provided', async () => {
    mockGetConversationAddressPair.mockResolvedValue(undefined)

    process.env.CALL_ANNOUCEMENT_VOICE = 'alice'
    process.env.CALL_ANNOUCEMENT_LANGUAGE = 'en'
    process.env.OUT_OF_SESSION_MESSAGE_FOR_CALL = 'You session has ended, please call our main line.'
    const result = await generateTwiml('+1112223333', '+2223334444')

    expect(result.toString()).toBe("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say voice=\"alice\" language=\"en\">You session has ended, please call our main line.</Say></Response>")
  })

  it('creates a conference if dialList is longer than 1', async () => {
    
    mockGetConversationAddressPair.mockResolvedValue({ conversationSid: 'CH123'} as any)
    mockListConversationParticipants.mockResolvedValue([{
      messagingBinding: {
        address: '+1112223333',
        proxyAddress: '+2223334444'
      }
    }] as any)

    mockParticipantsToDial.mockResolvedValue([{
      messagingBinding: {
        address: '+1112223333',
        proxyAddress: '+2223334444'
      }
    }])

    const result = await generateTwiml('+1112223333', '+2223334444')

  })  


})