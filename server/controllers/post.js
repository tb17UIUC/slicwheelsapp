const LogoObject = require('../models/logoImage');
const axios = require('axios');

exports.createLogo = async (req, res) => {
    const { base64data } = req.body;

    if (!base64data) {
        return res.status(400).send('No image data provided');
    }

    console.log('bobobusjnbqwoiwfn');

    try {
        const pythonResponse = await axios.post(
            'http://10.194.175.69:5011/process-logo',
            {
                base64data,
            }
        );

        const { resized_image_encoded, final_image_encoded, prediction_text } =
            pythonResponse.data;

        const newLogo = new LogoObject({
            preprocessed_img: {
                data: Buffer.from(resized_image_encoded, 'base64'),
                contentType: 'image/png',
            },
            superpixel_img: {
                data: Buffer.from(final_image_encoded, 'base64'),
                contentType: 'image/png',
            },
            prediction: prediction_text,
        });

        await newLogo.save();

        res.status(201).send({
            message: 'Logo uploaded successfully',
            id: newLogo._id,
        });
    } catch (error) {
        console.error('Error calling python backend:', error);
        res.status(500).send('Error processing the logo');
    }
};

exports.deleteById = async (req, res) => {
    try {
        const { imageId } = req.params;

        await LogoObject.findByIdAndDelete(imageId);

        res.status(200).json({
            message: 'Logo deleted successfully',
            id: imageId,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error deleting the logo');
    }
};

exports.getSingleLogo = async (req, res) => {
    try {
        const { imageId } = req.params;
        const logo = await LogoObject.findById(imageId);

        if (!logo) {
            return res.status(404).send('Logo not found.');
        }

        const result = {
            prediction: logo.prediction,
        };

        if (logo.preprocessed_img.data) {
            result.preprocessedImage = `data:${
                logo.preprocessed_img.contentType
            };base64,${logo.preprocessed_img.data.toString('base64')}`;
        }

        if (logo.superpixel_img && logo.superpixel_img.data) {
            result.superpixelImage = `data:${
                logo.superpixel_img.contentType
            };base64,${logo.superpixel_img.data.toString('base64')}`;
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error.');
    }
};

exports.getAllLogos = async (req, res) => {
    try {
        const logos = await LogoObject.find({})
            .sort({ createdAt: -1 })
            .limit(5);

        const results = logos.map((logo) => {
            const result = {
                prediction: logo.prediction,
            };

            if (logo.preprocessed_img && logo.preprocessed_img.data) {
                result.preprocessedImage = `data:${
                    logo.preprocessed_img.contentType
                };base64,${logo.preprocessed_img.data.toString('base64')}`;
            }

            result.logoId = logo._id;

            return result;
        });

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching all logos:', error);
        res.status(500).send('Internal Server Error');
    }
};

// exports.createLogo = async (req, res) => {
//     const { base64data, contentType } = req.body;

//     if (!base64data) {
//         return res.status(400).send('No image data provided');
//     }

//     try {
//         const buffer = Buffer.from(base64data, 'base64');

//         const childPython = spawn('python', [
//             'python_backend.py',
//             buffer.toString('base64'),
//         ]);

//         let fullData = '';
//         childPython.stdout.on('data', (data) => {
//             fullData += data.toString();
//         });

//         childPython.stdout.on('end', async () => {
//             const results = fullData.split('|');
//             if (results.length === 3) {
//                 const [
//                     resizedAndPaddedImage,
//                     superpixelatedImage,
//                     predictionText,
//                 ] = results;

//                 const newLogo = new LogoObject({
//                     preprocessed_img: {
//                         data: Buffer.from(resizedAndPaddedImage, 'base64'),
//                         contentType: 'image/png',
//                     },
//                     superpixel_img: {
//                         data: Buffer.from(superpixelatedImage, 'base64'),
//                         contentType: 'image/png',
//                     },
//                     prediction: predictionText,
//                 });

//                 await newLogo.save();

//                 res.status(201).send({
//                     message: 'Logo uploaded successfully',
//                     id: newLogo._id,
//                 });
//             } else {
//                 res.status(500).send(
//                     'Invalid data received from Python script'
//                 );
//             }
//         });

//         childPython.stderr.on('data', (data) => {
//             console.error(`stderr: ${data}`);
//         });

//         childPython.on('close', (code) => {
//             console.log(`child process exited with code ${code}`);
//         });
//     } catch (err) {
//         console.error('Error:', err);
//         res.status(500).send('Error processing the logo');
//     }
// };

// exports.establishConnection = async (req, res) => {
//     try {
//         LogoObject.findOne({}).exec();
//         res.status(200).send('Connection established');
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send('Error establishing connection');
//     }
// };

{
    /* <div id="logos-container"></div>

<script>
fetch('/api/logo/get-all-logos')
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('logos-container');
        data.forEach(logo => {
            const logoElement = document.createElement('div');
            const image = document.createElement('img');
            image.src = logo.imageUrl;
            image.alt = 'Logo Image';

            const predictionText = document.createElement('p');
            predictionText.textContent = 'Prediction: ' + logo.prediction;

            logoElement.appendChild(image);
            logoElement.appendChild(predictionText);
            container.appendChild(logoElement);
        });
    })
    .catch(error => console.error('Error loading logos:', error));
</script> */
}

{
    /* <div id="logo-details"></div>

<script>
fetch('/api/logo/get-logo/123')  // Replace '123' with the actual logo ID
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('logo-details');
        
        const imageOrig = document.createElement('img');
        imageOrig.src = data.originalImage;
        imageOrig.alt = 'Original Image';
        
        const imageSuperpixel = document.createElement('img');
        if (data.superpixelImage) {
            imageSuperpixel.src = data.superpixelImage;
            imageSuperpixel.alt = 'Superpixel Image';
        } else {
            imageSuperpixel.alt = 'No Superpixel Image Available';
        }

        const predictionText = document.createElement('p');
        predictionText.textContent = 'Prediction: ' + data.prediction;

        container.appendChild(imageOrig);
        container.appendChild(imageSuperpixel);
        container.appendChild(predictionText);
    })
    .catch(error => console.error('Error loading logo details:', error));
</script> */
}

// exports.createLogo = async (req, res) => {
//     console.log(req.file);
//     const file = req.file;

//     if (!file) {
//         return res.status(400).send('File must be uploaded');
//     }

//     try {
//         const fileBuffer = await readFile(file.path);
//         const buff = fileBuffer.toString('base64');

//         const childPython = spawn('python', ['python_backend.py', buff]);

//         let fullData = '';

//         childPython.stdout.on('data', (data) => {
//             fullData += data.toString();
//         });

//         childPython.stdout.on('end', async () => {
//             console.log(fullData.substring(0, 50)); // To check the output
//             const results = fullData.split('|');
//             if (results.length === 3) {
//                 const resizedAndPaddedImage = results[0];
//                 const superpixelatedImage = results[1];
//                 const predictionText = results[2];

//                 // Create the new Logo object
//                 const newLogo = new LogoObject({
//                     preprocessed_img: {
//                         data: Buffer.from(resizedAndPaddedImage, 'base64'),
//                         contentType: 'image/png', // Assuming output is PNG
//                     },
//                     superpixel_img: {
//                         data: Buffer.from(superpixelatedImage, 'base64'),
//                         contentType: 'image/png',
//                     },
//                     prediction: predictionText,
//                 });

//                 // Save the LogoObject to the database
//                 await newLogo.save();

//                 res.status(201).send({
//                     message: 'Logo uploaded successfully',
//                     id: newLogo._id,
//                 });
//             } else {
//                 res.status(500).send(
//                     'Invalid data received from Python script'
//                 );
//             }
//         });

//         childPython.stderr.on('data', (data) => {
//             console.error(`stderr: ${data}`);
//         });

//         childPython.on('close', (code) => {
//             console.log(`child process exited with code ${code}`);
//         });
//     } catch (err) {
//         console.error('Error:', err);
//         res.status(500).send('Error saving the logo');
//     } finally {
//         // delete the file since it's no longer needed
//         await unlink(file.path);
//     }
// };

// exports.createLogo = async (req, res) => {
//     console.log(req.file);
//     const file = req.file;

//     if (!file) {
//         return res.status(400).send('File must be uploaded');
//     }

//     try {
//         // Read the file from the path where multer has stored it and directly use the buffer
//         const buffer = await readFile(file.path);

//         // console.log(buffer);

//         // Resize and pad the image before saving it
//         const resizedAndPaddedBuffer = await resizeAndPadImage(buffer);

//         const newLogo = new LogoObject({
//             // orig_img: {
//             //     data: buffer,
//             //     contentType: 'image/png', // Assuming output is PNG
//             // },
//             preprocessed_img: {
//                 data: resizedAndPaddedBuffer,
//                 contentType: 'image/png', // Assuming output is PNG
//             },
//         });

//         await newLogo.save();
//         res.status(201).send({
//             message: 'Logo uploaded successfully',
//             id: newLogo._id,
//         });
//     } catch (err) {
//         console.error('Error:', err);
//         res.status(500).send('Error saving the logo');
//     } finally {
//         // Optionally, delete the file if it's no longer needed
//         fs.unlink(file.path, (err) => {
//             if (err) console.error('Error removing temp file', err);
//         });
//     }
// };

// exports.doSuperpixel = async (req, res) => {
//     try {
//         const { imageId } = req.params;

//         const logo = await LogoObject.findById(imageId);

//         if (!logo || !logo.preprocessed_img.data) {
//             return res
//                 .status(404)
//                 .send('Image not found or image data is corrupt');
//         }

//         console.log('Content Type:', logo.preprocessed_img.contentType);

//         const imageBuffer = logo.preprocessed_img.data;
//         const image = sharp(imageBuffer);
//         const metadata = await image.metadata();

//         if (!metadata) {
//             throw new Error('Failed to retrieve image metadata');
//         }

//         // console.log(metadata.width, metadata.height);

//         const { width, height } = metadata;

//         const imageRaw = await image.raw().toBuffer();
//         const labImage = await sharp(imageBuffer)
//             .toColourspace('lab')
//             .raw()
//             .toBuffer();

//         const finalImage = slicSuperpixels(
//             imageRaw,
//             labImage,
//             width,
//             height,
//             6, // number of superpixels
//             3 // compactness
//         );

//         const base64Image = await ndarrayToBase64(finalImage, width, height);

//         // Assume `slicSuperpixels` returns a Buffer of the processed image
//         // Save the superpixelated image to the database (optional)
//         logo.superpixel_img = {
//             data: base64Image,
//             contentType: logo.preprocessed_img.contentType,
//         };

//         // console.log(base64Image);

//         await logo.save();

//         res.status(200).json({
//             message: 'Superpixelated image created successfully',
//             // dimensions: { width, height },
//         });
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).send('Error processing the image');
//     }
// };
