import { addParticipant } from "./addParticipant.util"

export const retryAddParticipant = async (conversationSid: string, participantAddress: string, proxyAddresses: Array<string>) => {
  try {
    while(proxyAddresses.length > 0) {
      try {
        const participant = {
          'messagingBinding.address': participantAddress,
          'messagingBinding.proxyAddress': proxyAddresses[0]
        } as any
  
        return addParticipant(conversationSid, participant)
  
      } catch(err) {
        if (err.code === 50416) {
          const remainingProxyAddresses = proxyAddresses.shift()
          retryAddParticipant(conversationSid, participantAddress, remainingProxyAddresses as any)
        }
        console.log(err)
        throw new Error(err)
      }
    }

    throw new Error(`No proxy addresses available for ${participantAddress}`)
  } catch(err) {
    console.log(err)
    throw new Error(err)
  }
}