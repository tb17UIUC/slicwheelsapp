import React from 'react';
import { View, Image, StyleSheet, SafeAreaView, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <Image
                source={require('../assets/final-logo.png')}
                style={styles.logo}
            />
            <Text style={styles.titleText}>
                Receive a prediction of a car's brand by a picture of its logo!
            </Text>
            <View style={styles.buttonContainer}>
                <Button
                    icon="arrow-right-bold-circle"
                    mode="contained"
                    onPress={() => navigation.navigate('Image')}
                    style={styles.button}
                >
                    Get Started
                </Button>
                <Button
                    icon="history"
                    mode="contained"
                    onPress={() => navigation.navigate('History')}
                    style={[styles.button, styles.secondButton]}
                >
                    View History
                </Button>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        width: '100%',
        height: 300,
        resizeMode: 'contain',
        marginBottom: 10,
    },
    titleText: {
        textAlign: 'center',
        paddingHorizontal: 10,
        marginTop: 16,
        fontSize: 22,
        marginBottom: 10,
    },
    buttonContainer: {
        marginTop: 20,
        width: '80%',
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        fontSize: 18,
        marginBottom: 10,
    },
    secondButton: {
        marginTop: 10,
    },
});
