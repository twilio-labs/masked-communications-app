var express = require('express');
var client = require("twilio")(process.env.TWIL_FLEX_ACCOUNT_SID, process.env.TWIL_FLEX_ACCOUNT_KEY);

const router = express.Router();
const numberPool = JSON.parse(process.env.NUMBER_POOL).sort();

async function cleanupConversation(conversationSid) {
  try { 
    await client.conversations.conversations(conversationSid).remove();
    console.log(`Removed new conversation successfully: ${conversationSid}`)
  } catch (removeError) {
    console.log(`Error occurred while removing ${conversationSid}: ${removeError}`);
  }
}

// Finds a single conversation for a participant with the given address and proxy address
async function getOpenConversationForAddressPair(address, proxyAddress) {

  if (address === undefined) {
    throw "getOpenConversationsForAddressPair: address is missing";
  }
  const params = {address: address, limit: 500};

  const participantConversations = await client.conversations.participantConversations.list(params);
  const conversation = participantConversations.find(p => {
    if (p.conversationState !== 'closed' && p.participantMessagingBinding.proxy_address === proxyAddress) {
      console.log(`Found a non-closed conversation ${p.conversationSid} with proxy address ${p.participantMessagingBinding.proxy_address} for address ${address}`);
      return p;
    }
  });

  return conversation;
}

// Finds all non-closed conversations in the list of conversations objects
async function getOpenConversationsForAddress(conversationsList) {

  const openConversationsProxyAddresses = new Set();

  conversationsList.forEach(p => {
    if (p.conversationState !== 'closed') {
      openConversationsProxyAddresses.add(p);
    }
  });

  return openConversationsProxyAddresses;
}

// Fetches the ParticipantConversations for the given address and returns all non closed conversations
async function fetchOpenConversationsForAddress(address) {
  if (address === undefined) {
    throw "fetchOpenConversationsForAddress: address is missing";
  }
  const params = {address: address, limit: 500};
  const participantConversations = await client.conversations.participantConversations.list(params);
  return getOpenConversationsForAddress(participantConversations);
}

// Helper method that fetches a Particpant's open Conversations and returns a Set of 
// the proxy_addresses in all those open conversations
async function fetchProxyAddressesInOpenConversationsForAddress(address) {
  if (address === undefined) {
    throw "fetchProxyAddressesInOpenConversationsForAddress: address is missing";
  }

  const proxyAddresses = new Set();

  const conversations = await fetchOpenConversationsForAddress(address);
  conversations.forEach(p => {
    console.log(`Found a non-closed conversation ${p.conversationSid} with proxy address ${p.participantMessagingBinding.proxy_address} for address ${address}`);
    proxyAddresses.add(p.participantMessagingBinding.proxy_address);
  });

  return proxyAddresses;
}

// Helper function for create /Conversations endpoint
async function createConversation(sessionOpts) {
  return client.conversations.conversations.create(sessionOpts);
}

// Helper function for Conversations create /Participants endpoint
async function addParticipantToConversation(conversationSid, address, proxyAddress) {
  return client.conversations.conversations(conversationSid).participants.create({
    'messagingBinding.address': address,
    'messagingBinding.proxyAddress': proxyAddress
  })
}

// Get the numbers in the numberPool that are not in activeSessionNumbers
// This is accomplished by filtering out the activeSessionNumbers out of the number pool
function getSetOfAvailableNumbers(numberPool, activeSessionNumbers) {
  const notAvailableNumbers = new Set(activeSessionNumbers);

  const avalableNumbers = numberPool.filter((number) => {
    // return those elements not in the notAvailableNumbers
    return !notAvailableNumbers.has(number);
  });

  console.log(`Available numbers are: ${avalableNumbers}`)
  return avalableNumbers;
}

async function handleAddParticipant(conversationSid, address) {
  
  const openConversationsProxyAddresses = await fetchProxyAddressesInOpenConversationsForAddress(address);
  const availableNumbers = getSetOfAvailableNumbers(numberPool, openConversationsProxyAddresses);
  console.log(`Found proxy number candidates for ${address}: ${availableNumbers}`);

  if ( availableNumbers.length === 0) {
    throw 'No proxy numbers available';
  }

  // We need to iterate over the list of available numbers until we add the participant successfully
  // This is needed since we may issue more than one request for a given number to add to a session
  // for e.g. a driver has multiple deliveries to make
  for ( let i = 0; i < availableNumbers.length; ++i) {
    try {
      console.log(`Try add ${address} with proxy_address ${availableNumbers[i]} to conversation ${conversationSid}`);
      const participant = await addParticipantToConversation(conversationSid, address, availableNumbers[i]);
      console.log(`Added participant ${address} successfully: ${participant.sid} to ${conversationSid}`);
      return participant;
    } catch (e) {
      console.log(`Failed to add participant ${address} with proxy_address ${availableNumbers[i]}: ${JSON.stringify(e)}`)
    }
  }

  // if we get here, it means we couldnt find a suitable number
  throw 'No proxy numbers available';
}

/*
* Uses the from and the to call event attribtues to find a matching participant in a conversation and
* it will either connect the call to a participant or make an annoucement
*/
async function handleInboundCall(call) {

  // TODO check for required values

  const proxyAddress = call.To;
  const address = call.From;

  // let's see if this caller has a session (a conversation with the address/proxy address pair)
  const conversation = await getOpenConversationForAddressPair(address, proxyAddress);

  const VoiceResponse = require('twilio').twiml.VoiceResponse;
  const response = new VoiceResponse();

  if ( !conversation) {
    console.log(`Didnt find matching session (conversation) for ${address}/${proxyAddress}`);
    response.say({
      voice: 'woman',
      language: 'en'
    }, 'Sorry, I dont know who to connect you to!');
  } else {

    // We got the conversation, let's get the participants in the convo.
    // We only support connecting one but this could be extended to create a conference
    const participants = await client.conversations.conversations(conversation.conversationSid).participants.list();
    const callee = participants.find( participant => {
      if ( participant.messagingBinding.address !== address) {
        return participant;
      }
    });

    response.say({
      voice: 'woman',
      language: 'en'
    }, 'Connecting you, please wait!');

    // We call the second participant from the associated proxy_address
    const dial = response.dial({
      callerId: callee.messagingBinding.proxy_address
    });
    dial.number(callee.messagingBinding.address);
  }

  return response;
}

/*
* Calls handleInboundCall to handle inbound call event
*/
router.use('/inboundCall', async function(req, res, next) {
  const event = req.body;
  console.log("Got inbound call webhook event: ", event);
  
  try {
    const twiml = await handleInboundCall(event);
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString())  
  } catch(e) {
    console.log(`Something went wrong when handling inbound call ${e}`)
    res.send(500, e);
  }
});

// Returns the Conversations reverse chrono order
router.get('/sessions', async function(req, res, next) {
  const conversations =  await client.conversations.conversations.list({limit: req.query.limit?parseInt(req.query.limit):20});
  conversations.sort((a, b) => {
    if ( a.state === b.state) {
      return b.dateCreated - a.dateCreated;
    }
    return a.state==='closed'?1:-1;
  });

  res.render('conversations', { title: 'Conversations', conversations });
});

/*
* Returns a JSON doc of the participants in the conversation in which the given address and proxyAddress are a part of
* There should only be 1 conversation that matches.
*/
router.use('/participants', async function(req, res, next) {

  const address = req.query.address;
  const proxyAddress = req.query.proxyAddress;
  const conversation = await getOpenConversationForAddressPair( address, proxyAddress);
  if (conversation) {
    const participants = await client.conversations.conversations(conversation.conversationSid).participants.list();
    return res.status(200).send(`${JSON.stringify(participants)}`);
  }

  return res.send(404);
});

/*
 * Renders all (active, inactive, closed) Conversations which the given phoneNumber is participant
 * of in reverse chrono order (:phoneNumber(\\+[0-9]{11}))
*/
router.get('/participantsessions', async function(req, res, next) {
  if ( req.query.phoneNumber ) {

    const params = {address: req.query.phoneNumber, limit: 500};
    const conversations = await client.conversations.participantConversations.list(params);
    conversations.sort((a, b) => {
      if ( b.conversationState === 'active') {
        return 1;
      }
      return -1;
    });
    return res.render('participantConversations', { title: 'Conversations', conversations });
  }

  const conversations =  await client.conversations.conversations.list({limit: 10});
  conversations.sort((a, b) => {
    return b.dateCreated - a.dateCreated;
  });
  
  conversations.forEach( async c => {
    const ps = await c.participants().list();
    console.log(`${JSON.stringify(ps)}`)
  });

  res.render('conversations', { title: 'Conversations', conversations });
});

// Handle out of session messages
// Pre-requisite - This endpoint must be set as post event global webhook
router.use('/global-webhook', async function(req, res, next) {

  console.log(`Got conversation service webhook event query: ${JSON.stringify(req.body)}`);
  if  ( req.body.EventType !== 'onConversationAdded') {
    return res.send({});
  }

  if ( !req.body['ConversationSid']) {
    return res.send({});
  }

  // Send a friendly message
  const messageOpts = {
    author: 'System',
    body: 'Thank you for contacting us. Please call us on 123123123',

  }
  await client.conversations.conversations(req.body.ConversationSid).messages.create(messageOpts);
  await cleanupConversation(req.body.ConversationSid.sid);

  res.send({});
});


async function handleCreateSession(sessionOpts, addresses) {

  let newConversation;
  try {
    newConversation = await createConversation(sessionOpts);
    console.log(`Created new conversation successfully: ${newConversation.sid}`)
  } catch (e) {
    console.log(`Couldnt create a new session for ${JSON.stringify(addresses)}: ${e}`)
    const error = {
      message: 'Could not create session',
      raw_message: JSON.stringify(e),
    }

    throw error;
  }

  try {
    const participants = [];
    for ( let i = 0; i < addresses.length; ++i) {
      participants[i] = await handleAddParticipant(newConversation.sid, addresses[i]);
    }
    
    const result = {
      sid: newConversation.sid,
      participants,
    }

    return result;

  } catch(e) {
    console.log(`Couldnt add participants to a new session for ${JSON.stringify(addresses)}: ${e}`)
    if ( newConversation) {
      cleanupConversation(newConversation.sid);
    }
    const error = {
      message: 'Could not add participants session',
      raw_message: JSON.stringify(e),
    }

    throw error;
  }
}

/*
* Creates a session (conversation) for the given address(es)
* For each address submitted, it will find a proxy number and address/proxy number as a participant to the newly created conversation
* IF any oepration fails, it will delete the conversation
*/
router.post('/sessions', async function(req, res, next) {

  const addresses = Array.isArray(req.body.address)?req.body.address:[req.body.address];
  console.time('sessionCreate');

  const sessionOpts = {
    attributes: req.body.attributes,
    friendlyName: req.body.friendlyName,
    messagingServiceSid: req.body.messagingServiceSid,
    timers: {
      inactive: req.body["timers.inactive"],
      closed: req.body["timers.closed"],
    },
    uniqueName: req.body.uniqueName,
    xTwilioWebhookEnabled: req.body.xTwilioWebhookEnabled,
  };

  console.log(`Got session opts: ${JSON.stringify(sessionOpts)}`);

  try {
    const result = await handleCreateSession(sessionOpts, addresses);
    return res.status(200).send(`${JSON.stringify(result)}`);

  } catch(e) {
    console.log(`Couldnt create a new session for ${JSON.stringify(addresses)}: ${JSON.stringify(e)}`)
    return res.send(500, JSON.stringify(e));
  } finally {
    console.timeEnd('sessionCreate');
  }
});

module.exports = router;
