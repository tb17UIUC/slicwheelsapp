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

module.exports = {
    getOptimizedClusterCenters,
    slicSuperpixels,
    resizeAndPadImage,
};
