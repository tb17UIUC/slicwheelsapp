import React from 'react';
import { useState, useEffect } from 'react';
import {
    View,
    Image,
    StyleSheet,
    SafeAreaView,
    Text,
    ActivityIndicator,
} from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { sendImageToBackend } from '../api/api';
import { useNavigation } from '@react-navigation/native';

export default function ImageScreen() {
    const navigation = useNavigation();

    const [image, setImage] = useState({});

    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const saveImage = async (imgObj) => {
        setImage(imgObj);
        // console.log(imgObj);
        setIsLoading(true);
        try {
            const logoId = await sendImageToBackend(imgObj);
            setIsLoading(false);
            navigation.navigate('Result', { logoId });
        } catch (error) {
            setIsLoading(false);
            setErrorMessage('Failed to upload image. Please try again.');
            setSnackbarVisible(true);
        }
    };

    const onCameraClick = async () => {
        try {
            await ImagePicker.requestCameraPermissionsAsync();
            let result = await ImagePicker.launchCameraAsync({
                cameraType: ImagePicker.CameraType.back,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.4,
                base64: true,
            });

            if (!result.canceled) {
                saveImage({
                    base64data: result.assets[0].base64,
                    contentType: result.assets[0].mimeType,
                });
            }
        } catch (error) {
            console.log('Camera failed');
            setErrorMessage('Failed to open the camera. Please try again.');
            setSnackbarVisible(true);
        }
    };

    const onUploadClick = async () => {
        try {
            await ImagePicker.getMediaLibraryPermissionsAsync();
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.4,
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
            setErrorMessage('Failed to open image library. Please try again.');
            setSnackbarVisible(true);
        }
    };

    return isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
    ) : (
        <SafeAreaView style={styles.container}>
            <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
                wrapperStyle={styles.snackbar}
            >
                {errorMessage}
            </Snackbar>
            <Image
                source={require('../assets/final-logo.png')}
                style={styles.miniLogo}
            />
            <Text style={styles.headerText}>
                Take a picture or upload an image of a car's logo to receive a
                brand prediction!
            </Text>
            <Image
                source={require('../assets/sample_preds.jpg')}
                style={styles.image}
            />
            <View style={styles.buttonContainer}>
                <Button
                    icon="camera"
                    mode="contained"
                    onPress={() => onCameraClick()}
                    style={styles.button}
                >
                    Open Camera
                </Button>
                <Button
                    icon="upload"
                    mode="contained"
                    onPress={() => onUploadClick()}
                    style={styles.button}
                >
                    Upload Image
                </Button>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    miniLogo: {
        width: 100,
        height: 50,
        resizeMode: 'contain',
        marginBottom: 10,
        marginTop: 10,
    },
    headerText: {
        textAlign: 'center',
        fontSize: 24,
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    image: {
        width: '100%',
        height: '50%',
        resizeMode: 'contain',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'column',
        width: '100%',
        alignItems: 'center',
    },
    button: {
        width: '90%',
        paddingVertical: 10,
        fontSize: 18,
        marginBottom: 10,
    },
    snackbar: {
        top: 100,
        left: 0,
        right: 0,
    },
});
