import phoneNumberMap from '../data/phoneNumberMap.json'
import areaCodeProximityMap from '../data/areaCodeProximityMap.json'
import phoneNumberParser from '../utils/phoneNumberParser'
import areaCodeGeos from '../../scripts/areaCodeGeos'

/**
 * @function getNearbyAreaCodeNumbers
 *
 * @description getNearbyAreaCodeNumbers returns an array of phone numbers ordered by their proximity
 * to the area code argument. The results are paged which allows you to call iterate through
 * your phone number pool efficiently.
 * @param phoneNumber - the phone number containing area code you want to match
 * @param from - starting point to return
 * @param pageSize - how many phone numbers
 * @returns array of phone numbers ordered by their proximity to the area code argument
 */

export function getNearbyAreaCodeNumbers (
  phoneNumber: string,
  from: number = 0,
  pageSize: number = 50
) {
  // array of area codes ordered by their proximity to the areaCode argument
  const country = isCanadianNumber(phoneNumber) ? 'ca' : 'us'
  const { area } = phoneNumberParser(phoneNumber)

  // TODO: refactor this. It's currently being used to un-link
  // array references in the number map and proximit map.
  // If we don't unlink, values between function runs get
  // mixed up / shifted out of the array and we don't get any results back.
  const numberMap = JSON.parse(JSON.stringify(phoneNumberMap))
  const proximityMap = JSON.parse(JSON.stringify(areaCodeProximityMap))

  const areaCodesByProximity: number[] | string[] =
    proximityMap[country][area]

  const countryPhoneMap = numberMap[country]

  const optimalPhoneNumbers = []
  let curAreaCode = areaCodesByProximity.shift()
  while (optimalPhoneNumbers.length < from + pageSize && !!curAreaCode) {
    if (!countryPhoneMap[curAreaCode]?.length) {
      curAreaCode = areaCodesByProximity.shift()
      continue
    }

    optimalPhoneNumbers.push(countryPhoneMap[curAreaCode].shift())
  }

  return optimalPhoneNumbers.slice(from, from + pageSize)
}

export function isCanadianNumber (phoneNumber: string): boolean {
  const { area } = phoneNumberParser(phoneNumber)
  const canadianAreaCodes = areaCodeGeos.ca

  const matchingCode = canadianAreaCodes.filter((ac) => {
    return String(area) === String(ac.areaCode)
  })

  return matchingCode.length > 0
}

export function getNumberByCountry (
  countryCode: keyof typeof phoneNumberMap,
  from: number = 0,
  pageSize: number = 50
): string[] {
  return Object.values(phoneNumberMap[countryCode]).flat(1).slice(from, from + pageSize)
}

export function geoRouter (
  phoneNumber: string,
  from: number = 0,
  pageSize: number = 50
): string[] {
  const parsedNumber = phoneNumberParser(phoneNumber)

  if (parsedNumber.country === '1') {
    return getNearbyAreaCodeNumbers(phoneNumber, from, pageSize)
  }

  return getNumberByCountry(parsedNumber.country, from, pageSize)
}
