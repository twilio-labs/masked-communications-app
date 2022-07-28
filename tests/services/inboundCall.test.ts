
import client from '../../src/twilioClient'
import { generateTwiml } from '../../src/services/inboundCall.service'
import { getConversationByAddressPair } from "../../src/utils/getConversationByAddressPair.util";
import { listConversationParticipants } from '../../src/utils/listConversationParticipants.util';
import { participantsToDial } from '../../src/utils/participantsToDial.util'
import { generateConferenceName } from '../../src/utils/generateConferenceName.util'

jest.mock('../../src/twilioClient')
jest.mock("../../src/utils/getConversationByAddressPair.util")
jest.mock("../../src/utils/listConversationParticipants.util")
jest.mock('../../src/utils/participantsToDial.util')
jest.mock('../../src/utils/generateConferenceName.util')

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
  
  it('creates a conference and dials participants if dialList is longer than 1', async () => {
    process.env.DOMAIN = 'testdomain.com'
    process.env.CALL_ANNOUNCMENT_VOICE = 'alice'
    process.env.CALL_ANNOUCEMENT_LANGUAGE = 'en'
    process.env.CONNECTING_CALL_ANNOUCEMENT = 'Connecting you to your agent now.'
    
    let mockedClient = jest.mocked(client, true)
    const createSpy = jest.fn((callObject) => { return })
    const mockedConferenceName = jest.mocked(generateConferenceName, true)

    mockedClient['calls'] = {
        create: (options) => createSpy(options)
    } as any
    
    mockGetConversationAddressPair.mockResolvedValue({ conversationSid: 'CH123'} as any)
    mockListConversationParticipants.mockResolvedValue([{
      messagingBinding: {
        address: '+1112223333',
        proxyAddress: '+2223334444'
      }
    }] as any)

    const mockParticipantToDial = [{
      address: '+1112223333',
      proxyAddress: '+2223334444'
    }, {
      address: '+3334445555',
      proxyAddress: '+4445556666'
    }]

    mockParticipantsToDial.mockReturnValueOnce(mockParticipantToDial)
    mockedConferenceName.mockReturnValue('test_conference')

    const result = await generateTwiml('+1112223333', '+2223334444')

    expect(result.toString()).toBe("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say language=\"en\">Connecting you to your agent now.</Say><Dial><Conference endConferenceOnExit=\"true\">test_conference</Conference></Dial></Response>")

    expect(createSpy).toHaveBeenNthCalledWith(1,
      expect.objectContaining({
        to: '+1112223333',
        from: '+2223334444',
        url: 'https://testdomain.com/join-conference?conferenceName=test_conference'
      })
    )

    expect(createSpy).toHaveBeenNthCalledWith(2,
      expect.objectContaining({
        to: '+3334445555',
        from: '+4445556666',
        url: 'https://testdomain.com/join-conference?conferenceName=test_conference'
      })
    )
  })

  it('throws an error if an outbound call fails', async () => {
    process.env.DOMAIN = 'testdomain.com'
    process.env.CALL_ANNOUNCMENT_VOICE = 'alice'
    process.env.CALL_ANNOUCEMENT_LANGUAGE = 'en'
    process.env.CONNECTING_CALL_ANNOUCEMENT = 'Connecting you to your agent now.'
    
    let mockedClient = jest.mocked(client, true)
    const createSpy = jest.fn((callObject) => { return })
    const mockedConferenceName = jest.mocked(generateConferenceName, true)

    mockedClient['calls'] = {
        create: jest.fn(() => { throw new Error('Call fail') })
    } as any
    
    mockGetConversationAddressPair.mockResolvedValue({ conversationSid: 'CH123'} as any)
    mockListConversationParticipants.mockResolvedValue([{
      messagingBinding: {
        address: '+1112223333',
        proxyAddress: '+2223334444'
      }
    }] as any)

    const mockParticipantToDial = [{
      address: '+1112223333',
      proxyAddress: '+2223334444'
    }, {
      address: '+3334445555',
      proxyAddress: '+4445556666'
    }]

    mockParticipantsToDial.mockReturnValueOnce(mockParticipantToDial)

    await expect(generateTwiml('+1112223333', '+2223334444'))
      .rejects
      .toThrowError('Call fail')
  })

  it('connects caller with dial if there is only one other participant', async () => {
    process.env.CALL_ANNOUNCMENT_VOICE = 'alice'
    process.env.CALL_ANNOUCEMENT_LANGUAGE = 'en'
    process.env.CONNECTING_CALL_ANNOUCEMENT = 'Connecting you to your agent now.'

    mockGetConversationAddressPair.mockResolvedValue({ conversationSid: 'CH123'} as any)
    mockListConversationParticipants.mockResolvedValue([{
      messagingBinding: {
        address: '+1112223333',
        proxyAddress: '+2223334444'
      }
    }] as any)

    const mockParticipantToDial = [{
      address: '+1112223333',
      proxyAddress: '+2223334444'
    }]

    mockParticipantsToDial.mockReturnValueOnce(mockParticipantToDial)

    const result = await generateTwiml('+1112223333', '+2223334444')

    expect(result.toString()).toBe("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response><Say language=\"en\">Connecting you to your agent now.</Say><Dial callerId=\"+2223334444\"><Number>+1112223333</Number></Dial></Response>")
  })
})