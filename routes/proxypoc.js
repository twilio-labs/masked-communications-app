var express = require('express');
const { handle } = require('express/lib/application');
const { send } = require('express/lib/response');

var router = express.Router();

var client = require("twilio")(process.env.TWIL_FLEX_ACCOUNT_SID, process.env.TWIL_FLEX_ACCOUNT_KEY);

const numberPool = JSON.parse(process.env.NUMBER_POOL).sort();

async function cleanupConversation(conversationSid) {
  try { 
    await client.conversations.conversations(conversationSid).remove();
    console.log(`Removed new conversation successfully: ${newConversation.sid}`)
  } catch (removeError) {
    console.log(`Error occurred while removing ${newConversation.sid}: ${removeError}`);
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

async function fetchProxyAddressesInOpenConversations(address) {
  if (address === undefined) {
    throw "fetchOpenConversationsForAddress: address is missing";
  }

  const proxyAddresses = new Set();

  const conversations = await fetchOpenConversationsForAddress(address);
  conversations.forEach(p => {
    console.log(`Found a non-closed conversation ${p.conversationSid} with proxy address ${p.participantMessagingBinding.proxy_address} for address ${address}`);
    proxyAddresses.add(p.participantMessagingBinding.proxy_address);
  });

  return proxyAddresses;
}

async function createConversation() {
  return client.conversations.conversations.create();
}

async function addParticipantToConversation(conversationSid, address, proxyAddress) {
  return client.conversations.conversations(conversationSid).participants.create({
    'messagingBinding.address': address,
    'messagingBinding.proxyAddress': proxyAddress
  })
}

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
  
  const openConversationsProxyAddresses = await fetchProxyAddressesInOpenConversations(address);
  const availableNumbers = getSetOfAvailableNumbers(numberPool, openConversationsProxyAddresses);
  console.log(`Found proxy number candidates for ${address}: ${availableNumbers}`);

  if ( availableNumbers.length === 0) {
    throw 'No proxy numbers available';
  }

  const participant = await addParticipantToConversation(conversationSid, address, availableNumbers[0]);
  console.log(`Added participant ${address} successfully: ${participant.sid} to ${conversationSid}`);
  return participant;
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

    const say = response.say({
      voice: 'woman',
      language: 'en'
    }, 'Connecting you, please wait!');

    // We call the second participant from the associated proxy_address
    const dial = response.dial();
    dial.number({
        callerId: callee.messagingBinding.proxy_address
    }, callee.messagingBinding.address);
  }

  return response;
}

// Conversation events
router.post('/conversations', function(req, res, next) {
  console.log("Conversations event: ", req.body)
  res.send();
});

/*
* Calls handleInboundCall to handle inbound call event
*/
router.use('/inboundCall', async function(req, res, next) {

  console.log(`Got inbound call webhook event: ${req.body}`);
  const event = req.body;

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

  /*conversations.forEach( async c => {
    const ps = await c.participants().list();
    console.log(`${JSON.stringify(ps)}`)
  });*/

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


router.use('/global-webhook', function(req, res, next) {

  console.log(`Got conversation service webhook event query: ${JSON.stringify(req.body)}`);

  res.send({})
});

/*
* Creates a session (conversation) for the given address(es)
* For each address submitted, it will find a proxy number and address/proxy number as a participant to the newly created conversation
* IF any oepration fails, it will delete the conversation
*/
router.post('/sessions', async function(req, res, next) {

  console.time('createSession');
  const addresses = Array.isArray(req.body.address)?req.body.address:[req.body.address];
  try {
    const newConversation = await createConversation();
    console.log(`Created new conversation successfully: ${newConversation.sid}`)

    const requests = [];
    addresses.forEach( address => {
      requests.push(handleAddParticipant( newConversation.sid, address));
    });
    
    const values = await Promise.all(requests);

    const result = {
      sid: newConversation.sid,
      participants: values,
    }

    return res.status(200).send(`${JSON.stringify(result)}`);

  } catch(e) {
    if ( newConversation) {
      cleanupConversation(newConversation.sid);
    }
    console.log(`Couldnt create a new session for ${req.query.address}: ${e}`)
    return res.send(500, e);
  } finally {
    console.timeEnd('createSession');
  }
});

module.exports = router;
