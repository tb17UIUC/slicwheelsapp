import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ImageScreen from './screens/ImageScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import {
    MD3LightTheme as DefaultTheme,
    PaperProvider,
} from 'react-native-paper';
import DemoScreen from './screens/DemoScreen';
import { useEffect } from 'react';

const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: 'tomato',
        secondary: 'yellow',
    },
};

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <PaperProvider theme={theme}>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Home">
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Image" component={ImageScreen} />
                    <Stack.Screen name="Result" component={ResultScreen} />
                    <Stack.Screen name="History" component={HistoryScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}

// export default function App() {
//     return (
//         <PaperProvider theme={theme}>
//             <DemoScreen />
//         </PaperProvider>
//     );
// }
