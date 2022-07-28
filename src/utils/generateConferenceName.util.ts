export const generateConferenceName = (phoneNumber: string) : string => {
  return encodeURIComponent(`${phoneNumber}_at_${Date.now()}`)
}