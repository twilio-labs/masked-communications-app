import { AreaCodeMatchPagingParams } from '../@types/types'
import areaCodeProximityMap from '../data/area-code-proximity-map.json'
import phoneNumberMap from '../data/phone-number-map.json'

/**
 * @function getNearbyAreaCodeNumbers
 *
 * @description getNearbyAreaCodeNumbers returns an array of phone numbers ordered by their proximity
 * to the area code argument. The results are paged which allows you to call iterate through
 * your phone number pool efficiently.
 * @param areaCode - the area code you want to match
 * @param country - us or ca
 * @param options.from - starting point to return
 * @param options.pageSize - how many phone numbers
 * @returns array of phone numbers ordered by their proximity to the area code argument
 */

export function getNearbyAreaCodeNumbers (
  areaCode: number | string,
  country: keyof typeof phoneNumberMap,
  pagingParams: AreaCodeMatchPagingParams = {
    from: 0,
    pageSize: 50
  }
) {
  // array of area codes ordered by their proximity to the areaCode argument
  const areaCodesByProximity: number[] | string[] =
    areaCodeProximityMap[country][areaCode]
  // object with area code as key & phone number array as value
  const countryPhoneMap = phoneNumberMap[country]

  const optimalPhoneNumbers = []
  let curAreaCode = areaCodesByProximity.shift()
  while (optimalPhoneNumbers.length < pagingParams.from + pagingParams.pageSize && !!curAreaCode) {
    if (!countryPhoneMap[curAreaCode]?.length) {
      curAreaCode = areaCodesByProximity.shift()
      continue
    }

    optimalPhoneNumbers.push(countryPhoneMap[curAreaCode].shift())
  }

  return optimalPhoneNumbers.slice(pagingParams.from)
}
