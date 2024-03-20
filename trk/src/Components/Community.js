import React, { useState, useContext, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, Alert } from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import TapsApi from "../api/TapsApi";
import ClimbsApi from "../api/ClimbsApi";
import Video from 'react-native-video';
import { ActivityIndicator } from 'react-native-paper';
import storage from '@react-native-firebase/storage';
import { FlatList } from "react-native-gesture-handler";

const Community = ({ route }) => {
    const { currentUser, role } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('Community'); // State to manage active tab

    const data = route.params;
    const { climb, tapId, tapObj } = data;



    const [climbImageUrl, setClimbImageURL] = useState(null);
    const [addedMedia, setAddedMedia] = useState([]);  //Your Media
    const [addedMediaAll, setAddedMediaAll] = useState([]);  //All Media Uploaded

    const { width: deviceWidth } = Dimensions.get('window');
    // Calculate single video width (33.33% of device width)
    const videoWidth = deviceWidth * 0.3333;
    // Calculate video height to maintain a 16:9 aspect ratio
    const videoHeight = videoWidth * (16 / 9);

    const [modalVisible, setModalVisible] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');

    const checkDisabled = (item) => {
        return addedMediaAll.includes(item);
    };

    const [isCurrentVideoPrivate, setIsCurrentVideoPrivate] = useState(!checkDisabled(currentVideoUrl));

    useEffect(() => {
        // Whenever currentVideoUrl or addedMediaAll changes, update isCurrentVideoPrivate
        console.log(!checkDisabled(currentVideoUrl));
        setIsCurrentVideoPrivate(!checkDisabled(currentVideoUrl));
    }, [currentVideoUrl, addedMediaAll]);


    //Gets Your Media and Media Associated with the Climb!
    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                if (climb && climb.images && climb.images.length > 0) {
                    const climbImage = await storage().ref(climb.images[climb.images.length - 1].path).getDownloadURL();
                    setClimbImageURL(climbImage);
                    //Get the last video uploaded by that user for that climb
                    const snapshot = await TapsApi().getClimbsByIdUser(tapObj.climb, currentUser.uid);
                    if (!snapshot.empty) {
                        for (let i = 0; i < snapshot.docs.length; i = i + 1) {
                            let temp = snapshot.docs[i].data();
                            if (temp.videos && temp.videos.length > 0) {
                                setAddedMedia(prev => prev.concat(temp.videos));
                            }
                        }
                    }
                    //Get All Videos Associated with that Climb (COMMUNITY)
                    const climbObj = (await ClimbsApi().getClimb(tapObj.climb)).data();
                    if (climbObj && climbObj.videos && climbObj.videos.length > 0) {
                        setAddedMediaAll(climbObj.videos);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch image URL:', error);
            }
        };

        fetchImageURL();
    }, [climb]);

    const makeVideoPrivate = (videoUrl) => {
        Alert.alert(
            "Make Video Private",
            "Are you sure you want to make this video private?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Cancel Pressed"),
                    style: "cancel"
                },
                {
                    text: "Yes", onPress: () => {
                        (async () => {
                            try {
                                // Filter out the videoUrl from addedMediaAll
                                const updatedMedia = addedMediaAll.filter(item => item !== videoUrl);
                                setAddedMediaAll(updatedMedia);
                                //Remove from Server
                                const climbObj = await ClimbsApi().getClimb(tapObj.climb).then(response => response.data());
                                if (climbObj && climbObj.videos) {
                                    const updatedVideos = climbObj.videos.filter(item => item !== videoUrl);
                                    const newClimb = { videos: updatedVideos }
                                    // Assuming you have a method to update the climb object with the new videos array
                                    await ClimbsApi().updateClimb(tapObj.climb, newClimb);
                                }
                                setModalVisible(false);
                            } catch (error) {
                                console.error("Failed to make video private:", error);
                                // Optionally, handle the error with user feedback
                                setIsCurrentVideoPrivate(false);
                            }
                        })();
                    }
                }
            ]
        );
    };

    /*const [itemsPerPage, setItemsPerPage] = useState(8);
    const fetchData = async () => {
        // Example logic for fetching next chunk of data
        setItemsPerPage(prev => prev+1);
    };*/
    //OLD PAGINATION LOGIC (CAN IMPLEMENT LATER)

    return (
        <SafeAreaView style={styles.container}>
            {/* Tab Headers */}
            <View style={styles.tabHeader}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Community' && styles.activeTab]}
                    onPress={() => setActiveTab('Community')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'Community' && styles.activeTabText]}>Community</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'Mine' && styles.activeTab]}
                    onPress={() => setActiveTab('Mine')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'Mine' && styles.activeTabText]}>Mine</Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'Community' && (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={addedMediaAll}
                        renderItem={({ item }) => {
                            // Determine if the item is an object (new format) or just a string (old format)
                            const isObject = typeof item === 'object' && item !== null && item.url;
                            const videoUrl = isObject ? item.url : item; // Use item.url if object, else use item directly
                            const videoRole = isObject ? item.role : ''; // Default to empty string if not available
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        setCurrentVideoUrl(videoUrl);
                                        setModalVisible(true);
                                    }}
                                >
                                    <View style={{ width: videoWidth, height: videoHeight, backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'black', borderWidth: 0.5, position: 'relative' }}>
                                        {/* Conditional rendering based on role */}
                                        {videoRole == "setter" && (
                                            <Text style={[styles.videoLabel]}>
                                                {videoRole.charAt(0).toUpperCase() + videoRole.slice(1)}'s Video
                                            </Text>
                                        )}
                                        <Video source={{ uri: videoUrl }} style={{ width: '100%', height: '100%' }} repeat={false} muted={true} />
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3} // Since you want 3 videos per row
                    />
                    {/* Your community view content goes here */}
                </View>
            )}
            {activeTab === 'Mine' && (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={addedMedia}
                        renderItem={({ item }) => {
                            const videoUrl = item; // Assuming 'item' is the URL for the video in the older code structure
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        // Play the video if it's currently paused, otherwise pause it
                                        setCurrentVideoUrl(currentVideoUrl === videoUrl ? '' : videoUrl);
                                    }}
                                    style={{ width: videoWidth, height: videoHeight, backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'black', borderWidth: 0.5 }}
                                >
                                    <Video
                                        source={{ uri: videoUrl }}
                                        style={{ width: '100%', height: '100%' }}
                                        resizeMode="cover"
                                        repeat={true}
                                        muted={true}
                                        paused={currentVideoUrl !== videoUrl} // Pause the video if it's not the current one
                                    />
                                </TouchableOpacity>
                            );
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3} // 3 videos per row as per your original setup
                    />
                </View>
            )}
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
                        {activeTab === 'Mine' && (
                            <TouchableOpacity
                                style={[styles.shareButton, isCurrentVideoPrivate && styles.shareButtonDisabled]}
                                onPress={() => makeVideoPrivate(currentVideoUrl)}
                                disabled={isCurrentVideoPrivate}
                            >
                                <Text style={[styles.shareButtonText, isCurrentVideoPrivate && styles.shareButtonTextDisabled]}>
                                    Make Private
                                </Text>
                            </TouchableOpacity>)}

                        <View style={styles.closeButtonContainer}>
                            <TouchableOpacity
                                style={styles.buttonClose}
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <Text style={styles.textStyle}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    shareButton: {
        marginTop: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#3498db',
        borderRadius: 20,
        width: '50%',
    },
    shareButtonDisabled: {
        backgroundColor: '#bdc3c7', // Disabled button color, e.g., a shade of gray
    },
    shareButtonText: {
        color: 'white', // Original text color
        textAlign: 'center',
    },
    shareButtonTextDisabled: {
        color: '#7f8c8d', // Disabled text color, e.g., a darker shade of gray
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    tabHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 0,
        backgroundColor: 'white',
        borderTopWidth: 0.5,
        borderTopColor: 'black'
    },
    tabButton: {
        paddingVertical: 15,
        flex: 1, // Ensure the buttons are equally spaced
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent', // Default non-active color
    },
    activeTab: {
        borderBottomColor: '#fe8100', // Active tab underline color
    },
    tabButtonText: {
        color: 'grey',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fe8100', // Active tab text color
    },
    // Keep your existing styles as they are
    centeredView: {
        flex: 1,
        justifyContent: "flex-start",
        paddingTop: 80,
        alignItems: "center",
        backgroundColor: 'rgba(255,255,255,0.8)',
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
        height: '85%',
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
    videoLabel: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(238, 135, 51, 1)',
        color: 'white',
        fontSize: 10,
        padding: 2,
        fontWeight: 500,
        zIndex: 1, // Try increasing this if the label is not appearing on top.
    },
    // #EE8733
});

export default Community;
