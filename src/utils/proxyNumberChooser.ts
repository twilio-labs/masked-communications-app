
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const loki = require('lokijs');

type ProxyNumber = {
  areaCode: string;
  subscriberNumber: string;
  countryCode: string;
  number: string;
};

type ProxyNumberLookupResult = {
  areaCodeMatches: Array<ProxyNumber>,
  countryCodeMatches: Array<ProxyNumber>,
  fallbackMatches: Array<ProxyNumber>
};

var db = new loki('maskedcomms.db', {
  autosave: true,
  autoload: true
});

function initDBCollection(): any {
  let proxyNumbers = db.getCollection('proxy_numbers');
  if ( proxyNumbers === null) {
    proxyNumbers = db.addCollection('proxy_numbers', {
      indices: ['countryCode', 'areaCode', 'number'],
      unique: ['number']
    });
  }

  return proxyNumbers;
}

function findProxyNumbers(proxyNumbers, number: ProxyNumber, exceptions: []) : ProxyNumberLookupResult {

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

  // 2nd by country code and other area codes
  var countryCodeResulset = allAvailableNumbers.branch();
  var countryCodeMatches: Array<ProxyNumber> = countryCodeResulset.find({
    '$and' : [{
      'countryCode': number.countryCode
    },{
      'areaCode': {'$ne': number.areaCode}
    }]
  }).data();

  // Finally, all other numbers from other countries
  var fallbackResulset = allAvailableNumbers.branch();
  var fallbackMatches: Array<ProxyNumber> = fallbackResulset.find({
    'countryCode': {'$ne': number.countryCode}
  }).data();

  return { areaCodeMatches, countryCodeMatches, fallbackMatches};
}

function logNumberStuff(number: any) : void {

  // Print the phone's national number.
  console.log(number.getNationalNumber());
  // Print the phone's extension.
  console.log(number.getExtension());
  // Print the phone's extension when compared to i18n.phonenumbers.CountryCodeSource.
  console.log(number.getCountryCodeSource());
  // Print the phone's italian leading zero.
  console.log(number.getItalianLeadingZero());
  // Print the phone's raw input.
  console.log(number.getRawInput());
  // Result from isPossibleNumber().
  console.log(phoneUtil.isPossibleNumber(number));
  // Result from isValidNumber().
  console.log(phoneUtil.isValidNumber(number));
  // Result from isValidNumberForRegion().
  console.log(phoneUtil.isValidNumberForRegion(number, 'US'));
  // Result from getRegionCodeForNumber().
  console.log(phoneUtil.getRegionCodeForNumber(number));
  // Result from getNumberType() when compared to i18n.phonenumbers.PhoneNumberType.
  console.log(phoneUtil.getNumberType(number));
  // Format number in the out-of-country format from US.
  console.log(phoneUtil.formatOutOfCountryCallingNumber(number, 'US'));
  // Format number in the out-of-country format from CH.
  console.log(phoneUtil.formatOutOfCountryCallingNumber(number, 'CH'));
}

function toProxyNumber(aNumber: string) : ProxyNumber {
  const number = phoneUtil.parse(aNumber, 'US');
  logNumberStuff(number);

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

  const proxyNumber: ProxyNumber = {
    areaCode: areaCode,
    subscriberNumber:subscriberNumber,
    countryCode: number.getCountryCode(),
    number: aNumber
   };

   return proxyNumber;
}


  module.exports.testNumberChooser = function() {
    const proxyNumbers = initDBCollection();

    proxyNumbers.insert(toProxyNumber('+19252148777'));
    proxyNumbers.insert(toProxyNumber('+19256398375'));
    proxyNumbers.insert(toProxyNumber('+15103067446'));
    proxyNumbers.insert(toProxyNumber('+61393065343'));
    proxyNumbers.insert(toProxyNumber('+971528976883'));

    const testNumnber = toProxyNumber('+19255551234');

    let results = findProxyNumbers(proxyNumbers, testNumnber, []);
    console.log(results);
  }

  module.exports.testNumberChooser();