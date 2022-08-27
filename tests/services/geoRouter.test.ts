import { geoRouter, getNearbyAreaCodeNumbers, isCanadianNumber } from '../../src/services/geoRouter.service'

jest.mock('../../src/data/phoneNumberMap.json', () => ({
  44: [
    '+447911121111'
  ],
  ca: {
    236: [
      '+12365550001'
    ],
    587: [
      '+15872222222'
    ],
    639: [
      '+16395550001',
      '+16395550002'
    ]
  },
  us: {
    212: [
      '+12121111111'
    ],
    312: [
      '+13122222222'
    ],
    408: [
      '+14083333333',
      '+14084444444'
    ]
  }
}))

describe('phone matcher service', () => {
  describe('area code match service', () => {
    it('only includes US numbers first if a US area code is given', () => {
      const result = getNearbyAreaCodeNumbers('+12121112222')

      // eslint-disable-next-line quotes
      expect(result).toEqual(["+12121111111", "+13122222222", "+14083333333", "+14084444444"])
    })

    it('only includes canadian numbers if a CA area code is given', () => {
      const result = getNearbyAreaCodeNumbers('+12361112222')

      // eslint-disable-next-line quotes
      expect(result).toEqual(["+12365550001", "+15872222222", "+16395550001", "+16395550002"])
    })
  })

  describe('isCanadianNumber', () => {
    it('returns true if number is canadian', () => {
      const result = isCanadianNumber('+12365550001')
      expect(result).toBe(true)
    })

    it('returns false if number is US', () => {
      const result = isCanadianNumber('+14155550001')
      expect(result).toBe(false)
    })
  })

  describe('geoRouter', () => {
    it('returns country-code matches for non-US/CA numbers', () => {
      const result = geoRouter('+447922233333')
      expect(result).toEqual(['+447911121111'])
    })
  })
})
