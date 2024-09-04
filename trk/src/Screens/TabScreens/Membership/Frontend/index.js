import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import ImagePicker from 'react-native-image-crop-picker';
import storage from '@react-native-firebase/storage';
import { AuthContext } from "../../../../Utils/AuthContext";
import UsersApi from "../../../../api/UsersApi";
import { Marquee } from "@animatereactnative/marquee";
import { useRoute } from '@react-navigation/native';


const Membership = ({ route }) => {
    const gymName = route?.params?.gymName || null;
    const [user, setUser] = useState(null);
    const { currentUser } = useContext(AuthContext);
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const fullName = currentUser ? (currentUser.firstName ? currentUser.firstName + ' ' + currentUser.lastName : '') : '';
    const [currentTime, setCurrentTime] = useState(new Date()); // State for current time


    useEffect(() => {
        if (currentUser) {
            const fetchUserDetails = async () => {
                try {
                    const { getUsersBySomeField } = UsersApi();
                    const userData = await getUsersBySomeField('uid', currentUser.uid);
                    if (userData && userData.docs.length > 0) {
                        const userDoc = userData.docs[0].data();
                        setUser(userDoc);
                        if (userDoc.image && userDoc.image.length > 0) {
                            fetchImageURL(userDoc.image[0].path);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user details: ", error);
                }
            };
            fetchUserDetails();
        }
    }, [currentUser]);

    const fetchImageURL = async (imagePath) => {
        if (imagePath) {
            try {
                const url = await storage().ref(imagePath).getDownloadURL();
                setClimbImageUrl(url);
            } catch (error) {
                console.error("Error getting image URL: ", error);
            }
        }
    };

    const handleTakePhoto = async () => {
        try {
            const image = await ImagePicker.openCamera({
                width: 300,
                height: 400,
                cropping: true,
                compressImageQuality: 0.7
            });
            if (image) {
                const uploadResult = await uploadImage(image.path);
                UsersApi().updateUser(currentUser.uid, { image: [uploadResult] });
                fetchImageURL(uploadResult.path);
            }
        } catch (error) {
            if (error.code !== 'E_PICKER_CANCELLED') {
                Alert.alert("Error", "Failed to take photo: " + error.message);
            }
        }
    };

    const uploadImage = async (imagePath) => {
        const filename = imagePath.split('/').pop().replace(/\.jpg/gi, "").replace(/-/g, "");
        const storageRef = storage().ref(`climb_images/${filename}`);
        await storageRef.putFile(imagePath);
        return { id: filename, path: storageRef.fullPath, timestamp: new Date().toISOString() };
    };


    // Select the image based on the gym name
    const getGymImage = (gymName) => {
        switch (gymName) {
            case 'MetroRock':
                return require('../../../../../assets/MetroRock-logo.png');
            case 'Bouldering Project':
                return require('../../../../../assets/logo-bp-2.png');
            case 'Brooklyn Boulders':
                return require('../../../../../assets/BKB-logo.png');
            case 'GP81':
                return require('../../../../../assets/GP81-logo.png');
            case 'Island Rock':
                return require('../../../../../assets/islandRock-logo.png');
            case 'Test':
                return require('../../../../../assets/islandRock-logo.png');
            default:
                return require('../../../../../assets/GP81-logo.png'); // Default image if gymName doesn't match
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date()); // Update time every second
        }, 1000);

        return () => clearInterval(timer); // Clean up the interval on component unmount
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 20, marginTop: 25 }}>
                {user && user.isMember ? (
                    <LinearGradient
                        colors={['#FFFFFF', '#FF8100']} // White to orange gradient
                        style={styles.gradientStyle}
                    >
                        <Marquee spacing={20} speed={0.5} style={{ width: '100%', marginVertical: 5, height: 50, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'space-around', width: 400 }}>
                                {/* First Image */}
                                <Image
                                    source={require('../../../../../assets/long-logo.png')}
                                    style={{ width: '33.3%', height: '100%', alignSelf: 'center' }} // Flexible width, adjusts to fill available space
                                    resizeMode="contain"
                                />

                                {/* Second Image */}
                                <Image
                                    source={getGymImage(gymName)}
                                    style={{ width: '33.3%', height: '100%' }} // Flexible width, adjusts to fill available space
                                    resizeMode="contain"
                                />
                                {/* Text */}
                                {/* Time with seconds */}
                                <Text style={{ width: '33.3%', fontSize: 16, color: 'black', fontWeight: '600', textAlign: 'center' }}>
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </Text>
                            </View>
                        </Marquee>
                        <View style={{
                            width: '70%',
                            height: '60%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 10,
                            backgroundColor: climbImageUrl ? 'transparent' : 'white'
                        }}>
                            {climbImageUrl ? (
                                <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <TouchableOpacity onPress={handleTakePhoto} style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: 'white' }}>
                                    <View style={{ position: 'relative', width: 75, height: 75 }}>
                                        <Image source={require('../../../../../assets/user_box.png')} style={{ width: '100%', height: '100%' }} />
                                        <View style={{ position: 'absolute', top: -30, right: -20, width: 25, height: 25 }}>
                                            <Image source={require('../../../../../assets/info_icon.png')} style={{ width: '100%', height: '100%' }} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={{
                            color: 'black',
                            fontSize: 28,
                            fontWeight: 'bold',
                            marginTop: 15,
                        }}>{fullName}</Text>
                        {user.isMember && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#397538', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>MEMBER</Text>
                            </View>
                        )}
                        {!user.isMember && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#FF8100', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>NOT A MEMBER</Text>
                            </View>
                        )}
                    </LinearGradient>
                ) : (
                    <View style={{
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        width: '90%',
                        height: '85%',
                        backgroundColor: '#CACACA',
                        borderRadius: 20,
                        flexDirection: 'column'
                    }}>
                        <View style={{ width: '100%', alignItems: 'center', backgroundColor: 'transparent' }}>
                            <Image
                                source={require('../../../../../assets/long-logo.png')}
                                style={{ width: '40%', height: undefined, aspectRatio: 5, marginTop: 10, marginBottom: 20 }} // Adjust the aspectRatio according to your logo's aspect ratio
                                resizeMode="contain"
                            />
                        </View>
                        <View style={{
                            width: '60%',
                            height: '60%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 10,
                            backgroundColor: climbImageUrl ? 'transparent' : 'white'
                        }}>
                            {climbImageUrl ? (
                                <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <TouchableOpacity onPress={handleTakePhoto} style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: 'white' }}>
                                    <View style={{ position: 'relative', width: 75, height: 75 }}>
                                        <Image source={require('../../../../../assets/user_box.png')} style={{ width: '100%', height: '100%' }} />
                                        <View style={{ position: 'absolute', top: -30, right: -20, width: 25, height: 25 }}>
                                            <Image source={require('../../../../../assets/info_icon.png')} style={{ width: '100%', height: '100%' }} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={{
                            color: 'black',
                            fontSize: 20,
                            fontWeight: 'bold',
                            marginTop: 15,
                        }}>{user ? fullName : ''}</Text>
                        {user && user.isMember && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#397538', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>MEMBER</Text>
                            </View>)}
                        {(!user || !user.isMember) && (
                            <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#FF8100', width: '60%', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20, }}>NOT A MEMBER</Text>
                            </View>)}
                    </View>
                )}
                {!climbImageUrl && (
                    <TouchableOpacity onPress={handleTakePhoto} style={{ padding: 10, backgroundColor: '#FF8100', borderRadius: 5, marginTop: 30 }}>
                        <Text style={{ color: 'white' }}>Add photo to unlock membership</Text>
                    </TouchableOpacity>
                )}
                {climbImageUrl && user && user.isMember && (
                    <View style={{ padding: 10, borderRadius: 5, marginTop: 15, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../../../../assets/zondicons_information-solid.png')} style={{ width: 20, height: 20 }} />
                        <Text style={{ color: 'black', marginLeft: 10 }}>Show membership to staff</Text>
                    </View>
                )}
                {climbImageUrl && (!user || !user.isMember) && (
                    <View style={{ padding: 10, borderRadius: 5, marginTop: 15, flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                        <Image source={require('../../../../../assets/zondicons_information-solid.png')} style={{ width: 20, height: 20 }} />
                        <Text style={{ color: 'black', marginLeft: 10 }}>Purchase Membership to Activate Card</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    gradientStyle: {
        width: '100%',
        height: '85%',
        borderRadius: 20,
        flexDirection: 'column',
        // padding: 20,
        alignItems: 'center',
    }
});

export default Membership;
