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

export function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const tail = parts.pop();
    if (typeof tail === 'string') {
      const result = tail.split(';').shift() ?? null;
      return result;
    }
  }
  return null;
}