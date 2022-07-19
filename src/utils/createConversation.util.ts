import { ConversationInstance } from "twilio/lib/rest/conversations/v1/conversation";
import { SessionPostBody } from "../@types/types"; 
import client from "../twilioClient";

import retry from 'async-retry';

export class CreateConversation {

  async callCreate (options) {
    return client.conversations.conversations.create(options);
  }
  
  async createConversation (options: SessionPostBody) : Promise<ConversationInstance> {
    
    return retry(async (quit) => {
      try {
        const conversation = await this.callCreate(options);
        return conversation;
      } catch (err) {
        if (err.status !== 429) {
          quit(new Error(err));
          return;
        }
  
        console.log('Re-trying on 429 error');
        throw new Error(err);
      }
    })
  }
}
