import React from 'react';
import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, SafeAreaView, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchLogoDetails } from '../api/api';

export default function ResultScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { logoId } = route.params;

    const [imageData, setImageData] = useState({
        preprocessedImage: null,
        superpixelImage: null,
        prediction: null,
    });

    useEffect(() => {
        const loadLogoDetails = async () => {
            try {
                const data = await fetchLogoDetails(logoId);
                setImageData({
                    preprocessedImage: data.preprocessedImage,
                    superpixelImage: data.superpixelImage,
                    prediction: data.prediction,
                });
            } catch (err) {
                console.log('Error fetching image:', err);
            }
        };

        loadLogoDetails();
    }, [logoId]);

    return (
        <SafeAreaView style={styles.container}>
            <Image
                source={require('../assets/final-logo.png')} // Adjust the path as necessary
                style={styles.miniLogo}
            />
            {imageData.preprocessedImage && (
                <>
                    <Text style={styles.labelText}>Original Image:</Text>
                    <Image
                        source={{ uri: imageData.preprocessedImage }}
                        style={styles.carImage}
                    />
                </>
            )}
            {imageData.superpixelImage && (
                <>
                    <Text style={styles.labelText}>Superpixelated Image:</Text>
                    <Image
                        source={{ uri: imageData.superpixelImage }}
                        style={styles.carImage}
                    />
                </>
            )}
            <Text style={styles.titleText}>Prediction:</Text>
            <Text style={styles.predictionText}>{imageData.prediction}</Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate('Home')}
                style={styles.button}
            >
                Start Over
            </Button>
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
    carImage: {
        width: '90%',
        height: 225,
        resizeMode: 'contain',
        marginBottom: 5,
    },
    titleText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 5,
    },
    predictionText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: 'blue',
        textAlign: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginVertical: 2,
    },
});
