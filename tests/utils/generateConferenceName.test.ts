import { generateConferenceName } from "../../src/utils"

describe('generateConferenceName', () => {
  it('provides a url-encoded unique string with a phone number and timestamp', () => {
    Date.now = jest.fn(() => 1234567890)

    const result = generateConferenceName('+1234567890');
    expect(result).toBe('%2B1234567890_at_1234567890')
  })
})