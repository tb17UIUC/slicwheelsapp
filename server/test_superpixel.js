const { resizeAndPadImage, slicSuperpixels } = require('./controllers/helpers');
const fs = require('fs').promises;
const sharp = require('sharp');

// async function testSuperpixels() {
//     try {
//         // Read the image file into a buffer
//         const buffer = await fs.readFile('./Banner-image-12.jpg');

//         // Resize and pad the image
//         const resizedAndPaddedBuffer = await resizeAndPadImage(
//             buffer,
//             [300, 300]
//         );

//         await fs.writeFile('resized_test_img.png', resizedAndPaddedBuffer);

//         // Convert the PNG buffer to LAB space as a raw buffer
//         const labImageRaw = await convertToLAB(resizedAndPaddedBuffer);

//         // Now process the resized and padded image with the superpixel algorithm
//         const width = 300; // Width of the resized image (should match resizeAndPadImage)
//         const height = 300; // Height of the resized image (should match resizeAndPadImage)
//         const K = 200; // Number of superpixels
//         const m = 10; // Compactness factor
//         const numIterations = 3; // Number of iterations for the algorithm

//         resizedImagePath = 'resized_test_img.png';
//         labImagePath = 'lab_image.png';

//         // Convert your Buffer to something slicSuperpixels can use
//         const superpixelBuffer = await slicSuperpixels(
//             resizedImagePath,
//             labImagePath,
//             width,
//             height,
//             K,
//             m,
//             numIterations
//         );

//         // Save the superpixel image to a new file
//         await fs.writeFile('superpixel_test_img.png', superpixelBuffer);
//         console.log(
//             'Superpixel image has been saved as superpixel_test_img.png'
//         );
//     } catch (error) {
//         console.error('An error occurred:', error);
//     }
// }

// testSuperpixels();

// // Test encoding with mock data
// async function testEncoding() {
//     const width = 300;
//     const height = 300;
//     const channels = 3; // RGB
//     const mockData = new Uint8ClampedArray(width * height * channels);
//     // Fill with some test data
//     mockData.fill(150); // Mid-tone grey

//     const buffer = Buffer.from(mockData.buffer);
//     const encodedBuffer = await sharp(buffer, {
//         raw: {
//             width: width,
//             height: height,
//             channels: channels,
//         },
//     })
//         .png()
//         .toBuffer();

//     await fs.writeFile('test_image.png', encodedBuffer);
//     console.log('Test image has been saved as test_image.png');
// }

// // testEncoding();
