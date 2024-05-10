import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchLogoHistory } from '../api/api';

export default function HistoryScreen() {
    const [logos, setLogos] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const logoData = await fetchLogoHistory();
                setLogos(logoData);
            } catch (error) {
                console.error('Error loading logo history:', error);
            }
        };

        fetchHistory();
    }, []);

    const handlePress = (logoId) => {
        navigation.navigate('Result', { logoId });
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={logos}
                keyExtractor={(item) => item.logoId}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.logoItem}
                        onPress={() => handlePress(item.logoId)}
                    >
                        <Image
                            source={{ uri: item.preprocessedImage }}
                            style={styles.logoImage}
                        />
                        <Text style={styles.logoText}>{item.prediction}</Text>
                    </TouchableOpacity>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    logoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    logoImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        marginRight: 20,
    },
    logoText: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
    },
});
