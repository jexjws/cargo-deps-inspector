export function bytesToHumanSize(bytes: number, digits = 2) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (!Number.isFinite(bytes) || bytes <= 0)
    return ['0', 'Bytes']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  if (i === 0)
    return [bytes.toLocaleString(), 'Bytes']
  return [(+(bytes / 1024 ** i).toFixed(digits)).toLocaleString(), sizes[i]]
}
