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

  // Read from root phoneNumbers.txt
  const phoneNumberPath = path.join(__dirname, '../phoneNumbers.txt')

  try {
    await fsp.access(phoneNumberPath)
  } catch {
    throw new Error('phoneNumbers.txt not found! Copy phoneNumbers.txt.example to phoneNumbers.txt and add your phone numbers.')
  }

  const phoneNumberList = (
    await fsp.readFile(phoneNumberPath, 'utf8')
  ).split('\n')

  const phoneNumberPoolMap: any = {
    ca: {},
    us: {}
  }

  for (const phoneNumber of phoneNumberList) {
    const match = phoneNumber.match(
      /^\s*(?:\+?(?<countryCode>\d{1,3}))?[-. (]*(?<areaCode>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
    )

    if (!match?.groups) continue

    const { countryCode, areaCode } = match.groups

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

  const outputFile = path.resolve(__dirname, '../src/data/phoneNumberMap.json')

  await fsp.writeFile(
    outputFile,
    JSON.stringify(phoneNumberPoolMap)
  )

  console.log(`✅ Generated phoneNumberMap.json from phoneNumbers.txt`)
}

preparePhoneNumberMap()
