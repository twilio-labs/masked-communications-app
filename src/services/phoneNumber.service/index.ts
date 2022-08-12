/* eslint-disable space-before-function-paren */
import areaCodeProximityMap from './area-code-proximity.json'
import phoneNumberMap from './phone-number-map.json'

export function getPhoneNumber(
  areaCode: number | string,
  country: keyof typeof phoneNumberMap,
  { from = 0, pageSize = 50 }: { from?: number; pageSize?: number } = {
    from: 0,
    pageSize: 50
  }
) {
  const optimalPhoneNumbers = []

  let curAreaCode = areaCodeProximityMap[country][areaCode].shift()
  while (optimalPhoneNumbers.length < from + pageSize && !!curAreaCode) {
    if (!phoneNumberMap[country][curAreaCode]?.length) {
      curAreaCode = areaCodeProximityMap[country][areaCode].shift()
      continue
    }

    optimalPhoneNumbers.push(phoneNumberMap[country][curAreaCode].shift())
  }

  return optimalPhoneNumbers.slice(from)
}
