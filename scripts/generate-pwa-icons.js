const fs = require('fs');
const path = require('path');

// Create multiple sizes of the SevenFive logo for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createIcon = (size) => {
    const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ea580c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background rounded square -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${size * 0.15}" ry="${size * 0.15}" fill="url(#grad)"/>
  
  <!-- Number 7 -->
  <text x="50%" y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.6}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="central">7</text>
</svg>`;

    return svgContent;
};

console.log('Generating PWA icons...');

sizes.forEach(size => {
    const svgContent = createIcon(size);
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(__dirname, '..', 'public', filename);

    fs.writeFileSync(filepath, svgContent);
    console.log(`✅ Created ${filename}`);
});

console.log('✨ All PWA icons generated successfully!');
console.log('');
console.log('📱 To convert SVG to PNG (for better compatibility):');
console.log('1. Use online converter like https://convertio.co/svg-png/');
console.log('2. Or use ImageMagick: convert icon-192x192.svg icon-192x192.png');
console.log('3. Or use Node.js sharp library for batch conversion');
console.log('');
console.log('🚀 Your app is now ready for mobile installation!');
