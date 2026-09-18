/**
 * 前端图片压缩（零依赖，原生 Canvas）
 * 用于报修提交、维修完工等场景，避免手机原图（3~8MB/张）直接上传。
 *
 * 策略：
 * - 仅压缩 jpeg/png/webp，gif 等其它格式原样返回
 * - 小于 minSizeToCompress（默认500KB）不压缩
 * - 最长边超过 maxWidth/maxHeight（默认1280）等比缩小
 * - 输出 image/jpeg，质量从 0.8 递减，尽量压到 targetSize（默认800KB）以内
 * - 解码/压缩任一步骤失败，兜底返回原文件，不阻断上传
 */

const DEFAULT_OPTIONS = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.8,
  minQuality: 0.5,
  targetSize: 800 * 1024,
  minSizeToCompress: 500 * 1024,
  mimeType: 'image/jpeg'
}

const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function isCompressible (file) {
  return !!file && COMPRESSIBLE_TYPES.includes(file.type)
}

// 解码图片：优先 createImageBitmap（支持 imageOrientation 自动纠正 EXIF 方向），不支持则回退 <img>
async function decodeImage (file) {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      // 部分旧浏览器不识别 imageOrientation 参数会抛错，此时走 <img> 回退
      return await window.createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch (_) {
      return decodeWithImage(file)
    }
  }
  return decodeWithImage(file)
}

function decodeWithImage (file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片解码失败'))
    }
    img.src = url
  })
}

function getSize (img) {
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height
  }
}

function canvasToBlob (canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      type,
      quality
    )
  })
}

/**
 * 压缩图片
 * @param {File} file el-upload 选择的原生 File
 * @param {Object} [options] 覆盖默认参数
 * @returns {Promise<File>} 压缩后的 File（无需压缩或失败时返回原 File）
 */
export async function compressImage (file, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (!isCompressible(file)) return file
  if (file.size <= opts.minSizeToCompress) return file

  let source = null
  try {
    source = await decodeImage(file)
    const origin = getSize(source)
    if (!origin.width || !origin.height) return file

    const ratio = Math.min(opts.maxWidth / origin.width, opts.maxHeight / origin.height, 1)
    const width = Math.max(1, Math.round(origin.width * ratio))
    const height = Math.max(1, Math.round(origin.height * ratio))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    // JPEG 无透明通道，先铺白底，避免 PNG 透明区域变黑
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(source, 0, 0, width, height)

    // 质量递减，直到小于目标大小或达到最低质量
    const qualities = [0.8, 0.7, 0.6, opts.minQuality]
    let blob = null
    for (const q of qualities) {
      // eslint-disable-next-line no-await-in-loop
      blob = await canvasToBlob(canvas, opts.mimeType, q)
      if (!blob) return file
      if (blob.size <= opts.targetSize || q <= opts.minQuality) break
    }

    // 压缩后反而更大（小图/已高度压缩）时保留原图
    if (blob.size >= file.size) return file

    const baseName = (file.name || 'image').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, {
      type: opts.mimeType,
      lastModified: Date.now()
    })
  } catch (e) {
    return file
  } finally {
    // ImageBitmap 需手动释放
    if (source && typeof source.close === 'function') {
      try { source.close() } catch (_) {}
    }
  }
}
