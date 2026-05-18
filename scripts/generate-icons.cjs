#!/usr/bin/env node
/**
 * Generates all StewardHub PWA icon PNGs from SVG source using resvg-js.
 * Run: node scripts/generate-icons.js
 */
const { Resvg } = require('@resvg/resvg-js')
const fs = require('fs')
const path = require('path')

const PUBLIC = path.join(__dirname, '../public')

// ── Icon SVG builder ──────────────────────────────────────────────────────────
// Draws a 4-pointed star (✦) using precise SVG paths — no text, no fonts,
// renders identically on every platform and at every size.

function starPath(cx, cy, outerR, innerR) {
  const pts = []
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI / 4) - Math.PI / 2   // start from top
    const r     = i % 2 === 0 ? outerR : innerR
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return `M ${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ')} Z`
}

/**
 * Regular icon — rounded corners, gradient background, white star.
 * The rounded rect ensures it looks sharp on iOS (which clips to a squircle).
 */
function regularSVG(size) {
  const s      = size
  const cx     = s / 2
  const cy     = s / 2
  const rx     = Math.round(s * 0.2)          // corner radius ≈20% of size
  const outerR = s * 0.305                    // star outer radius
  const innerR = s * 0.105                    // star inner radius (concave depth)
  const star   = starPath(cx, cy, outerR, innerR)
  const gid    = `g${size}`

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#22C28E"/>
      <stop offset="100%" stop-color="#0A6147"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${rx}" ry="${rx}" fill="url(#${gid})"/>
  <path d="${star}" fill="white" opacity="0.95"/>
</svg>`
}

/**
 * Maskable icon — full-bleed (no rounded corners), star inside safe zone (80%).
 * Android adaptive icons crop to various shapes (circle, squircle, etc).
 * The safe zone is the central 80%, so we shrink the star and add a solid bg.
 */
function maskableSVG(size) {
  const s      = size
  const cx     = s / 2
  const cy     = s / 2
  // Shrink star to 80% safe zone — outer radius is 80%*31% = 24.8% of size
  const outerR = s * 0.245
  const innerR = s * 0.085
  const star   = starPath(cx, cy, outerR, innerR)
  const gid    = `gm${size}`

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#22C28E"/>
      <stop offset="100%" stop-color="#0A6147"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="url(#${gid})"/>
  <path d="${star}" fill="white" opacity="0.95"/>
</svg>`
}

/**
 * Favicon SVG — same design, returned as SVG text for public/favicon.svg.
 */
function faviconSVG() {
  return regularSVG(512)   // SVG is resolution-independent
}

// ── Render helper ─────────────────────────────────────────────────────────────

function renderPNG(svgString, outputPath) {
  const resvg = new Resvg(svgString, { background: 'transparent' })
  const pngData = resvg.render().asPng()
  fs.writeFileSync(outputPath, pngData)
  const kb = (pngData.length / 1024).toFixed(1)
  console.log(`  ✓  ${path.basename(outputPath)}  (${kb} KB)`)
}

// ── Generate all icons ────────────────────────────────────────────────────────

console.log('\nGenerating StewardHub PWA icons…\n')

// Regular icons (rounded corners, for manifest "any" purpose + apple-touch)
renderPNG(regularSVG(192),  path.join(PUBLIC, 'icon-192.png'))
renderPNG(regularSVG(512),  path.join(PUBLIC, 'icon-512.png'))
renderPNG(regularSVG(192),  path.join(PUBLIC, 'apple-touch-icon.png'))   // 192→used for iOS

// 180×180 dedicated apple-touch-icon (canonical iOS size)
renderPNG(regularSVG(180),  path.join(PUBLIC, 'apple-touch-icon-180.png'))

// Maskable icons (full-bleed, for Android adaptive icon)
renderPNG(maskableSVG(192), path.join(PUBLIC, 'icon-maskable-192.png'))
renderPNG(maskableSVG(512), path.join(PUBLIC, 'icon-maskable-512.png'))

// SVG source files (resolution-independent, for manifest + browser tab)
fs.writeFileSync(path.join(PUBLIC, 'icon.svg'),    regularSVG(512))
fs.writeFileSync(path.join(PUBLIC, 'favicon.svg'), faviconSVG())
console.log('  ✓  icon.svg')
console.log('  ✓  favicon.svg')

console.log('\nDone. All icons written to public/\n')
