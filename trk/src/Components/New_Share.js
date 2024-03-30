import React, { useState, useContext, useEffect, useRef} from "react";
import { SafeAreaView, View, Text, StyleSheet, Button, Alert, TouchableOpacity, Switch, Image, Platform, Dimensions, Modal } from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import { captureRef } from 'react-native-view-shot';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import { PermissionsAndroid} from "react-native";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import analytics from '@react-native-firebase/analytics';
import { ActivityIndicator } from "react-native";
import storage from '@react-native-firebase/storage';
import TapsApi from "../api/TapsApi";
import ClimbsApi from "../api/ClimbsApi";
import { FlatList } from "react-native-gesture-handler";
import Video from 'react-native-video';
import UsersApi from "../api/UsersApi";

//Placeholder Component for this PR.
const New_Share = ({route}) => {
    const { currentUser, role } = useContext(AuthContext);
    const viewRef = useRef();
    const data = route.params;
    const { climb, tapId, tapObj} = data;
    console.log('Share Climb: ', climb);

    const [routeSetterName, setRouteSetterName] = useState('Eddie P.');

    const [climbImageUrl, setClimbImageURL] = useState(null); //NO BG CLIMB IMAGE.
    const [selectedImageUrl, setSelectedImageURL] = useState(null) //The last video uploaded by that user.
    const [imageUrl, setImageURL] = useState(null);
    const [addedMedia, setAddedMedia] = useState([]);

    const { width: deviceWidth } = Dimensions.get('window');
    // Calculate single video width (33.33% of device width)
    const videoWidth = deviceWidth * 0.3333;
    // Calculate video height to maintain a 16:9 aspect ratio
    const videoHeight = videoWidth * (16 / 9);

    const [modalVisible, setModalVisible] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');

    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                if (climb && climb.images && climb.images.length > 0) {
                const url = await storage().ref('profile photos/epset.png').getDownloadURL();
                setImageURL(url);
                const climbImage = await storage().ref(climb.images[climb.images.length-1].path).getDownloadURL();
                setClimbImageURL(climbImage);
                //Get the last video uploaded by that user for that climb
                const userObj = (await UsersApi().getUsersBySomeField("uid", currentUser.uid)).docs[0].data(); //Using the Videos associated with the user Object
                if (userObj && userObj.videos && userObj.videos.length > 0) {
                    let selectedVideos = userObj.videos;
                    // Assuming climb.climbId is defined and you want to filter based on it
                    let filtered = selectedVideos.filter(obj => obj.climb && obj.climb === climb.climbId);
                    // Extract just the URLs from the filtered objects
                    let urls = filtered.map(obj => obj.url);
                    setAddedMedia(urls);
                }                
                }
            } catch (error) {
                console.error('Failed to fetch image URL:', error);
            }
        };

        fetchImageURL();
    }, [climb]);

    //Permission Check for Android
    async function hasAndroidPermission() {
        const getCheckPermissionPromise = () => {
        if (Platform.Version >= 33) {
            return Promise.all([
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES),
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO),
            ]).then(
            ([hasReadMediaImagesPermission, hasReadMediaVideoPermission]) =>
                hasReadMediaImagesPermission && hasReadMediaVideoPermission,
            );
        } else {
            return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        }
        };
    
        const hasPermission = await getCheckPermissionPromise();
        if (hasPermission) {
        return true;
        }
        const getRequestPermissionPromise = () => {
        if (Platform.Version >= 33) {
            return PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]).then(
            (statuses) =>
                statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
                PermissionsAndroid.RESULTS.GRANTED &&
                statuses[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
                PermissionsAndroid.RESULTS.GRANTED,
            );
        } else {
            return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE).then((status) => status === PermissionsAndroid.RESULTS.GRANTED);
        }
        };
    
        return await getRequestPermissionPromise();
    }
    
    async function savePicture(tag) {
        if (Platform.OS === "android" && !(await hasAndroidPermission())) {
        return;
        }
        CameraRoll.save(tag, {type: 'video'});
    };

    const saveView = async () => {
        try {
            const uri = await captureRef(viewRef, {
                format: 'jpg',
                quality: 0.8,
            });

            const fileName = `climb-share-${Date.now()}.jpg`.replace(':','-');
            let filePath;
            if (Platform.OS === 'android') {
                filePath = `${RNFS.ExternalDirectoryPath}/${fileName}`;
            } else {
                filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            }
            //console.log(uri);
            await RNFS.copyFile(uri, filePath);
            return filePath;
        } catch (error) {
            console.error('Error saving the image: ', error);
        }
    };

    const shareView = async () => {
        try {
            //Firebase analytics on Sharing the Share Item
            analytics().logEvent('Share_Collectible_Pressed', {
                user_id: currentUser.uid,
                timestamp: new Date().toISOString()
            });

            const filePath = await saveView();
            if (filePath) {
                await Share.open({
                    url: `file://${filePath}`,
                    type: 'image/jpeg',
                });
                Toast.show({ type: 'success', text1: 'Image loaded successfully!' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to load image!' });
            console.error('Error sharing the image: ', error);
        }
    };

    const saveImageLocally = async () => {
        try {
            
            //Firebase analytics on Saving the Share Item
            analytics().logEvent('Save_Collectible_Pressed', {
                user_id: currentUser.uid,
                timestamp: new Date().toISOString()
            });

            const filePath = await saveView();
            if (filePath) {
                await savePicture(filePath);
                Toast.show({ type: 'success', text1: 'Image saved successfully!' });
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Failed to save image!' });
            console.error('Error sharing the image: ', error);
        }
    };

    const shareVideo = async () => {
        try {
            // Generate a timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Replace characters that are invalid in filenames
    
            // Define the path to download the file to, including the timestamp
            const localFile = `${RNFS.CachesDirectoryPath}/shared-video-${timestamp}.mp4`;
    
            // Download the file
            const options = {
                fromUrl: currentVideoUrl,
                toFile: localFile,
            };
            await RNFS.downloadFile(options).promise;
    
            // Share the local file
            const shareOptions = {
                url: `file://${localFile}`,
                type: 'video/mp4',
            };
            await Share.open(shareOptions);
        } catch (error) {
            console.error('Error sharing the video file:', error);
        }
    };
    

    return (
        <SafeAreaView style={styles.container}>
                <View style={styles.captureArea} ref={viewRef} collapsable={false}>      
                <View style={styles.idleCard}>
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
                        </View>
                    </View>
                </View>
                </View>
                <View style={{display:'flex', flexDirection:'row', justifyContent: 'space-around', width: '90%'}}>
                    <TouchableOpacity style={styles.shareButton} onPress={saveImageLocally}>
                        <Text style={styles.shareButtonText}>Save Card</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareButton} onPress={shareView}>
                        <Text style={styles.shareButtonText}>Share Card</Text>
                    </TouchableOpacity>
                </View>
                <FlatList
                    data={addedMedia}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => {
                            setCurrentVideoUrl(item);
                            setModalVisible(true);
                        }}>       
                            <View style={{
                                width: videoWidth, // You might want to adjust this for horizontal layout
                                height: videoHeight,
                                backgroundColor: 'black',
                                borderColor: 'black',
                                borderWidth: 0.5,
                                margin: 5, // Add some spacing between items
                            }}>
                                <Video 
                                    source={{ uri: item }} 
                                    style={{ width: '100%', height: '100%' }} 
                                    repeat={true} 
                                    muted={true} 
                                    paused={true}
                                />
                            </View>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal={true} // Enable horizontal scrolling
                    showsHorizontalScrollIndicator={true} // Optionally hide the horizontal scroll indicator
                    style={{margin: 10, backgroundColor: 'rgba(0,0,0,0.1)'}}
                />
                <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <TouchableOpacity
                    style={styles.centeredView}
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(!modalVisible)} // This allows touching outside the modal to close it
                >
                    <View style={styles.modalView} onStartShouldSetResponder={() => true}> 
                        <Video
                            source={{ uri: currentVideoUrl }}
                            style={styles.modalVideo}
                            resizeMode="contain"
                            repeat={true}
                            controls={true}
                            autoplay={true}
                            volume={1.0}
                        />
                        <View style={styles.closeButtonContainer}>
                            <TouchableOpacity
                                style={styles.buttonClose}
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <Text style={styles.textStyle}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TouchableOpacity
                            style={styles.shareButton}
                            onPress={shareVideo} // Implement this function to share the video
                        >
                            <Text style={styles.shareButtonText}>Share Video</Text>
                        </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Add these to your StyleSheet
    shareVideoButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#4CAF50', // Example green color for the share button
        borderRadius: 20,
    },
    shareVideoButtonText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: '#F2F2F2',
    },
    captureArea: {
        width: '90%',
        height: '55%',
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(255,255,255,0.8)',
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
    shareButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#3498db',
        borderRadius: 20,
        width: '40%',
    },
    shareButtonText: {
        color: 'white',
        textAlign: 'center'
    },
    modalView: {
        backgroundColor: "black",
        borderRadius: 20,
        padding: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        height: '80%',
    },
    modalVideo: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    closeButtonContainer: {
        backgroundColor: '#FF6165',
        width: 30,
        height: 30,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -5,
        right: -5,
        zIndex: 2000,
    },
    textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    },
});

export default New_Share;