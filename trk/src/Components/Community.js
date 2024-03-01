import React, { useState, useContext, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal} from "react-native";
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


    //Gets Your Media and Media Associated with the Climb!
    useEffect(() => {
        const fetchImageURL = async () => {
            try {
                console.log(climb);
                if (climb && climb.images && climb.images.length > 0) {
                const climbImage = await storage().ref(climb.images[climb.images.length-1].path).getDownloadURL();
                setClimbImageURL(climbImage);
                //Get the last video uploaded by that user for that climb
                const snapshot = await TapsApi().getClimbsByIdUser(tapObj.climb, currentUser.uid);
                if (!snapshot.empty){
                    for (let i = 0; i < snapshot.docs.length; i = i +1) {
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
                <View style={{flex: 1}}>
                    <FlatList
                        data={addedMediaAll}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                            onPress={() => {
                                setCurrentVideoUrl(item);
                                setModalVisible(true);
                            }}
                            >       
                            <View style={{ width: videoWidth, height: videoHeight, backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'black', borderWidth: 0.5}}>
                            <Video source={{ uri: item }} style={{ width: '100%', height: '100%' }} repeat={true} muted={true} />
                            </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3} // Since you want 3 videos per row
                        />
                    {/* Your community view content goes here */}
                </View>
            )}
            {activeTab === 'Mine' && (
                <View style={{flex: 1}}>
                    <FlatList
                        data={addedMedia}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                            onPress={() => {
                                setCurrentVideoUrl(item);
                                setModalVisible(true);
                            }}
                            >       
                            <View style={{ width: videoWidth, height: videoHeight, backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'black', borderWidth: 0.5}}>
                            <Video source={{ uri: item }} style={{ width: '100%', height: '100%' }} repeat={true} muted={true} />
                            </View>
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3} // Since you want 3 videos per row
                        />
                    {/* Your personal view content goes here */}
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
        justifyContent: "center",
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

export default Community;
