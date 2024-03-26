import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const PayUI = () => {
    return (
        <View style={styles.container}>
            {/* Other content */}
            <Text style={styles.title}>Try Nagimo+</Text>
            <View style={styles.imageContainer}>
                <Image
                    source={require('../../../../../assets/Frame-11.png')}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.bandeau}>
                <Text style={styles.bandeauText}>WITH YOUR PURCHASE YOU GET:</Text>
            </View>
            <View style={styles.benefits}>
                {/* Benefits content */}
                <View style={{ flexDirection: 'row', marginTop: 30, alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>♾️</Text>
                    <Text style={{ fontSize: 16, color: 'black', marginLeft: 10, flexShrink: 1 }}>Get <Text style={{ fontWeight: 700 }}>Unlimited Uploads</Text> to capture all that matters</Text>
                </View>
                <View style={{ flexDirection: 'row', marginTop: 30, alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>✨</Text>
                    <Text style={{ fontSize: 16, color: 'black', marginLeft: 10 }}>All your videos, in highest quality</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 30 }}>
                    <Text style={{ fontSize: 24 }}>🏷️</Text>
                    <Text style={{ fontSize: 16, color: 'black', marginLeft: 10 }}>Get an exclusive label on community videos</Text>
                </View>
            </View>
            {/* Sticky 'Join Now' button at the bottom */}
            <View style={styles.joinNow}>
                <Text style={styles.joinNowText}>JOIN NOW <Text style={{ fontWeight: '300' }}>– $2.99 per month</Text></Text>
            </View>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        color: 'black',
        fontStyle: 'normal',
        fontWeight: '700',
        marginVertical: 10,
        marginLeft: 15,
    },
    imageContainer: {
        height: 250,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    bandeau: {
        height: 40,
        backgroundColor: 'white',
        marginHorizontal: 50,
        marginTop: -10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FC5200',
        borderRadius: 5,
    },
    bandeauText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'black',
    },
    benefits: {
        marginHorizontal: 15,
        // Other styles for benefits
    },
    joinNow: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        height: 50,
        backgroundColor: '#FC5200',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    joinNowText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
});

export default PayUI;
