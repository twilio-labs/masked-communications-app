/* eslint-disable space-before-function-paren */
import areaCodeProximityMap from '../../data/area-code-proximity-map.json'
import phoneNumberMap from '../../data/phone-number-map.json'

export function getPhoneNumber(
  areaCode: number | string,
  country: keyof typeof phoneNumberMap,
  { from = 0, pageSize = 50 }: { from?: number; pageSize?: number } = {
    from: 0,
    pageSize: 50
  }
) {
  const areaCodesByProximity: number[] | string[] =
    areaCodeProximityMap[country][areaCode]
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
