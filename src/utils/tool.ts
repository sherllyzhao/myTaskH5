export function removeTime (time: string): string {
  if (time) {
    try {
      const date = time.split(' ')
      return date[0]
    } catch {
      return time
    }
  } else {
    return ''
  }
}
