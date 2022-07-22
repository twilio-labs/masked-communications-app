require('dotenv').config()
const fetch = require('node-fetch')
const twilio = require('twilio')

const port = process.env.PORT || 3000

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function makeRequest(contacts) {
  const body = { addresses: contacts }
  
  return new Promise((resolve, reject) => {

    fetch(`http://localhost:${port}/sessions`, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'}
    })
    .then(res => {
      const data = res.json()
      resolve(data)
    })
    .catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

async function runTest() {
  console.time('testCreate');
  
  // Create some sessions 
  let results = [];
  try {
    const requests = [];
    for (let i = 0; i < 300; ++i) {
      const contacts = ['+1925215'+ ('0000'+i).slice(-4), '+1925635'+ ('0000'+i).slice(-4)];
      console.log(contacts)
      
      const promise = makeRequest(contacts)
      requests.push(promise);
      await sleep(2)
    }
    
    results = await Promise.allSettled(requests);
    console.timeEnd('testCreate');
  } catch(e) {
    console.error(`failed ${JSON.stringify(e)}`);
  } finally {

    const deletePromises = []

    for (let i = 0; i < results.length; ++i) {
      const response = results[i];
      
      console.log(response.value.sid);
      try {
        if(results[i].status === 'rejected') {
          // The conversation is deleted if something goes wrong
          // cleanupConversation(results[i].reason.sid);
        } else {
          // This is a test function, delete the conversation, we dont need it
          if (response.value.sid) {
            console.log(`Removing conversation ${response.value.sid}`);
          }
          const deletePromise = client.conversations.conversations(response.value.sid).remove()
          deletePromises.push(deletePromise)
        }
      } catch(e){
        console.error(`Couldnt delete convo ${results[i]}: ${JSON.stringify(e)}`)
      }
      await sleep(50)
    }

    try {
      await Promise.all(deletePromises)
    } catch (err) {
      console.log(err);
    }

    console.log('Done cleaning up conversations')

  }
}

runTest()