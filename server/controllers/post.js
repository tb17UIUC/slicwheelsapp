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
