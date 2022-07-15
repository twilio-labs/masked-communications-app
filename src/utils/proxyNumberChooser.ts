
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const loki = require('lokijs');
const fs = require('fs/promises');


type Overlays = {
    [key: string] : Array<string>
};

type ProxyNumber = {
    areaCode: string;
    subscriberNumber: string;
    countryCode: string;
    number: string;
};
  
type ProxyNumberLookupResult = {
    areaCodeMatches: Array<ProxyNumber>,
    relatedAreaCodeMatches: Array<ProxyNumber>,
    countryCodeMatches: Array<ProxyNumber>,
    fallbackMatches: Array<ProxyNumber>
};

const OVERLAYS_FILE = `${process.cwd()}/areacode-overlays.csv`;
let OVERLAYS: Overlays = {}

var DB = new loki('maskedcomms.db', {
    autosave: true,
    autoload: true
});

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

async function loadOverlays() : Promise<Overlays> {
    try {
        const data = await fs.readFile(OVERLAYS_FILE, { encoding: 'utf8' });
        const overlays = parseOverlays(data);
        return overlays;
      } catch (err) {
        console.log(err);
        throw err
      }
}

function initDBCollection(): any {
    DB.deleteDatabase( () => {});
    let proxyNumbers = DB.getCollection('proxy_numbers');
    if ( proxyNumbers === null) {
        proxyNumbers = DB.addCollection('proxy_numbers', {
        indices: ['countryCode', 'areaCode', 'number'],
        unique: ['number']});
    }

  return proxyNumbers;
}

function findProxyNumbers(proxyNumbers, number: ProxyNumber, exceptions: [], areaCodes: Overlays) : ProxyNumberLookupResult {

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

  // TODO 1a. look up areaCodes that are related
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

function toProxyNumber(aNumber: string) : ProxyNumber {
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

module.exports.testNumberChooser =  async function() {
    OVERLAYS = await loadOverlays();
    const proxyNumbers = initDBCollection();

    // Add number pool as collection to db
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

module.exports.testNumberChooser();