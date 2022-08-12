/* eslint-disable space-before-function-paren */

/****************************************************
 This script computes the area-code-proxmity map which is used to
 determine the closest area codes to another area code.

 It is not executed by the project at anytime. It's included to show
 how the proximity was calculated and allow you to modify it, if necessary.
****************************************************/

import * as fs from 'fs'
import { getDistance } from 'geolib'
import path from 'path'
import areaCodeGeos from './area-code-geos.json'

interface AreaCodeItem {
  areaCode: number
  latitude: number
  longitude: number
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

fs.writeFileSync(
  path.resolve(__dirname, 'area-code-proximity.json'),
  JSON.stringify({
    ca: computeAreaCodeProximities(areaCodeGeos.ca),
    us: computeAreaCodeProximities(areaCodeGeos.us)
  })
)
