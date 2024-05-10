const mongoose = require('mongoose');

const logoObjectSchema = new mongoose.Schema(
    {
        preprocessed_img: {
            data: { type: Buffer, required: true },
            contentType: { type: String, required: true },
        },
        superpixel_img: {
            data: Buffer,
            contentType: String,
        },
        prediction: { type: String },
    },
    { timestamps: true }
);

const LogoObject = mongoose.model('LogoObject', logoObjectSchema);
module.exports = LogoObject;
