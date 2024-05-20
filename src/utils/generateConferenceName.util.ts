export const generateConferenceName = (phoneNumber: string) : string => {
  return `${phoneNumber}_at_${Date.now()}`
}
