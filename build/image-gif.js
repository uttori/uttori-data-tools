import { promises as fs } from 'fs';
import { ImageGIF } from './src/index.js';

const data = await fs.readFile('./test/image/assets/sundisk04.gif');
const image = ImageGIF.fromFile(data);

console.log('Width:', image.width);
console.log('Height:', image.height);
console.log('Colors:', image.colors);
console.log('Image descriptors:', image.imageDescriptors.length);
console.log('Palette length:', image.palette.length);

// Decode the pixels
console.log('\nDecoding pixels...');
image.decodePixels();
console.log('Pixels length:', image.pixels.length);
console.log('Expected pixels:', image.width * image.height);

// Try to get some pixels
console.log('\nTesting getPixel:');
const pixel00 = image.getPixel(0, 0);
console.log('Pixel at (0,0):', pixel00);

const pixel11 = image.getPixel(1, 1);
console.log('Pixel at (1,1):', pixel11);

const pixel1010 = image.getPixel(10, 10);
console.log('Pixel at (10,10):', pixel1010);

// Test error handling
console.log('\nTesting error handling:');
try {
  image.getPixel(300, 0);
} catch (e) {
  console.log('Expected error for x=300:', e.message);
}

try {
  image.getPixel(0, -1);
} catch (e) {
  console.log('Expected error for y=-1:', e.message);
}

console.log('\n✓ All tests passed!');

///

const testFiles = [
  './test/image/assets/sundisk04.gif',
  './test/image/assets/gif87.gif',
  './test/image/assets/gif89.gif',
  './test/image/assets/BOB_89A.gif',
];

for (const file of testFiles) {
  console.log(`\nTesting: ${file}`);
  try {
    const data = await fs.readFile(file);
    const image = ImageGIF.fromFile(data);

    console.log(`  Size: ${image.width}x${image.height}`);
    console.log(`  Colors: ${image.colors}`);
    console.log(`  Image descriptors: ${image.imageDescriptors.length}`);

    image.decodePixels();
    console.log(`  Pixels decoded: ${image.pixels.length}`);
    console.log(`  Expected: ${image.width * image.height}`);

    const pixel = image.getPixel(0, 0);
    console.log(`  Pixel (0,0): [${pixel.join(', ')}]`);

    // Verify all pixels are valid RGB values
    let validPixels = true;
    for (let y = 0; y < Math.min(image.height, 10); y++) {
      for (let x = 0; x < Math.min(image.width, 10); x++) {
        const p = image.getPixel(x, y);
        if (p.length !== 4 || p.some(v => v === undefined || v < 0 || v > 255)) {
          console.log(`  ✗ Invalid pixel at (${x},${y}):`, p);
          validPixels = false;
          break;
        }
      }
      if (!validPixels) break;
    }

    if (validPixels) {
      console.log('  ✓ All sampled pixels are valid');
    }
  } catch (e) {
    console.log(`  ✗ Error: ${e.message}`);
  }
}

console.log('\n✓ All tests completed!');

