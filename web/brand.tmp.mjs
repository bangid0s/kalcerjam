import sharp from 'sharp';
const A = '../assets/', P = 'public/brand/';
const melt = sharp(A + 'kalcer-jam-logo-green-2026.png');
// letters + melt down to where it turns solid lime
const crop = { left: 0, top: 640, width: 2517, height: 1400 };
await melt.clone().extract(crop).resize(1800).webp({ quality: 88 }).toFile(P + 'kj-melt.webp');
const { data, info } = await melt.clone().extract(crop).resize(400).raw().toBuffer({ resolveWithObject: true });
const row = (info.height - 2) * info.width * info.channels; console.log('bottom px', [...data.slice(row + 200 * info.channels, row + 200 * info.channels + 4)]);
// letters only, for small uses
await melt.clone().extract({ left: 180, top: 640, width: 2160, height: 900 }).resize(900).webp({ quality: 90 }).toFile(P + 'kj-letters.webp');
await sharp(A + 'anak-kalcer-solid.png').resize(900).webp({ quality: 90 }).toFile(P + 'anak-kalcer.webp');
await sharp(A + 'kalcer-jam-logo-2025.png').trim().resize(700).webp({ quality: 90 }).toFile(P + 'kj-2025.webp');
// favicon: anak kalcer mark on black square
const icon = await sharp(A + 'anak-kalcer-solid.png').resize(440, 440, { fit: 'contain', background: '#0b0b0a' }).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#0b0b0a' } }).composite([{ input: icon, gravity: 'center' }]).png().toFile('src/app/icon.png');
// share card 1200x630
const og = await melt.clone().resize(1200, 1180, { fit: 'cover', position: 'top' }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#0b0b0a' } })
  .composite([{ input: og, top: -330, left: 0 },
    { input: Buffer.from(`<svg width="1200" height="630"><text x="60" y="110" font-family="Impact, Arial Black" font-size="64" fill="#ebe5d5">26—27.07.2027 · SEMARANG</text></svg>`), top: 0, left: 0 }])
  .png().toFile('src/app/[lang]/opengraph-image.png');
