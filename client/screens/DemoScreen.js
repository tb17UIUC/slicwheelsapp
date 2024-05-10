import React, { useState, useEffect } from 'react';
import {
    View,
    Image,
    StyleSheet,
    SafeAreaView,
    Text,
    Pressable,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
    fetchLogoDetails,
    sendImageToBackend,
    establishConnection,
} from '../api/api';

export default function DemoScreen() {
    const [origImage, setOrigImage] = useState('');
    const [superpixelImage, setSuperpixelImage] = useState('');

    const [logoId, setLogoId] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const windowHeight = Dimensions.get('window').height;

    useEffect(() => {
        const checkServer = async () => {
            await establishConnection();
        };

        checkServer();
    }, []);

    const dynamicStyles = StyleSheet.create({
        imageContainer: {
            marginTop: 20,
            alignItems: 'center',
            width: '100%',
            height: windowHeight * 0.8,
            marginBottom: 20,
        },
    });

    const saveImage = async (imgObj) => {
        // console.log(imgObj);
        setIsLoading(true);
        try {
            setLogoId(await sendImageToBackend(imgObj)); // Get the logo ID
            // navigation.navigate('Result', { logoId }); // Pass the ID as a parameter
        } catch (error) {
            console.log(error);
            setIsLoading(false);
        }
    };

    const onUploadClick = async () => {
        try {
            await ImagePicker.getMediaLibraryPermissionsAsync();
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3,
                base64: true,
            });

            if (!result.canceled) {
                saveImage({
                    base64data: result.assets[0].base64,
                    contentType: result.assets[0].mimeType,
                });
            }
        } catch (error) {
            console.log('Media library failed');
        }
    };

    useEffect(() => {
        if (!logoId) return;

        const loadLogoDetails = async () => {
            try {
                const data = await fetchLogoDetails(logoId);
                setOrigImage(data.preprocessedImage);
                setSuperpixelImage(data.superpixelImage);
            } catch (err) {
                console.log('Error fetching image:', err);
            }
        };

        loadLogoDetails();
        setIsLoading(false);
    }, [logoId]);

    const handleImageError = (e) => {
        e.target.onerror = null; // Prevents looping
        e.target.src = require('../assets/not-found.jpeg');
    };

    return isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
    ) : (
        <SafeAreaView style={styles.container}>
            <Pressable style={styles.button} onPress={onUploadClick}>
                <Text style={styles.buttonText}>
                    Pick an image from library
                </Text>
            </Pressable>
            {origImage && (
                <View style={dynamicStyles.imageContainer}>
                    <Text>Original Image:</Text>
                    <Image
                        source={{ uri: origImage }}
                        style={styles.image}
                        onError={handleImageError}
                    />
                    <Text>Superpixel Image:</Text>
                    <Image
                        source={{ uri: superpixelImage }}
                        style={styles.image}
                        onError={handleImageError}
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    image: {
        width: '90%',
        height: 300,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    button: {
        backgroundColor: 'tomato', // Button color
        padding: 10,
        borderRadius: 5,
        elevation: 2, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginBottom: 20,
    },
    buttonText: {
        color: 'white', // Text color
        fontSize: 16,
        textAlign: 'center',
    },
});
