export default function phoneNumberParser (phoneNumber) {
  const result = phoneNumber.match(
    /^\s*(?:\+?(?<country>\d{1,3}))?[-. (]*(?<area>\d{3})[-. )]*(?<prefix>\d{3})[-. ]*(?<line>\d{4})(?: *x(\d+))?\s*$/
  ).groups

  return result
}
