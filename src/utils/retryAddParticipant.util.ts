import { addParticipant } from "./addParticipant.util"

export async function retryAddParticipant(conversationSid: string, participantAddress: string, proxyAddresses: Array<string>) {
  if(proxyAddresses.length < 1) {
    throw new Error(`No available proxy addresses for ${participantAddress}`)
  }
  
  try {
    const participant = {
      'messagingBinding.address': participantAddress,
      'messagingBinding.proxyAddress': proxyAddresses[0]
    } as any

    const result = await addParticipant(conversationSid, participant)
    return result
  } catch(err) {
    if (err.code === 50416) {
      proxyAddresses.shift()
      return retryAddParticipant(conversationSid, participantAddress, proxyAddresses)
    } else {
      console.log('hereherh')
      console.log(err)
      throw new Error(err)
    }
  }
}