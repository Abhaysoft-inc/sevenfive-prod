// First install sharp: npm install sharp
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const convertSvgToPng = async () => {
    console.log('Converting SVG icons to PNG...');

    for (const size of sizes) {
        const svgFile = path.join(__dirname, '..', 'public', `icon-${size}x${size}.svg`);
        const pngFile = path.join(__dirname, '..', 'public', `icon-${size}x${size}.png`);

        try {
            if (fs.existsSync(svgFile)) {
                await sharp(svgFile)
                    .resize(size, size)
                    .png()
                    .toFile(pngFile);
                console.log(`✅ Created icon-${size}x${size}.png`);
            } else {
                console.log(`❌ SVG file not found: icon-${size}x${size}.svg`);
            }
        } catch (error) {
            console.error(`❌ Error converting icon-${size}x${size}.svg:`, error.message);
        }
    }

    console.log('✨ PNG conversion completed!');
};

convertSvgToPng().catch(console.error);
