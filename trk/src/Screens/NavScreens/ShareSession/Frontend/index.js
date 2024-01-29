import React, { useRef } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, SafeAreaView, CameraRoll } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import LinearGradient from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import Share from 'react-native-share';

function ShareView({ route }) {
    // Destructure climbData from route.params
    const { climbData } = route.params;

    // Use climbData to store in variables
    const { imageUrl, climbCount, grade } = climbData;

    // Create a ref for the view you want to capture
    const viewRef = useRef();

    return (
        <View style={styles.container}>
            <View ref={viewRef} style={styles.captureArea}>
                <Image source={{ uri: imageUrl }} style={styles.image} />
                <Image
                    source={require('../../../../../assets/Nagimo-Logotype.png')}
                    style={styles.logo}
                />
                <LinearGradient
                    style={styles.textOverlay}
                    colors={['transparent', '#505050']} // Gradient from transparent to black
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}>
                    <View style={{ flex: 1, alignSelf: 'flex-end', marginLeft: 10 }}>
                        <Text style={styles.overlayText}>Climbs</Text>
                        <Text style={styles.overlayTextBig}>{climbCount}</Text>
                    </View>
                    <View style={{ flex: 1, alignSelf: 'flex-end' }}>
                        {/* <Text style={styles.overlayText}>Time</Text> */}
                        {/* <Text style={styles.overlayTextBig}>34m 52s</Text> */}
                    </View>
                    <View style={{ flex: 1, alignSelf: 'flex-end', marginRight: 10 }}>
                        <Text style={styles.overlayText}>Last Climb</Text>
                        <Text style={styles.overlayTextBig}>{grade}</Text>
                    </View>
                </LinearGradient>
            </View>
            <View style={{ marginTop: 15 }}><Text>Feature in progress ... updates next week!</Text></View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', // Assuming a light theme
    },
    captureArea: {
        width: '80%',
        height: '60%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute', // Make sure the image is positioned absolutely
    },
    textContainer: {
        flex: 1,
        justifyContent: 'space-around', // Distribute children evenly
        alignItems: 'center', // Center children horizontally
        padding: 16, // Add padding if needed
    },
    text: {
        fontSize: 18, // Adjust your font size
        color: '#000', // Adjust text color as needed
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent background for legibility
        padding: 8, // Add padding to the text
        // More text styles...
    },
    shareButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#000',
        borderRadius: 20,
    },
    shareButtonText: {
        color: 'white',
    },
    textOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingBottom: 10,
    },
    overlayText: {
        color: 'white', // Text color for better contrast
        fontSize: 14, // Adjust font size as needed
        // Add any other styling for the text
        color: '#FFFEFF',
        marginBottom: 5,
    },
    overlayTextBig: {
        color: 'white', // Text color for better contrast
        fontSize: 16, // Adjust font size as needed
        fontWeight: 'bold',
    },
    logo: {
        position: 'absolute',
        top: -5,
        right: 0,
        width: 125,
        height: 50,
        resizeMode: 'contain',
    },
});

export default ShareView;