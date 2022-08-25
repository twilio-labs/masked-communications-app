/* eslint-disable space-before-function-paren */
import * as fsp from 'fs/promises'
import path from 'path'
import areaCodeGeos from './area-code-geos.json'
import type { PhoneNumberMap } from '../src/@types/types'

/****************************************************
 Formats a text list of phone numbers (in src/data/phone-numbers.txt) into the PhoneNumberMap
 structure.
****************************************************/

async function makePhoneNumberMap() {
  const caAreaCodes = areaCodeGeos.ca.map(({ areaCode }) => areaCode)
  const usAreaCodes = areaCodeGeos.us.map(({ areaCode }) => areaCode)

  const phoneNumberList = (
    await fsp.readFile(
      path.join(__dirname, '../src/data/phone-numbers.txt'),
      'utf8'
    )
  ).split('\n')

  const phoneNumberPoolMap: PhoneNumberMap = {
    ca: {},
    us: {}
  }

  for (const phoneNumber of phoneNumberList) {
    const areaCode = parseInt(
      phoneNumber.match(
        /^\s*(?:\+?(?<country>\d{1,3}))?[-. (]*(?<area>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
      ).groups?.area
    )

    if (!areaCode) throw Error(`${phoneNumber} is not valid E.164 format`)

    if (caAreaCodes.includes(areaCode)) {
      if (phoneNumberPoolMap.ca[areaCode]) {
        phoneNumberPoolMap.ca[areaCode].push(phoneNumber)
      } else phoneNumberPoolMap.ca[areaCode] = [phoneNumber]
    } else if (usAreaCodes.includes(areaCode)) {
      if (phoneNumberPoolMap.us[areaCode]) {
        phoneNumberPoolMap.us[areaCode].push(phoneNumber)
      } else phoneNumberPoolMap.us[areaCode] = [phoneNumber]
    } else throw Error(`Area code ${areaCode} is not a CA or US area code.`)
  }

  await fsp.writeFile(
    path.resolve(__dirname, '../src/data/phone-number-map.json'),
    JSON.stringify(phoneNumberPoolMap)
  )
}

makePhoneNumberMap()
