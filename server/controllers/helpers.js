// const ops = require('ndarray-ops');
// const ndarray = require('ndarray');
const math = require('mathjs');
const sharp = require('sharp');

// async function ndarrayToBuffer(finalImage) {
//     const { data, shape } = finalImage;
//     const [height, width, channels] = shape;

//     // Create a Buffer from the ndarray's data.
//     // Assuming data is Uint8ClampedArray and directly usable as a Buffer.
//     const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength);

//     // Use sharp to convert this raw data to an image Buffer.
//     // Make sure that the channels and the format are correct.
//     return sharp(buffer, {
//         raw: {
//             width: width,
//             height: height,
//             channels: channels,
//         },
//     })
//         .png()
//         .toBuffer();
// }

function getOptimizedClusterCenters(image, width, height, K) {
    const S = Math.floor(Math.sqrt((height * width) / K));
    const clusterCenters = [];
    for (let i = 0; i < height - S; i += S) {
        for (let j = 0; j < width - S; j += S) {
            const centerI = i + Math.floor(S / 2);
            const centerJ = j + Math.floor(S / 2);
            clusterCenters.push({ i: centerI, j: centerJ });
        }
    }
    return clusterCenters;
}

function updateClusterCenters(clusterCenters, labels, imageData, width) {
    clusterCenters.forEach((center, ci) => {
        let sumX = 0,
            sumY = 0,
            count = 0;
        for (let i = 0; i < imageData.length / 3; i++) {
            if (labels[i] === ci) {
                sumX += Math.floor(i / width);
                sumY += i % width;
                count++;
            }
        }
        if (count > 0) {
            center.i = Math.floor(sumX / count);
            center.j = Math.floor(sumY / count);
        }
    });
}

function applyColorsToSuperpixels(finalImage, labels, imageData, width) {
    for (let i = 0; i < labels.length; i++) {
        if (labels[i] !== -1) {
            const idx = i * 3;
            finalImage[idx] = imageData[idx]; // Red
            finalImage[idx + 1] = imageData[idx + 1]; // Green
            finalImage[idx + 2] = imageData[idx + 2]; // Blue
        }
    }
}

async function resizeAndPadImage(
    buffer,
    targetSize = [300, 300],
    padColor = [255, 255, 255]
) {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const scale = Math.min(
        targetSize[0] / metadata.width,
        targetSize[1] / metadata.height
    );
    const width = Math.floor(metadata.width * scale);
    const height = Math.floor(metadata.height * scale);

    // Resize image
    const resizedImage = image.resize(width, height);

    // Padding calculations
    const top = Math.floor((targetSize[1] - height) / 2);
    const bottom = targetSize[1] - height - top;
    const left = Math.floor((targetSize[0] - width) / 2);
    const right = targetSize[0] - width - left;

    // Padding and converting to PNG
    return resizedImage
        .extend({
            top: top,
            bottom: bottom,
            left: left,
            right: right,
            background: {
                r: padColor[0],
                g: padColor[1],
                b: padColor[2],
                alpha: 1,
            },
        })
        .toFormat('png')
        .toBuffer();
}

async function slicSuperpixels(
    imagePath,
    labImagePath,
    width,
    height,
    K,
    m,
    numIterations = 3
) {
    const imageData = await sharp(imagePath).raw().toBuffer();
    const labImageData = await sharp(labImagePath).raw().toBuffer();

    const N = height * width;
    const A = N / K;
    const S = Math.floor(Math.sqrt(A));
    const clusterCenters = getOptimizedClusterCenters(
        imageData,
        width,
        height,
        K
    );

    const labels = new Int32Array(N).fill(-1);
    const distances = new Float32Array(N).fill(Infinity);
    const spatialScale = m / S;

    for (let iteration = 0; iteration < numIterations; iteration++) {
        clusterCenters.forEach((center) => {
            const { i: cx, j: cy } = center;
            for (
                let i = Math.max(0, cx - S);
                i < Math.min(height, cx + S);
                i++
            ) {
                for (
                    let j = Math.max(0, cy - S);
                    j < Math.min(width, cy + S);
                    j++
                ) {
                    const idx1 = (cx * width + cy) * 3;
                    const idx2 = (i * width + j) * 3;

                    const dLab = Math.sqrt(
                        Math.pow(labImageData[idx1] - labImageData[idx2], 2) +
                            Math.pow(
                                labImageData[idx1 + 1] - labImageData[idx2 + 1],
                                2
                            ) +
                            Math.pow(
                                labImageData[idx1 + 2] - labImageData[idx2 + 2],
                                2
                            )
                    );
                    const dSpatial = Math.sqrt(
                        Math.pow(cx - i, 2) + Math.pow(cy - j, 2)
                    );

                    const d = dLab + spatialScale * dSpatial;
                    const distanceIndex = i * width + j;

                    if (d < distances[distanceIndex]) {
                        distances[distanceIndex] = d;
                        labels[distanceIndex] = clusterCenters.indexOf(center);
                    }
                }
            }
        });

        updateClusterCenters(clusterCenters, labels, imageData, width);
    }

    const finalImage = new Uint8ClampedArray(imageData.length);
    applyColorsToSuperpixels(finalImage, labels, imageData, width);

    const buffer = Buffer.from(finalImage);
    return sharp(buffer, {
        raw: {
            width: width,
            height: height,
            channels: 3,
        },
    })
        .png()
        .toBuffer();
}

// function calculateGradientSobel(image) {
//     // Convert to grayscale if the image is not already
//     const imageGray =
//         image.channels === 1 ? image : image.cvtColor(cv2.COLOR_BGR2GRAY);

//     // Calculate the gradients using the Sobel operator
//     const gradX = imageGray.sobel(cv2.CV_64F, 1, 0, 3);
//     const gradY = imageGray.sobel(cv2.CV_64F, 0, 1, 3);

//     // Calculate gradient magnitude
//     const gradientMagnitude = gradX.hypot(gradY);

//     // Normalize the gradient magnitude
//     const gradientMagnitudeNorm = gradientMagnitude.normalize(
//         0,
//         1,
//         cv2.NORM_MINMAX,
//         cv2.CV_64F
//     );

//     return gradientMagnitudeNorm;
// }

// function getOptimizedClusterCenters(imageRaw, width, height, K) {
//     const image = cv2.imdecode(imageRaw);

//     const S = Math.floor(Math.sqrt((height * width) / K));
//     const clusterCenters = [];

//     // Compute gradient using Sobel
//     const gradient = calculateGradientSobel(image);

//     // Iterate over the image to find optimized cluster centers
//     for (let i = 0; i <= height - S; i += S) {
//         for (let j = 0; j <= width - S; j += S) {
//             const centerI = i + Math.floor(S / 2);
//             const centerJ = j + Math.floor(S / 2);

//             let minPos = { i: centerI, j: centerJ };
//             let minGradient = gradient.at(minPos.i, minPos.j);

//             // Check neighborhood around the tentative center
//             const neighborhoodSize = Math.floor(S / 4);
//             for (
//                 let ni = Math.max(0, centerI - neighborhoodSize);
//                 ni <= Math.min(height - 1, centerI + neighborhoodSize);
//                 ni++
//             ) {
//                 for (
//                     let nj = Math.max(0, centerJ - neighborhoodSize);
//                     nj <= Math.min(width - 1, centerJ + neighborhoodSize);
//                     nj++
//                 ) {
//                     if (gradient.at(ni, nj) < minGradient) {
//                         minGradient = gradient.at(ni, nj);
//                         minPos = { i: ni, j: nj };
//                     }
//                 }
//             }
//             clusterCenters.push(minPos);
//         }
//     }

//     return clusterCenters;
// }

// function slicSuperpixels(
//     imageRaw,
//     labImageRaw,
//     width,
//     height,
//     K,
//     m,
//     numIterations = 3
// ) {
//     // Convert the image data to LAB color space
//     const imageData = ndarray(new Uint8Array(imageRaw), [height, width, 3]);
//     const labImage = ndarray(new Uint8Array(labImageRaw), [height, width, 3]);

//     // console.log(
//     //     imageData.get(15, 15, 0),
//     //     imageData.get(15, 15, 1),
//     //     imageData.get(15, 15, 2)
//     // );
//     // console.log(labImage);

//     const N = height * width; // Total number of pixels in the image
//     const A = N / K; // Area of superpixel
//     const S = Math.floor(Math.sqrt(A)); // Length of each superpixel

//     // Calculate cluster centers
//     const clusterCenters = getOptimizedClusterCenters(
//         imageData,
//         width,
//         height,
//         S
//     );
//     // Initialize labels and distances arrays
//     const labels = ndarray(new Int32Array(height * width).fill(-1), [
//         height,
//         width,
//     ]);
//     const distances = ndarray(new Float32Array(height * width).fill(Infinity), [
//         height,
//         width,
//     ]);

//     // Initialize distances with Infinity and labels with -1

//     const spatialScale = m / S;

//     // SLIC algorithm
//     for (let iteration = 0; iteration < numIterations; iteration++) {
//         clusterCenters.forEach((center, ci) => {
//             const { i: cx, j: cy } = center;
//             // Search in 2S range

//             for (
//                 let i = Math.max(0, cx - S);
//                 i < Math.min(height, cx + S);
//                 i++
//             ) {
//                 for (
//                     let j = Math.max(0, cy - S);
//                     j < Math.min(width, cy + S);
//                     j++
//                 ) {
//                     const dLab = math.distance(
//                         labImage.get(cx, cy),
//                         labImage.get(i, j)
//                     );
//                     const dSpatial = math.distance([cx, cy], [i, j]);
//                     const d = dLab + spatialScale * dSpatial;

//                     // const d = dSpatial;

//                     if (d < distances.get(i, j)) {
//                         distances.set(i, j, d);
//                         labels.set(i, j, ci);
//                     }
//                 }
//             }
//         });
//         console.log(distances.get(0, 0));

//         // Update cluster centers
//         clusterCenters.forEach((center, ci) => {
//             const members = [];
//             for (let i = 0; i < height; i++) {
//                 for (let j = 0; j < width; j++) {
//                     if (labels.get(i, j) === ci) {
//                         members.push([i, j]);
//                     }
//                 }
//             }
//             if (members.length > 0) {
//                 const newCenter = members.reduce(
//                     ([sumX, sumY], [x, y]) => [sumX + x, sumY + y],
//                     [0, 0]
//                 );
//                 clusterCenters[ci] = {
//                     x: Math.floor(newCenter[0] / members.length),
//                     y: Math.floor(newCenter[1] / members.length),
//                 };
//             }
//         });
//     }

//     // console.log(clusterCenters)
//     // Create the final image

//     let final_image = new Array(height);
//     for (let i = 0; i < height; i++) {
//         final_image[i] = new Array(width);
//         for (let j = 0; j < width; j++) {
//             final_image[i][j] = [0, 0, 0]; // Initialize each pixel as [0, 0, 0]
//         }
//     }

//     for (let ci = 0; ci < clusterCenters.length; ci++) {
//         let members = where(labels, ci, height, width);
//         // if (ci == 99) {
//         //     // console.log("aa", members)
//         // }
//         if (members.length > 0) {
//             mean_r = 0;
//             mean_g = 0;
//             mean_b = 0;
//             for (let i = 0; i < members.length; i++) {
//                 x = members[i][0];

//                 y = members[i][1];

//                 mean_r += imageData[x][y][0];
//                 mean_g += imageData[x][y][1];
//                 mean_b += imageData[x][y][2];
//                 // if (x == 700 && y == 0){
//                 //     console.log("700", ci);
//                 // }
//             }
//             mean_r /= members.length;
//             mean_g /= members.length;
//             mean_b /= members.length;

//             for (let i = 0; i < members.length; i++) {
//                 x = members[i][0];
//                 y = members[i][1];
//                 final_image[x][y][0] = mean_r;
//                 final_image[x][y][1] = mean_g;
//                 final_image[x][y][2] = mean_b;
//             }
//         }
//     }

//     console.log(imageData[603][1]);

//     return final_image;
// }

// function calculateLabDistance(pt1, pt2) {
//     return Math.sqrt(
//         (pt1[0] - pt2[0]) ** 2 + (pt1[1] - pt2[1]) ** 2 + (pt1[2] - pt2[2]) ** 2
//     );
// }

// function calculateSpatialDistance([cx, cy], [i, j]) {
//     return Math.sqrt((cx - i) ** 2 + (cy - j) ** 2);
// }

// function where(labels, ci) {
//     let indx = [];
//     let indy = [];
//     const height = labels.length;
//     const width = labels[0].length;

//     for (let i = 0; i < height; i++) {
//         for (let j = 0; j < width; j++) {
//             if (ci == 0 && i == 700 && j == 0) {
//                 console.log(labels[i][j]);
//                 console.log(ci);
//                 console.log(labels[i][j] === ci);
//             }
//             if (labels[i][j] === ci) {
//                 indx.push(i);
//                 indy.push(j);
//             }
//         }
//     }

//     // Create a 2D array using indx and indy
//     let result = [];
//     for (let i = 0; i < indx.length; i++) {
//         result.push([indx[i], indy[i]]);
//     }

//     return result;
// }

// // Load the image using image-js
// Image.load('Joe.png')
//     .then(async (image) => {
//         // Get image dimensions
//         const dimensions = await getImageDimensions('Joe.png');
//         if (!dimensions) {
//             console.error('Error: Unable to get image dimensions');
//             return;
//         }
//         // console.log(image)

//         // Assign dimensions to global variables
//         const height = dimensions.height;
//         const width = dimensions.width;

//         // Convert the image to a 3D array of RGB pixel values
//         console.log(image);
//         const imageData = [];
//         for (let y = 0; y < height; y++) {
//             const row = [];
//             for (let x = 0; x < width; x++) {
//                 // Get the pixel data at coordinates (x, y)
//                 const pixelData = image.getPixel(x, y);

//                 // Extract the RGB values from the pixel data
//                 // if (x == 0){
//                 //     console.log(pixelData)
//                 // }
//                 const r = pixelData[0];
//                 const g = pixelData[1];
//                 const b = pixelData[2];

//                 // Push an array containing the RGB values into the row array
//                 row.push([r, g, b]);
//             }
//             // Push the row array into the imageData array
//             imageData.push(row);
//         }
//         console.log(imageData);
//         // Provided arrays
//         // Provided arrays
//         // Set parameters for SLIC algorithm
//         const K = 120; // Number of desired superpixels
//         const m = 4; // Constant controlling spatial distance
//         const numIterations = 6; // Number of iterations for SLIC algorithm

//         // Apply SLIC algorithm to the image
//         const superpixelizedImage = slicSuperpixels(
//             imageData,
//             width,
//             height,
//             K,
//             m,
//             numIterations
//         );

//         // Create a new image-js image from the superpixelized data
//         const outputImage = new Image(width, height);
//         for (let y = 0; y < height; y++) {
//             for (let x = 0; x < width; x++) {
//                 const [r, g, b] = superpixelizedImage[y][x];

//                 // outputImage.setPixelXY(x, y, { r, g, b });
//                 //index=(y×width+x)×numChannels
//                 const index = (y * width + x) * 4;
//                 outputImage.data[index] = r;
//                 outputImage.data[index + 1] = g;
//                 outputImage.data[index + 2] = b;
//             }
//         }

//         // Save the output image
//         outputImage
//             .save('output_image.jpg')
//             .then(() => {
//                 console.log(
//                     'Superpixelization completed. Output saved as output_image.jpg'
//                 );
//             })
//             .catch((error) => {
//                 console.error('Error:', error);
//             });
//     })
//     .catch((error) => {
//         console.error('Error:', error);
//     });

// async function getImageDimensions(imagePath) {
//     try {
//         // Load the image asynchronously
//         const image = await Image.load(imagePath);

//         // Extract width and height from the loaded image
//         const width = image.width;
//         const height = image.height;

//         // Return an object containing width and height
//         return { width, height };
//     } catch (error) {
//         // Handle any errors that may occur during the process
//         console.error('Error:', error);
//         return null;
//     }
// }

module.exports = {
    getOptimizedClusterCenters,
    slicSuperpixels,
    resizeAndPadImage,
};
