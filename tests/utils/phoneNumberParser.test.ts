import phoneNumberParser from '../../src/utils/phoneNumberParser'

describe('phoneNumberParser util', () => {
  it('splits US phone number into components', () => {
    const result = phoneNumberParser('+14156501111')

    expect(result.country).toBe('1')
    expect(result.area).toBe('415')
    expect(result.prefix).toBe('650')
    expect(result.line).toBe('1111')
  })

  it('successfully parses an international number', () => {
    const result = phoneNumberParser('+447911121111')

    expect(result.country).toBe('44')
    expect(result.area).toBe('791')
    expect(result.prefix).toBe('112')
    expect(result.line).toBe('1111')
  })
})
