/* eslint-disable space-before-function-paren */
import * as fsp from 'fs/promises'
import { getDistance } from 'geolib'
import path from 'path'
import areaCodeGeos from './areaCodeGeos'

/****************************************************
 Computes src/data/area-code-proxmity-map.json which is used to determine the
 closest area codes to another area code.

 It is not executed by the project at anytime. This script is included to show
 how the proximity was calculated and allow you to modify it, if necessary.
****************************************************/

interface AreaCodeItem {
  areaCode: number
  latitude: number
  longitude: number
}

async function prepareAreaCodeProximityMap() {
  await fsp.writeFile(
    path.resolve(__dirname, '../src/data/areaCodeProximityMap.json'),
    JSON.stringify({
      ca: computeAreaCodeProximities(areaCodeGeos.ca),
      us: computeAreaCodeProximities(areaCodeGeos.us)
    })
  )
}

function computeAreaCodeProximities(areaCodeList: AreaCodeItem[]) {
  return areaCodeList
    .map((curAreaCodeItem) => ({
      [curAreaCodeItem.areaCode]: [curAreaCodeItem.areaCode].concat(
        areaCodeList
          .filter(
            (areaCodeItem) => areaCodeItem.areaCode !== curAreaCodeItem.areaCode
          )
          .map((areaCodeItem) => [
            areaCodeItem.areaCode,
            getDistance(curAreaCodeItem, areaCodeItem)
          ])
          .sort(([, aDistance], [, bDistance]) => aDistance - bDistance)
          .map(([areaCode]) => areaCode)
      )
    }))
    .reduce((acc, cur) => Object.assign(acc, cur), {})
}

prepareAreaCodeProximityMap()
