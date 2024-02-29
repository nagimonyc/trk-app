import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../Utils/AuthContext';
import storage from '@react-native-firebase/storage';
import ListItemContainer from './ListItemContainer';
import TapsApi from '../api/TapsApi';
import Svg, { Path } from 'react-native-svg';
import { ActivityIndicator } from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';

const RightArrow = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <Path d="M9 18l6-6-6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TapCard = ({climb, tapId, tapObj, tapTimestamp, blurred = true}) => {
    console.log('[TEST] TapCard called');
    const navigation = useNavigation();
    const { role } = React.useContext(AuthContext);
    const [imageUrl, setImageURL] = useState(null);
    const [climbImageUrl, setClimbImageURL] = useState(null);
    const [routeSetterName, setRouteSetterName] = useState('Eddie P.')
    
    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                const url = await storage().ref('profile photos/epset.png').getDownloadURL();
                setImageURL(url);
                const climbImage = await storage().ref(climb.images[climb.images.length-1].path).getDownloadURL();
                setClimbImageURL(climbImage);
            } catch (error) {
                console.error('Failed to fetch image URL:', error);
            }
        };

        fetchImageURL();
    }, [climb]);

    //To fetch the climb image of the latest climb
    const loadImageUrl = async (imagePath) => {
        try {
            const url = await storage().ref(imagePath).getDownloadURL();
            return url;
        } catch (error) {
            console.error("Error getting image URL: ", error);
            throw error;
        }
    };

    const fetchUrl = async (path) => {
        const url = await loadImageUrl(path);
        return url;
    };
    /* NEED TO ADD MEDIA*/
    if (blurred) {
        return (
            <View style={styles.idleCard}>
                {/* top part */}
                <View style={styles.topPart}>
                    {/* Media */}
                    <View style={styles.media}>
                    <Image source={require('../../assets/add-photo-image-(3).png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
                        <Text style={{ marginTop: 15, fontSize: 12, fontWeight: 500, color: '#505050' }}>Add Media</Text>
                    </View>
                    {/* Text */}
                    <View style={styles.textContainer}>
                        <View style={styles.momentumTextWrapper}>
                            <View style={styles.inlineContainer}>
                                <Text style={[styles.text, styles.momentumText, {color: 'black', marginBottom: 5}]}>Record a <Text style={{fontWeight: 'bold'}}>video</Text> to <Text style={{fontWeight: 'bold'}}>unlock</Text> Climb Card!</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View style={styles.divider} />
                {/* bottom part */}
                <View style={styles.bottomPart}>
                    {/* image & color */}
                    <View style={[styles.climbNoBg]}>
                            {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: 120, height: 130}} resizeMode="contain" /> : <ActivityIndicator color='#fe8100'/>}
                    </View>
                    <View style={[styles.climbColor, {backgroundColor: (climb.color? climb.color: '#fe8100')}]}>
                    </View>
                    <View style={{ flexDirection: 'column', marginLeft: 15 }}>
                        <View>
                            <Text style={{ fontSize: 12, color: '#454545' }}>Name</Text>
                            <Text style={{ fontSize: 20, color: 'black', paddingVertical: 5}}>{climb.name}</Text>
                        </View>
                        <View>
                            <Text style={{ fontSize: 12, color: '#454545' }}>Grade</Text>
                            <Text style={{ fontSize: 30, fontWeight: 800, paddingVertical: 5, color: 'black'}}>{climb.grade}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.divider}/>
                    <View style={{width: '100%'}}>
                        <View style={{ marginBottom: 10, paddingHorizontal: 20, marginTop: 5}}>
                            <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5, color: 'black'}}>
                                Description
                            </Text>
                            <Text style={{ fontSize: 13, color: 'black' }}>
                                {climb.info.trim() !== ''? climb.info: 'No description set.'}
                            </Text>
                        </View>
                        {/* Setter Section */}
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20}}>
                            <Text style={{ fontSize: 12, marginRight: 10, color: 'gray'}}>
                                Set by {routeSetterName}
                            </Text>
                            {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: 30, height: 30 }} resizeMode="contain" /> : <ActivityIndicator color='#fe8100'/>}
                        </View>

                        <View style={{ marginBottom: 10, paddingHorizontal: 20, marginTop: 5}}>
                            <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5, color: 'black'}}>
                                Features
                            </Text>
                            {/*Features Come Here*/}
                        </View>
                        <BlurView
                            style={styles.absolute}
                            blurType="light"
                            blurAmount={4}
                            reducedTransparencyFallbackColor="white"
                        />
                    </View>
                    <View style={styles.absolute, {justifyContent: 'center', alignItems: 'center', marginTop: 0}}>
                            <Image
                            source={require('../../assets/blur_lock.png')} // Replace with your lock icon image
                            style={styles.lockIcon}
                            />
                    </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    idleCard: {
        backgroundColor: 'white',
        marginHorizontal: 10,
        marginTop: 0,
        borderRadius: 15,
        height: 340,
        width: '100%',
    },
    topPart: {
        flexDirection: 'row',
        margin: 15,
    },
    bottomPart: {
        flexDirection: 'row',
        margin: 15,
    },
    media: {
        width: 125,
        height: 145,
        backgroundColor: '#D9D9D9',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center', // Aligns children to the center of the container
        paddingHorizontal: 10,
    },
    climbCardText: {
        alignSelf: 'center', // Centers the text horizontally
        fontSize: 16,
        fontWeight: '700',
        position: 'absolute', // Positions the text absolutely within the container
        top: 0, // Aligns the text to the top of the container
        width: '100%', // Ensures the text is as wide as the container
        textAlign: 'center', // Centers the text within its own container
    },
    momentumText: {
        alignSelf: 'center', // Centers the text horizontally
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center'
    },
    momentumTextWrapper: {
        flex: 1,
        justifyContent: 'center', // Centers child vertically in the available space
        flexDirection: 'row', // Aligns children in a row
        alignItems: 'center', // Centers children vertically in the row
    },
    inlineContainer: {
        flexDirection: 'column', // Aligns children in a row
        alignItems: 'center', // Centers children vertically in the row
    },
    logo: {
        height: 20, // Adjust this value to match your text size
        width: 20, // The width will adjust automatically keeping aspect ratio
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 15,
    },
    climbNoBg: {
        width: 120,
        height: 130,
        borderRadius: 10,
        borderColor: '#DEDEDE',
        borderWidth: 1,
        justifyContent: 'center',
    },
    climbColor: {
        width: 35,
        height: 130,
        marginLeft: 8,
    },
    absolute: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
      },
    lockIcon: {
    width: 40,
    height: 40,
    },
});

export default TapCard;