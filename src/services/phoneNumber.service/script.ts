/* eslint-disable space-before-function-paren */
import * as fsp from 'fs/promises'
import { getDistance } from 'geolib'
import path from 'path'
import areaCodeGeos from './area-code-geos.json'
import type { PhoneNumberMap } from '../../@types/types'

/****************************************************
 Computes the area-code-proxmity map which is used to
 determine the closest area codes to another area code.

 It is not executed by the project at anytime. It's included to show
 how the proximity was calculated and allow you to modify it, if necessary.
****************************************************/

interface AreaCodeItem {
  areaCode: number
  latitude: number
  longitude: number
}

async function prepareAreaCodeProximities() {
  await fsp.writeFile(
    path.resolve(__dirname, 'area-code-proximity.json'),
    JSON.stringify({
      ca: computeAreaCodeProximities(areaCodeGeos.ca),
      us: computeAreaCodeProximities(areaCodeGeos.us)
    })
  )
}

function computeAreaCodeProximities(areaCodeList: AreaCodeItem[]) {
  return areaCodeList
    .map((curAreaCodeItem) => ({
      [curAreaCodeItem.areaCode]: areaCodeList
        .map((areaCodeItem) => [
          areaCodeItem.areaCode,
          getDistance(curAreaCodeItem, areaCodeItem)
        ])
        .sort(([, aDistance], [, bDistance]) => aDistance - bDistance)
        .map(([areaCode]) => areaCode)
    }))
    .reduce((acc, cur) => Object.assign(acc, cur), {})
}

/****************************************************
 Formats a text list of phone numbers into the PhoneNumberPool
 interface structure.
****************************************************/

async function preparePhoneNumberPool() {
  const caAreaCodes = areaCodeGeos.ca.map(({ areaCode }) => areaCode)
  const usAreaCodes = areaCodeGeos.us.map(({ areaCode }) => areaCode)

  const phoneNumberList = (
    await fsp.readFile(path.join(__dirname, 'phone-numbers.txt'), 'utf8')
  ).split('\n')

  const phoneNumberPoolMap: PhoneNumberMap = {
    ca: {},
    us: {},
    _length: phoneNumberList.length
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
    path.resolve(__dirname, 'phone-number-map.json'),
    JSON.stringify(phoneNumberPoolMap)
  )
}

/****************************************************
 Execute Scripts
****************************************************/

async function main() {
  await prepareAreaCodeProximities()
  await preparePhoneNumberPool()
}

main()
