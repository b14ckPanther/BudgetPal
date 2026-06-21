/**
 * BudgetPal — Premium Fintech Icon Generator
 * Generates all production app icon assets programmatically.
 * 
 * Concept: "Intelligent Finance Pulse & Beacon"
 * Contains:
 * 1. Deep Midnight Navy background (#080B12) with a warm radial ambient glow.
 * 2. An outer structured squircle frame representing budget control and container.
 * 3. A central glowing "Smart Core" representing the AI Agent/Beacon.
 * 4. A smooth, flowing gradient path/orbit and signal pulse passing through the core
 *    representing the guidance and financial flow.
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const COLORS = {
  bg: '#080B12',
  mint: '#4ADEB2',
  blue: '#6C8CFF',
  white: '#FFFFFF',
};

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');

/**
 * Draws a squircle path.
 */
function drawSquircle(ctx, x, y, size, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + size - r, y);
  ctx.quadraticCurveTo(x + size, y, x + size, y + r);
  ctx.lineTo(x + size, y + size - r);
  ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
  ctx.lineTo(x + r, y + size);
  ctx.quadraticCurveTo(x, y + size, x, y + size - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draw the Premium BudgetPal Symbol.
 */
function drawSymbol(ctx, size, drawBg, markScale) {
  markScale = markScale || 0.55;
  const cx = size / 2;
  const cy = size / 2;

  // 1. Draw solid background
  if (drawBg) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, size, size);

    // 2. Ambient radial glow behind the symbol
    const ambientGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.45);
    ambientGlow.addColorStop(0, 'rgba(74, 222, 178, 0.18)'); // mint
    ambientGlow.addColorStop(0.5, 'rgba(108, 140, 255, 0.08)'); // AI blue
    ambientGlow.addColorStop(1, 'rgba(8, 11, 18, 0)');
    ctx.fillStyle = ambientGlow;
    ctx.fillRect(0, 0, size, size);
  }

  const markSize = size * markScale;
  const halfMark = markSize / 2;
  const strokeW = Math.max(3, size * 0.038); // Premium, distinct line weight
  const r = markSize * 0.28; // Beautiful rounded squircle corners

  const left = cx - halfMark;
  const top = cy - halfMark;

  // Reset shadow for container
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 3. Outer Squircle Frame (Budget/Structure Container)
  drawSquircle(ctx, left, top, markSize, r);
  const frameGrad = ctx.createLinearGradient(left, top, left + markSize, top + markSize);
  frameGrad.addColorStop(0, COLORS.mint);
  frameGrad.addColorStop(0.5, 'rgba(74, 222, 178, 0.3)');
  frameGrad.addColorStop(1, COLORS.blue);
  ctx.strokeStyle = frameGrad;
  ctx.lineWidth = strokeW;
  ctx.stroke();

  // 4. Subtle Inner Squircle Shadow/Glow (gives a glassmorphic/vault feel)
  if (drawBg) {
    ctx.save();
    drawSquircle(ctx, left + strokeW/2, top + strokeW/2, markSize - strokeW, r - strokeW/2);
    ctx.clip();
    const innerGlow = ctx.createRadialGradient(cx, cy, markSize * 0.3, cx, cy, markSize * 0.5);
    innerGlow.addColorStop(0, 'rgba(8, 11, 18, 0)');
    innerGlow.addColorStop(1, 'rgba(74, 222, 178, 0.12)');
    ctx.fillStyle = innerGlow;
    ctx.fill();
    ctx.restore();
  }

  // 5. Drawing the Orbit ring (Financial flow / Budget path)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-28 * Math.PI / 180); // Elegant tilt
  
  const orbitX = markSize * 0.38;
  const orbitY = markSize * 0.12;
  const orbitGrad = ctx.createLinearGradient(-orbitX, 0, orbitX, 0);
  orbitGrad.addColorStop(0, 'rgba(108, 140, 255, 0.8)'); // AI Blue
  orbitGrad.addColorStop(0.5, 'rgba(74, 222, 178, 0.9)'); // Mint
  orbitGrad.addColorStop(1, 'rgba(108, 140, 255, 0.2)'); // Fade out

  ctx.strokeStyle = orbitGrad;
  ctx.lineWidth = strokeW * 0.7;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.ellipse(0, 0, orbitX, orbitY, 0, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.restore();

  // 6. Drawing the Guidance Pulse (Neural Guidance / Signal Line)
  // An elegant horizontal S-like pulse that flows across the middle of the frame
  ctx.save();
  ctx.beginPath();
  const pulseL = left + strokeW;
  const pulseR = left + markSize - strokeW;
  ctx.moveTo(pulseL, cy);
  
  // Flat start
  ctx.lineTo(cx - markSize * 0.25, cy);
  // Control points for a smooth, high-quality curve
  ctx.bezierCurveTo(
    cx - markSize * 0.12, cy - markSize * 0.2, // first peak handle
    cx - markSize * 0.05, cy - markSize * 0.2,
    cx, cy - markSize * 0.12 // peak point near core
  );
  ctx.bezierCurveTo(
    cx + markSize * 0.05, cy + markSize * 0.08,
    cx + markSize * 0.12, cy + markSize * 0.08,
    cx + markSize * 0.25, cy
  );
  ctx.lineTo(pulseR, cy);

  const pulseGrad = ctx.createLinearGradient(pulseL, cy, pulseR, cy);
  pulseGrad.addColorStop(0, 'rgba(74, 222, 178, 0.3)');
  pulseGrad.addColorStop(0.4, COLORS.mint);
  pulseGrad.addColorStop(0.6, COLORS.blue);
  pulseGrad.addColorStop(1, 'rgba(108, 140, 255, 0.3)');

  ctx.strokeStyle = pulseGrad;
  ctx.lineWidth = strokeW * 0.6;
  ctx.stroke();
  ctx.restore();

  // 7. Central Smart Core (The AI Agent / Financial Beacon)
  // A glowing orb in the center
  ctx.save();
  if (drawBg) {
    ctx.shadowColor = COLORS.mint;
    ctx.shadowBlur = size * 0.04;
  }
  
  const coreRadius = size * 0.038;
  const coreGrad = ctx.createRadialGradient(cx - coreRadius*0.2, cy - coreRadius*0.2, 0, cx, cy, coreRadius);
  coreGrad.addColorStop(0, COLORS.white);
  coreGrad.addColorStop(0.4, COLORS.mint);
  coreGrad.addColorStop(1, COLORS.blue);

  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

/**
 * Generate and save a PNG.
 */
function generateIcon(filename, size, drawBg, markScale) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Enable anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  drawSymbol(ctx, size, drawBg, markScale);

  const outputPath = path.join(ASSETS_DIR, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Created: ${outputPath} (${size}x${size}, ${(buffer.length / 1024).toFixed(1)}KB)`);
  return outputPath;
}

// ============================================
// GENERATE ALL ASSETS
// ============================================

console.log('\n🎨 BudgetPal — Premium Fintech Icon Generator\n');
console.log('Target directory:', ASSETS_DIR);
console.log('');

// 1. Main app icon (1024x1024, solid bg)
generateIcon('icon.png', 1024, true, 0.52);

// 2. Android adaptive foreground (1024x1024, transparent bg, scaled down to 0.38 for safe zone)
generateIcon('android-icon-foreground.png', 1024, false, 0.38);

// 3. Android monochrome (1024x1024, white on transparent)
// For monochrome, we draw with white instead of gradients/colors. Let's make a custom draw for monochrome or override fill colors.
// Since we want monochrome, let's write a small wrapper or just keep standard draw symbol with a custom color scheme.
// Let's modify drawSymbol color scheme dynamically if we want a pure white icon.
// To do this simply, we can replace colors temporarily.
const originalColors = { ...COLORS };

COLORS.mint = '#FFFFFF';
COLORS.blue = '#FFFFFF';
COLORS.white = '#FFFFFF';
generateIcon('android-icon-monochrome.png', 1024, false, 0.38);

// Restore colors
Object.assign(COLORS, originalColors);

// 4. Favicon (512x512, solid bg, slightly larger scale for small-size legibility)
generateIcon('favicon.png', 512, true, 0.58);

// 5. Splash icon (512x512, transparent bg)
generateIcon('splash-icon.png', 512, false, 0.55);

// 6. Android background — solid color
const bgCanvas = createCanvas(1024, 1024);
const bgCtx = bgCanvas.getContext('2d');
bgCtx.fillStyle = COLORS.bg;
bgCtx.fillRect(0, 0, 1024, 1024);
const bgPath = path.join(ASSETS_DIR, 'android-icon-background.png');
fs.writeFileSync(bgPath, bgCanvas.toBuffer('image/png'));
console.log(`✅ Created: ${bgPath} (1024x1024, solid bg)`);

console.log('\n✨ All premium icon assets generated successfully!\n');
