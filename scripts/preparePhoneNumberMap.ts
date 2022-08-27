import * as fsp from 'fs/promises'
import path from 'path'
import areaCodeGeos from './areaCodeGeos'

/****************************************************
 Formats a text list of phone numbers (in src/data/phone-numbers.txt) into the PhoneNumberMap
 structure.
****************************************************/

async function preparePhoneNumberMap () {
  const caAreaCodes = areaCodeGeos.ca.map(({ areaCode }) => areaCode)
  const usAreaCodes = areaCodeGeos.us.map(({ areaCode }) => areaCode)

  const phoneNumberList = (
    await fsp.readFile(
      path.join(__dirname, '../src/data/phoneNumbers.txt'),
      'utf8'
    )
  ).split('\n')

  const phoneNumberPoolMap = {
    ca: {},
    us: {}
  }

  for (const phoneNumber of phoneNumberList) {
    const { countryCode, areaCode } =
      phoneNumber.match(
        /^\s*(?:\+?(?<countryCode>\d{1,3}))?[-. (]*(?<areaCode>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
      ).groups

    if (!areaCode) throw Error(`${phoneNumber} is not valid E.164 format`)

    // Check if area code is Canadian
    if (caAreaCodes.includes(parseInt(areaCode))) {
      // If the area code has an entry in our number pool output...
      if (phoneNumberPoolMap.ca[areaCode]) {
        // Push the number into the existing array
        phoneNumberPoolMap.ca[areaCode].push(phoneNumber)
        // Otherwise create a new entry and array
      } else phoneNumberPoolMap.ca[areaCode] = [phoneNumber]
    } else if (usAreaCodes.includes(parseInt(areaCode))) {
      if (phoneNumberPoolMap.us[areaCode]) {
        phoneNumberPoolMap.us[areaCode].push(phoneNumber)
      } else phoneNumberPoolMap.us[areaCode] = [phoneNumber]
    } else {
      if (phoneNumberPoolMap[countryCode]) {
        phoneNumberPoolMap[countryCode].push(phoneNumber)
      } else phoneNumberPoolMap[countryCode] = [phoneNumber]
    }
  }

  await fsp.writeFile(
    path.resolve(__dirname, '../src/data/phoneNumberMap.json'),
    JSON.stringify(phoneNumberPoolMap)
  )
}

preparePhoneNumberMap()
