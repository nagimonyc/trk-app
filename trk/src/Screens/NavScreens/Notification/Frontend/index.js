import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Modal } from "react-native";
import Video from 'react-native-video';
import { AuthContext } from "../../../../Utils/AuthContext"; // Assuming you have an AuthContext for user info
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { create } from "react-test-renderer";

const Notification = () => {
    const { currentUser } = useContext(AuthContext);
    const [notifications, setNotifications] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');

    const loadImageUrl = async (imagePath) => {
        try {
            const url = await storage().ref(imagePath).getDownloadURL();
            return url;
        } catch (error) {
            console.error("Error getting image URL: ", error);
            throw error;
        }
    };

    const loadVideoUrl = async (videoUrl) => {
        try {
            // Directly use the video URL if it's a complete link
            if (videoUrl.startsWith("https://")) {
                setVideoUrl(videoUrl);
                setModalVisible(true);
            } else {
                // Fallback to fetching from Firebase Storage if necessary
                const url = await storage().ref(videoUrl).getDownloadURL();
                setVideoUrl(url);
                setModalVisible(true);
            }
        } catch (error) {
            console.error("Error setting video URL: ", error);
        }
    };


    useEffect(() => {
        const unsubscribe = firestore()
            .collection('notifications')
            .where('userId', '==', currentUser.uid)
            .onSnapshot(async querySnapshot => {
                const notificationsWithMedia = await Promise.all(querySnapshot.docs.map(async doc => {
                    const data = doc.data();
                    const imageUrl = data.image ? await loadImageUrl(data.image) : null;
                    return { ...data, id: doc.id, imageUrl }; // No need to load video URL here
                }));
                setNotifications(notificationsWithMedia);
            });

        return () => unsubscribe();
    }, [currentUser.uid]);

    return (
        <View>
            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => { loadVideoUrl(item.video) }}>
                        <View style={{ height: 120, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'lightgray' }}>
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} style={[styles.climbNoBg, { width: 60, height: 60 }]} />
                                ) : (
                                    // Display a placeholder or nothing if there's no image
                                    <View style={{ width: 60, height: 60, backgroundColor: 'red' }}></View>
                                )}
                            </View>
                            <View style={{ flex: 3, justifyContent: 'center' }}>
                                <Text style={{ fontWeight: 500 }}>{item.title}</Text>
                                <Text style={{}}>{item.body} <Text style={{ fontWeight: 700 }}>{item.username}</Text></Text>
                                <Text>{item.timestamp.toDate().toLocaleString('en-US', {
                                    weekday: 'short', // long, short, narrow
                                    year: 'numeric', // numeric, 2-digit
                                    month: 'long', // numeric, 2-digit, long, short, narrow
                                    day: 'numeric', // numeric, 2-digit
                                    hour: 'numeric', // numeric, 2-digit
                                    minute: 'numeric', // numeric, 2-digit
                                    hour12: true // Use 12 or 24 hour format
                                })}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                )}
            />
            <Modal
                animationType="slide"
                transparent={false}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContent}>
                    <Video
                        source={{ uri: videoUrl }}
                        style={styles.fullScreenVideo}
                        controls
                        resizeMode="contain"
                        autoplay={true}
                    />
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View >
    );
}
const styles = StyleSheet.create({
    climbNoBg: {
        width: 120,
        height: 130,
        borderRadius: 10,
        borderColor: '#DEDEDE',
        borderWidth: 1,
        justifyContent: 'center',
    },
    videoContainer: {
        width: 110, // Adjust based on your layout
        height: 200, // Adjust for a 16:9 aspect ratio
        margin: 5,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    notificationItem: {
        height: 120,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'lightgray',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 10,
    },
    imagePlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: 'red',
    },
    textContainer: {
        flex: 3,
        justifyContent: 'center',
    },
    title: {
        fontWeight: '500',
    },
    username: {
        fontWeight: '700',
    },
    modalContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenVideo: {
        width: '100%',
        height: '80%',
    },
    closeButton: {
        marginTop: 20,
    },
    closeButtonText: {
        color: '#000',
        fontSize: 18,
    },
});

export default Notification;