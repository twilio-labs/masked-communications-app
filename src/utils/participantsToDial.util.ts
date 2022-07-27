import { ParticipantInstance } from "twilio/lib/rest/conversations/v1/conversation/participant";

export const participantsToDial = (participants: Array<ParticipantInstance>, from: string) : ParticipantsToDial => {
  
  let accumulator: {address: string, proxyAddress: string }[]
  return participants.reduce((result, p) => {
    if (p.messagingBinding.type === "sms" && p.messagingBinding.address != from) {
        console.log(`Adding ${p.messagingBinding.address} to list of numbers to dial.\n`)
  
        result.push({
            address: p.messagingBinding.address,
            proxyAddress: p.messagingBinding.proxy_address
        })
    }
  
    return result;
  }, accumulator)
}
