import axios from 'axios';
import client from './client';

export const sendImageToBackend = async (imgObj) => {
    const { base64data, contentType } = imgObj;
    try {
        const response = await client.post('/logo/create', {
            base64data: base64data,
            contentType: contentType,
        });

        if (response.status === 201) {
            return response.data.id; // Return the ID from the response
        } else {
            throw new Error('Failed to upload logo');
        }
    } catch (err) {
        console.log('not working!!!');
        console.error('Error uploading image:', err);
        throw err;
    }
};

export const fetchLogoDetails = async (logoId) => {
    if (logoId === '') return null;

    try {
        const response = await client.get(`/logo/get-logo/${logoId}`);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error('Failed to fetch logo details');
        }
    } catch (err) {
        console.error('Error fetching logo details:', err);
        throw err;
    }
};

export const fetchLogoHistory = async () => {
    try {
        const response = await client.get(`/logo/get-all-logos`);
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error('Failed to fetch logo details');
        }
    } catch (err) {
        console.error('Error fetching logo details:', err);
        throw err;
    }
};
