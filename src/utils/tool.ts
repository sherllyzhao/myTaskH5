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

// 时间戳转时间字符串
export function formatTimestamp(timestamp: number | string, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!timestamp) return '-';

  const ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  if (isNaN(ts)) return '-';

  // 如果是秒级时间戳，转换为毫秒
  const date = new Date(ts < 10000000000 ? ts * 1000 : ts);
  if (isNaN(date.getTime())) return '-';

  const pad = (n: number) => n.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}
