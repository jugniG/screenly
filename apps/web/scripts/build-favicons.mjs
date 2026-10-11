// One-shot generator for web favicon assets from the Android app icon.
// Run with: node scripts/build-favicons.mjs
// pngjs is a transitive dependency, so nothing new is added to the repo.
import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const root = path.resolve(import.meta.dirname, '..')
const SRC = path.resolve(root, '../android_app/assets/images/icon.png')
const OUT = path.resolve(root, 'public')

const src = PNG.sync.read(fs.readFileSync(SRC))
const { width: sw, height: sh, data: sd } = src

/**
 * Area-average (box filter) downscale. Averaging every source pixel that maps
 * into a destination pixel is the correct resample for shrinking, and avoids
 * the aliasing a naive sample would produce on the icon's orange gradient.
 */
function resize(size) {
  const out = new PNG({ width: size, height: size })
  for (let ty = 0; ty < size; ty++) {
    const y0 = Math.floor((ty * sh) / size)
    const y1 = Math.max(y0 + 1, Math.ceil(((ty + 1) * sh) / size))
    for (let tx = 0; tx < size; tx++) {
      const x0 = Math.floor((tx * sw) / size)
      const x1 = Math.max(x0 + 1, Math.ceil(((tx + 1) * sw) / size))
      let r = 0, g = 0, b = 0, a = 0, n = 0
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * sw + x) * 4
          const alpha = sd[i + 3] / 255
          // Weight colour by alpha so transparent corners do not bleed the
          // background's RGB into the edge pixels and leave a dark halo.
          r += sd[i] * alpha
          g += sd[i + 1] * alpha
          b += sd[i + 2] * alpha
          a += alpha
          n++
        }
      }
      const o = (ty * size + tx) * 4
      if (a > 0) {
        out.data[o] = Math.round(r / a)
        out.data[o + 1] = Math.round(g / a)
        out.data[o + 2] = Math.round(b / a)
      }
      out.data[o + 3] = Math.round((a / n) * 255)
    }
  }
  return out
}

/** Wraps PNG buffers in an ICO container. PNG-in-ICO is valid from Vista on. */
function buildIco(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(pngs.length, 4)

  const entries = []
  let offset = 6 + pngs.length * 16
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0) // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt8(0, 2) // palette size
    e.writeUInt8(0, 3) // reserved
    e.writeUInt16LE(1, 4) // colour planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(buf.length, 8)
    e.writeUInt32LE(offset, 12)
    entries.push(e)
    offset += buf.length
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)])
}

const sizes = [16, 32, 48, 180, 192, 256, 512]
const rendered = sizes.map((size) => ({ size, buf: PNG.sync.write(resize(size)) }))

fs.writeFileSync(path.join(OUT, 'favicon.ico'), buildIco(rendered.filter((r) => r.size <= 48)))
for (const name of [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  // The canonical mark. Every in-app logo lockup renders this one asset, so the
  // web never drifts from what ships on the user's home screen.
  ['logo-256.png', 256],
  ['icon-512.png', 512],
]) {
  fs.writeFileSync(path.join(OUT, name[0]), rendered.find((r) => r.size === name[1]).buf)
}

console.log(`source: ${sw}x${sh}, ${(fs.statSync(SRC).size / 1024).toFixed(0)}KB`)
for (const name of fs.readdirSync(OUT).filter((f) => /favicon|touch-icon|icon-\d/.test(f))) {
  console.log(`  ${name.padEnd(24)} ${(fs.statSync(path.join(OUT, name)).size / 1024).toFixed(1)}KB`)
}