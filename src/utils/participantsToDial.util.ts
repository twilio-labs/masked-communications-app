import { ParticipantInstance } from "twilio/lib/rest/conversations/v1/conversation/participant";
import { ParticipantToDial } from "../@types/types";

export const participantsToDial = (participants: Array<ParticipantInstance>, from: string) : ParticipantToDial[] => {
  
  const output = participants.reduce((result, p) => {
    if (p.messagingBinding.type === "sms" && p.messagingBinding.address != from) {
        console.log(`Adding ${p.messagingBinding.address} to list of numbers to dial.\n`)
  
        result.push({
            address: p.messagingBinding.address,
            proxyAddress: p.messagingBinding.proxy_address
        })
    }
  
    return result;
  }, [])

  return output;
}
