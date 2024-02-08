// Slide1.js
import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView } from 'react-native';

const Slide1 = () => {
    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
            </View >
            <View style={{ flex: 2 }}>
                <Image source={require('../../../../../assets/giphy.gif')} style={styles.image} />
            </View >
            <View style={{ flex: 1 }}>
                <Text style={styles.header}>Nagimo (iPhone)</Text>
                <Text style={styles.text}><Text style={{ fontWeight: 'bold' }}>Tap</Text> your phone against the tag</Text>
            </View >
            <View style={{ flex: 1 }}>
            </View >
        </SafeAreaView>
    );
};

// Add styles below
const styles = StyleSheet.create({
    // slide: {
    //     flex: 1,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
    image: {
        width: 250,
        height: 250,
        marginBottom: 30,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    text: {
        fontSize: 20,
        textAlign: 'center',
        marginHorizontal: 45,
    },
});

export default Slide1;
