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
import ImagePicker from 'react-native-image-crop-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import Video from 'react-native-video';
import ClimbsApi from '../api/ClimbsApi';

//Callback function passed from Parent (Record Screen), to UNBLUR IN REAL TIME
//TapCard component- Can upload Video, that unblurs the section (MESSAGING CHANGES!)- NO FEATURES IMPLEMENTED
const TapCard = ({ climb, tapId, tapObj, tapTimestamp, blurred = true, call, cardStyle }) => {
    console.log('[TEST] TapCard called');
    const navigation = useNavigation();
    const { currentUser, role } = React.useContext(AuthContext);
    const [imageUrl, setImageURL] = useState(null);
    const [progressLevel, setProgressLevel] = useState(0);


    const [climbImageUrl, setClimbImageURL] = useState(null);
    const [routeSetterName, setRouteSetterName] = useState('Eddie P.');

    const [currentBlurred, setCurrentBlurred] = useState(blurred);
    ;
    const [selectedImageUrl, setSelectedImageURL] = useState(null);
    const [addedMedia, setAddedMedia] = useState([]);  //Useful for Community
    const [lastUserMedia, setLastUserMedia] = useState(null);

    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                const url = await storage().ref('profile photos/epset.png').getDownloadURL();
                setImageURL(url);
                if (climb && climb.images && climb.images.length > 0) {
                    const climbImage = await storage().ref(climb.images[climb.images.length - 1].path).getDownloadURL();
                    setClimbImageURL(climbImage);
                    //Get the last video uploaded by that user for that climb
                    const snapshot = await TapsApi().getClimbsByIdUser(tapObj.climb, currentUser.uid);
                    if (!snapshot.empty) {
                        let flag = 0
                        for (let i = 0; i < snapshot.docs.length; i = i + 1) {
                            let temp = snapshot.docs[i].data();
                            if (temp.videos && temp.videos.length > 0) {
                                if (flag == 0) {
                                    setSelectedImageURL(temp.videos[0]);
                                    setCurrentBlurred(false);
                                    call(false); //To update parent state and show community posts
                                    flag = 1;
                                    break; //CAN CHANGE BUT UI LOOKS UGLY WITH FLATLIST!
                                }
                                //setAddedMedia(prev => prev.concat(temp.videos));
                            }
                        }
                    }
                    //Get All Videos Associated with that Climb (COMMUNITY)
                    //if (climb.videos && climb.videos.length > 0) {
                    //    setAddedMedia(climb.videos);
                    //}
                }
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

    const [isUploading, setIsUploading] = useState(false); // Add this line

    //Video Adding Logic
    const selectImageLogic = async () => {
        try {
            setIsUploading(true); // Start uploading
            let result = await launchImageLibrary({ mediaType: 'video', videoQuality: 'high' });
            let pickedImages = result.assets;

            // Save the full image path for later uploading
            const imagePath = (pickedImages && pickedImages.length > 0 ? pickedImages[0].uri : null); //Last Image that you pick

            if (imagePath) {
                // Set the image state to include the full path
                let url = await uploadVideo(imagePath); // Now 'url' is defined here
                setSelectedImageURL(url);

                // Now 'url' is available, so we can correctly create the videoObject
                const videoObject = { url: url, role: role };

                // Adding Video to User Tap
                const tapDataResult = await TapsApi().getTap(tapId);
                let obj = tapDataResult.data();
                const newArray = ((obj.videos && obj.videos.length > 0) ? obj.videos.concat([videoObject]) : [videoObject]);
                const updatedTap = {
                    videos: newArray,
                };
                await TapsApi().updateTap(tapId, updatedTap);

                // Adding Video to Overall Climb
                let climbObj = (await ClimbsApi().getClimb(tapObj.climb)).data();
                const newClimbsArray = ((climbObj.videos && climbObj.videos.length > 0) ? [videoObject].concat(climbObj.videos) : [videoObject]);
                const updatedClimb = {
                    videos: newClimbsArray,
                };
                await ClimbsApi().updateClimb(tapObj.climb, updatedClimb);
                setCurrentBlurred(false);
                call(false);
            }
        } catch (err) {
            console.error("Error picking image:", err);
        } finally {
            setIsUploading(false); // Stop uploading regardless of outcome
        }
    };


    const uploadVideo = async (videoPath) => { //VIDEO UPLOADING AND PLAYING INSTANTLY!
        try {
            // Create a reference to the Firebase Storage bucket
            const reference = storage().ref(`videos/${new Date().toISOString()}.mp4`);

            // Put the file in the bucket
            const task = reference.putFile(videoPath);

            task.on('state_changed', (snapshot) => {
                // You can use this to track the progress of the upload
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgressLevel(Math.round(progress));
            });

            // Get the download URL after the upload is complete
            await task;
            const url = await reference.getDownloadURL();
            setProgressLevel(0);
            return url; // You may want to do something with the URL, like storing it in a database
        } catch (error) {
            console.error('Video upload error:', error);
        }
    };

    /* NEED TO ADD MEDIA*/
    return (
        <View style={[styles.idleCard, cardStyle]}>
            {/* top part */}
            <View style={[styles.topPart, { marginTop: '5%' }]}>
                {/* Media */}
                <View style={styles.media}>

                    <TouchableOpacity onPress={selectImageLogic}>
                        {isUploading ? (
                            <ActivityIndicator color='#fe8100' size={'large'} />
                        ) : (
                            <>
                                {!selectedImageUrl ? (
                                    <>
                                        <Image source={require('../../assets/add-photo-image-(3).png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
                                        <Text style={{ marginTop: 15, fontSize: 12, fontWeight: '500', color: '#505050' }}>Add Media</Text>
                                    </>
                                ) : (
                                    <Video source={{ uri: selectedImageUrl }} style={{ width: 120, height: 140 }} muted={true} paused={true} />
                                )}
                            </>
                        )}
                    </TouchableOpacity>

                </View>
                {/* Text */}
                <View style={styles.textContainer}>
                    <View style={styles.momentumTextWrapper}>
                        <View style={styles.inlineContainer}>
                            {isUploading && (
                                <Text style={[styles.text, styles.momentumText, { color: 'black', marginBottom: 5 }]}>Upload is <Text style={{ fontWeight: 'bold' }}>{progressLevel}%</Text> done.</Text>
                            )}
                            {!currentBlurred && !isUploading && (
                                <Text style={[styles.text, styles.momentumText, { color: 'black', marginBottom: 5 }]}>Click on this <Text style={{ fontWeight: 'bold' }}>video</Text> to <Text style={{ fontWeight: 'bold' }}>add</Text> more memories!</Text>
                            )}
                            {currentBlurred && !isUploading && (
                                <Text style={[styles.text, styles.momentumText, { color: 'black', marginBottom: 5 }]}>Record a <Text style={{ fontWeight: 'bold' }}>video</Text> to <Text style={{ fontWeight: 'bold' }}>unlock</Text> Climb Card!</Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.divider} />
            {/* bottom part */}
            <View style={styles.bottomPart}>
                {/* image & color */}
                <View style={[styles.climbNoBg]}>
                    {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: 120, height: 130 }} resizeMode="contain" /> : <ActivityIndicator color='#fe8100' />}
                </View>
                <View style={[styles.climbColor, { backgroundColor: (climb.color ? climb.color : '#fe8100') }]}>
                </View>
                <View style={{ flexDirection: 'column', marginLeft: 15 }}>
                    <View>
                        <Text style={{ fontSize: 12, color: '#454545' }}>Name</Text>
                        <Text style={{ fontSize: 20, color: 'black', paddingVertical: 5 }}>{climb.name}</Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 12, color: '#454545' }}>Grade</Text>
                        <Text style={{ fontSize: 30, fontWeight: 800, paddingVertical: 5, color: 'black' }}>{climb.grade}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.divider} />
            <View style={{ width: '100%' }}>
                <View style={{ marginBottom: 10, paddingHorizontal: 20, marginTop: 5 }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5, color: 'black' }}>
                        Description
                    </Text>
                    <Text style={{ fontSize: 13, color: 'black' }}>
                        {climb.info.trim() !== '' ? climb.info : 'No description set.'}
                    </Text>
                </View>
                {/* Setter Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 20 }}>
                    {/* <Text style={{ fontSize: 12, marginRight: 10, color: 'gray' }}>
                        Set by {routeSetterName}
                    </Text>
                    {imageUrl ? <Image source={{ uri: imageUrl }} style={{ width: 30, height: 30 }} resizeMode="contain" /> : <ActivityIndicator color='#fe8100' />} */}
                </View>
                {currentBlurred && (
                    <BlurView
                        style={styles.absolute}
                        blurType="light"
                        blurAmount={4}
                        reducedTransparencyFallbackColor="white"
                    >
                    </BlurView>
                )}
                {currentBlurred && (
                    <View style={{ justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <Image
                            source={require('../../assets/blur_lock.png')} // Replace with your lock icon image
                            style={styles.lockIcon}
                        />
                    </View>)}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    idleCard: {
        backgroundColor: 'white',
        flex: 1,
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
        right: 0,
    },
    lockIcon: {
        width: 40,
        height: 40,
    },
});

export default TapCard;