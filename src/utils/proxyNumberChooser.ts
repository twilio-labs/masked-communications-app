
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const loki = require('lokijs');
const fs = require('fs');


export type Overlays = {
    [key: string] : Array<string>
};

export type ProxyNumber = {
    areaCode: string;
    subscriberNumber: string;
    countryCode: string;
    number: string;
};
  
export type ProxyNumberLookupResult = {
    areaCodeMatches: Array<ProxyNumber>,
    relatedAreaCodeMatches: Array<ProxyNumber>,
    countryCodeMatches: Array<ProxyNumber>,
    fallbackMatches: Array<ProxyNumber>
};

const OVERLAYS_FILE = `${process.cwd()}/areacode-overlays.csv`;
let OVERLAYS: Overlays = loadOverlays(OVERLAYS_FILE);

// We dont commit this to disk and will require us to load the proxy numbers on start 
var DB = new loki('maskedcomms.db', {
    autosave: true,
    autoload: true
});
const PROXY_NUMBERS = initDBCollection(DB);


/*
* Parses an multiline overlays string with in the format: 
* areaCode1-overlayAreaCode1[,overlayAreaCode2[,...]]
* areaCode2-overlayAreaCode1[,overlayAreaCode2[,...]]
* and returns an Overlays map
* Note this funciton will remove the areaCode from the list of overlays
*/
function parseOverlays(overlaysStr: string) : Overlays {

    let overlays:  {[key:string]: Array<string>} = {};
    const overlaysArr = overlaysStr.split('\n');

    for ( let i = 0; i < overlaysArr.length; ++i) {
        const entry = overlaysArr[i].split('-');
        const areaCode: string = entry[0];
        const areaCodes = entry[1].split(',');

        // The csv has has the area code in the list. We want to remove it
        // as it will allows to create easier search steps
        let idx = areaCodes.indexOf(areaCode);
        if ( idx > -1) {
            areaCodes.splice(idx, 1);
        }
        overlays[areaCode] = areaCodes;
    }
    return overlays;
}

/*
* Reads and parses the overlays from the given file
*/
function loadOverlays(fileName) : Overlays {
    try {
        const data = fs.readFileSync(fileName, { encoding: 'utf8' });
        const overlays = parseOverlays(data);
        return overlays;
      } catch (err) {
        console.log(err);
        throw err
      }
}

function initDBCollection(db): any {
    db.deleteDatabase( () => {});
    let proxyNumbers = db.getCollection('proxy_numbers');
    if ( proxyNumbers === null) {
        proxyNumbers = db.addCollection('proxy_numbers', {
        indices: ['countryCode', 'areaCode', 'number'],
        unique: ['number']});
    }

  return proxyNumbers;
}

function loadProxyNumbers(collection, numbers: Array<string>) {
    for ( let i = 0; i < numbers.length; ++i) {
        collection.insert(toProxyNumber(numbers[i]));
    }
}

/*
* Finds matching proxy numbers for the given number
*/
export function findProxyNumbers(proxyNumbers, number: ProxyNumber, exceptions: [], areaCodes: Overlays) : ProxyNumberLookupResult {

  const ad = proxyNumbers.find({
    'number': {'$nin':exceptions}
  });

  // Get all the numbers that we can use as a proxy number by removing the exceptions.
  // All these numbers may be used but in the next steps we will prioritize them according
  // to country code and area code
  const allAvailableNumbers = proxyNumbers.chain().find({
    'number': {'$nin':exceptions}
  });

  var areaCodeResultsResulset = allAvailableNumbers.branch();

  // Now let's priorityze the results
  // 1st by country code & area code
  var areaCodeMatches: Array<ProxyNumber> = areaCodeResultsResulset.find({
    '$and' : [{
      'countryCode': number.countryCode
    },{
      'areaCode': number.areaCode
    }]
  }).data();

  // 1a. Look up areaCodes that are related ie the overlays if we have any
  var relatedAreaCodeMatches: Array<ProxyNumber> = []
  if ( number.areaCode && (number.areaCode in areaCodes)) {
    var relatedAreaCodeResulset = allAvailableNumbers.branch();
    relatedAreaCodeMatches = relatedAreaCodeResulset.find({
        '$and' : [{
          'countryCode': number.countryCode
        },{
          'areaCode': {'$in': areaCodes[number.areaCode]}
        }]
      }).data();
  }

  // 2nd by country code and other area codes
  var countryCodeResulset = allAvailableNumbers.branch();
  const allAreaCodes = [number.areaCode];
  if ( number.areaCode && (number.areaCode in areaCodes)) {
    allAreaCodes.push(...areaCodes[number.areaCode]);
  }
  var countryCodeMatches: Array<ProxyNumber> = countryCodeResulset.find({
    '$and' : [{
      'countryCode': number.countryCode
    },{
      'areaCode': {'$nin': allAreaCodes}
    }]
  }).data();

  // Finally, all other numbers from other countries
  var fallbackResulset = allAvailableNumbers.branch();
  var fallbackMatches: Array<ProxyNumber> = fallbackResulset.find({
    'countryCode': {'$ne': number.countryCode}
  }).data();

  return { areaCodeMatches, relatedAreaCodeMatches, countryCodeMatches, fallbackMatches};
}

// Converts the given aNumber into a ProxyNumber
export function toProxyNumber(aNumber: string) : ProxyNumber {
  const number = phoneUtil.parse(aNumber, 'US');

  const nationalSignificantNumber = phoneUtil.getNationalSignificantNumber(number);
  var areaCode;
  var subscriberNumber;
  var areaCodeLength = phoneUtil.getLengthOfGeographicalAreaCode(number);
  if (areaCodeLength > 0) {
    areaCode = nationalSignificantNumber.substring(0, areaCodeLength);
    subscriberNumber = nationalSignificantNumber.substring(areaCodeLength);
  } else {
    areaCode = '';
    subscriberNumber = nationalSignificantNumber;
  }

  return {
    areaCode: areaCode,
    subscriberNumber:subscriberNumber,
    countryCode: number.getCountryCode(),
    number: aNumber
   };
}

// Test function
module.exports.testNumberChooser =  async function() {
    const proxyNumbers = PROXY_NUMBERS;

    // Load from the env
    const pool = process.env.NUMBER_POOL.split(',');
    loadProxyNumbers(proxyNumbers, pool);

    // Let's load some more Add number pool as collection to db
    proxyNumbers.insert(toProxyNumber('+19252148777'));
    proxyNumbers.insert(toProxyNumber('+19256398375'));
    proxyNumbers.insert(toProxyNumber('+15103067446'));
    proxyNumbers.insert(toProxyNumber('+61393065343'));
    proxyNumbers.insert(toProxyNumber('+971528976883'));
    proxyNumbers.insert(toProxyNumber('+13328990001'));
    proxyNumbers.insert(toProxyNumber('+19178990001'));
    proxyNumbers.insert(toProxyNumber('+12128990001'));
    proxyNumbers.insert(toProxyNumber('+72128990001'));

    // Get all proxy numbers that we can use for this participant
    let results = findProxyNumbers(proxyNumbers, toProxyNumber('+12128999591'), [], OVERLAYS);
    console.log('+12128999591:', results);

    results = findProxyNumbers(proxyNumbers, toProxyNumber('+15109885555'), [], OVERLAYS);
    console.log('+15109885555:', results);    

    results = findProxyNumbers(proxyNumbers, toProxyNumber('+19252149090'), [], OVERLAYS);
    console.log('+19252149090:', results);

    results = findProxyNumbers(proxyNumbers, toProxyNumber('+971528970909'), [], OVERLAYS);
    console.log('+971528970909:', results);

    results = findProxyNumbers(proxyNumbers, toProxyNumber('+61393065999'), [], OVERLAYS);
    console.log('+61393065999:', results);

    results = findProxyNumbers(proxyNumbers, toProxyNumber('+71238769090'), [], OVERLAYS);
    console.log('+71238769090:', results);

    results = findProxyNumbers(proxyNumbers, toProxyNumber('+9611238769090'), [], OVERLAYS);
    console.log('+9611238769090:', results);
}

// Test function
module.exports.stressTestNumberChooser =  async function() {
    const proxyNumbers = PROXY_NUMBERS;

    // Load from the env
    const pool = process.env.NUMBER_POOL.split(',');
    loadProxyNumbers(proxyNumbers, pool);

    // Let's load some more Add number pool as collection to db
    proxyNumbers.insert(toProxyNumber('+19252148777'));
    proxyNumbers.insert(toProxyNumber('+19256398375'));
    proxyNumbers.insert(toProxyNumber('+15103067446'));
    proxyNumbers.insert(toProxyNumber('+61393065343'));
    proxyNumbers.insert(toProxyNumber('+971528976883'));
    proxyNumbers.insert(toProxyNumber('+13328990001'));
    proxyNumbers.insert(toProxyNumber('+19178990001'));
    proxyNumbers.insert(toProxyNumber('+12128990001'));
    proxyNumbers.insert(toProxyNumber('+72128990001'));

    console.time();
    // Get all proxy numbers that we can use for this participant

    for ( let i = 0; i < 100000; ++i) {
        findProxyNumbers(proxyNumbers, toProxyNumber('+12128999591'), [], OVERLAYS);
        findProxyNumbers(proxyNumbers, toProxyNumber('+15109885555'), [], OVERLAYS);
        findProxyNumbers(proxyNumbers, toProxyNumber('+19252149090'), [], OVERLAYS);
        findProxyNumbers(proxyNumbers, toProxyNumber('+971528970909'), [], OVERLAYS);
        findProxyNumbers(proxyNumbers, toProxyNumber('+61393065999'), [], OVERLAYS);
        findProxyNumbers(proxyNumbers, toProxyNumber('+71238769090'), [], OVERLAYS);
        findProxyNumbers(proxyNumbers, toProxyNumber('+9611238769090'), [], OVERLAYS);
    }
    
    console.timeEnd();
}

module.exports.testNumberChooser();