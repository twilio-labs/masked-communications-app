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
 * @param options.from - starting point to return
 * @param options.pageSize - how many phone numbers
 * @returns array of phone numbers ordered by their proximity to the area code argument
 */

export function getNearbyAreaCodeNumbers (
  phoneNumber: string,
  from?: number,
  pageSize?: number
) {
  // array of area codes ordered by their proximity to the areaCode argument
  const country = isCanadianNumber(phoneNumber) ? 'ca' : 'us'
  const { area } = phoneNumberParser(phoneNumber)

  const areaCodesByProximity: number[] | string[] =
    areaCodeProximityMap[country][area]

  const countryPhoneMap = phoneNumberMap[country]

  const optimalPhoneNumbers = []
  let curAreaCode = areaCodesByProximity.shift()
  while (optimalPhoneNumbers.length < from + pageSize && !!curAreaCode) {
    if (!countryPhoneMap[curAreaCode]?.length) {
      curAreaCode = areaCodesByProximity.shift()
      continue
    }

    optimalPhoneNumbers.push(countryPhoneMap[curAreaCode].shift())
  }

  return optimalPhoneNumbers.slice(from)
}

export function isCanadianNumber (phoneNumber: string) : boolean {
  const { area } = phoneNumberParser(phoneNumber)
  const canadianAreaCodes = areaCodeGeos.ca

  const matchingCode = canadianAreaCodes.filter((ac) => {
    return String(area) === String(ac.areaCode)
  })

  if (matchingCode.length > 0) {
    return true
  }

  return false
}

export function getNumberByCountry (
  countryCode: string,
  from?: number,
  pageSize?: number
) : string[] {
  return phoneNumberMap[countryCode].slice(from, from + pageSize)
}

export function geoRouter (
  phoneNumber: string,
  from: number = 0,
  pageSize: number = 50
) : string[] {
  const parsedNumber = phoneNumberParser(phoneNumber)

  if (parsedNumber.country === '1') {
    return getNearbyAreaCodeNumbers(phoneNumber, from, pageSize)
  }

  return getNumberByCountry(parsedNumber.country, from, pageSize)
}
