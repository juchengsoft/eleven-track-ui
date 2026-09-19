/**
 * 下载后端返回的文件流（Blob），文件名自动附加时间戳
 */
export function downloadBlob (blob, baseName, ext = 'xlsx') {
  const pad = (n) => String(n).padStart(2, '0')
  const d = new Date()
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${baseName}_${ts}.${ext}`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
