import { participantsToDial } from "../../src/utils"

describe('participantsToDial', () => {
  it('only dials SMS type bindings that are not the person calling', async () => {
    const participants = [
      {
        messagingBinding: {
          type: 'sms',
          address: '+1111111111',
          proxy_address: '+0000000000'
        }
      }, {
        messagingBinding: {
          type: 'chat',
          address: 'chat_client'
        }
      }, {
        messagingBinding: {
          type: 'sms',
          address: '+2222222222',
          proxy_address: '+0000000000'
        }
      }
    ] as any
    
    const result = participantsToDial(participants, '+1111111111')

    expect(result).toEqual([{"address": "+2222222222", "proxyAddress": "+0000000000"}])
  })
})