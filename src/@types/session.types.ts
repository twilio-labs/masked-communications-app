import { ConversationListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation";

export interface SessionPostBody extends ConversationListInstanceCreateOptions {
    addresses: Array<string> 
}
  
export interface SessionDeleteBody {
    MessagingServiceSid: string
    RetryCount: string
    EventType: string
    DateUpdated: string
    State: string
    Attributes: string
    DateCreated: string
    ChatServiceSid: string
    AccountSid: string
    Source: string
    ConversationSid: string
}

export interface ActiveProxyAddresses {
    [key: string]: Array<string>
}

export interface ProxyBindings {
    [key: string]: string
}