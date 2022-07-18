
require('dotenv').config();

const {createConversation} = require('../src/utils/createConversation.util');


test("Creates a conversation", ()=>{
  return createConversation().then(data=>{
    expect(data.sid).toBeDefined();
  });
});