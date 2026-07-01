import sharp from 'sharp';
import { writeFileSync } from 'fs';

const svgIcon = (size) => {
  const r = size * 0.2;   // border-radius
  const cx = size / 2;
  const salesY = size * 0.515;
  const subY   = size * 0.635;
  const salesSize = Math.round(size * 0.163);
  const subSize   = Math.round(size * 0.05);

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#1e3a5f"/>
  <text
    x="${cx}" y="${salesY}"
    dx="${size * 0.019}"
    text-anchor="middle"
    font-size="${salesSize}"
    font-weight="700"
    fill="#f4efe9"
    font-family="Arial, Helvetica, sans-serif"
    letter-spacing="${size * 0.0375}">SALES</text>
  <text
    x="${cx}" y="${subY}"
    dx="${size * 0.025}"
    text-anchor="middle"
    font-size="${subSize}"
    font-weight="400"
    fill="#f4efe9"
    font-family="Arial, Helvetica, sans-serif"
    letter-spacing="${size * 0.0094}"
    opacity="0.6">ABOUT US COFFEE</text>
</svg>`);
};

for (const size of [192, 512]) {
  await sharp(svgIcon(size))
    .png()
    .toFile(`public/icon-${size}.png`);
  console.log(`icon-${size}.png 生成完了`);
}

writeFileSync('public/apple-touch-icon.png',
  await sharp(svgIcon(180)).png().toBuffer());
console.log('apple-touch-icon.png 生成完了');
