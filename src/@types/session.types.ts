import { ConversationListInstanceCreateOptions } from "twilio/lib/rest/conversations/v1/conversation";

export interface SessionPostBody extends ConversationListInstanceCreateOptions {
  addresses: Array<string>;
}

export interface SessionDeleteBody {
  AccountSid: string;
  Attributes: string;
  ChatServiceSid: string;
  ConversationSid: string;
  DateCreated: string;
  DateUpdated: string;
  EventType: string;
  MessagingServiceSid: string;
  RetryCount: string;
  Source: string;
  State: string;
}

export interface ActiveProxyAddresses {
  [key: string]: Array<string>;
}

export interface ProxyBindings {
  [key: string]: string;
}
