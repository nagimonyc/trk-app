import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, Image, StyleSheet } from "react-native";
import { AuthContext } from "../../../../Utils/AuthContext"; // Assuming you have an AuthContext for user info
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { create } from "react-test-renderer";

const Notification = () => {
    const { currentUser } = useContext(AuthContext); // Get the current user from context
    const [notifications, setNotifications] = useState([]);

    const loadImageUrl = async (imagePath) => {
        try {
            const url = await storage().ref(imagePath).getDownloadURL();
            return url;
        } catch (error) {
            console.error("Error getting image URL: ", error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('notifications')
            .where('userId', '==', currentUser.uid)
            .onSnapshot(async querySnapshot => {
                // Use Promise.all to wait for all loadImageUrl promises to resolve
                const notificationsWithImages = await Promise.all(querySnapshot.docs.map(async doc => {
                    const data = doc.data();
                    let imageUrl = null; // Default to null if no image is available

                    // Attempt to fetch the image URL if 'image' field is present
                    if (data.image) {
                        try {
                            imageUrl = await loadImageUrl(data.image);
                        } catch (error) {
                            console.error("Error getting image URL: ", error);
                            // Handle error, e.g., by logging or setting a fallback image URL
                        }
                    }

                    // Return a new object for each notification including the fetched imageUrl
                    return {
                        ...data,
                        id: doc.id,
                        imageUrl, // This will be null if there was an error or no image
                    };
                }));

                // Update state once all imageURLs have been fetched
                setNotifications(notificationsWithImages);
            });

        return () => unsubscribe(); // Cleanup on unmount
    }, [currentUser.uid]);

    return (
        <View>
            <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
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
                )}
            />
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
});

export default Notification;