import { ConversationInstance } from "twilio/lib/rest/conversations/v1/conversation";
import { SessionPostBody } from "../@types/types"; 
import client from "../twilioClient";

import retry from 'async-retry';

export const createConversation = async (options: SessionPostBody) : Promise<ConversationInstance> => {

  return retry(async (quit) => {
    try {
      const conversation = await client.conversations.conversations.create(options);
      return conversation;
    } catch (err) {
      if (err.status !== 429) {
        console.log(err)
        quit(new Error('Quit without retry'));
        return;
      }

      console.log('Re-trying on 429 error');
      throw new Error(err);
    }
  })
}