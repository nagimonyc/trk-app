import React, { useState, useEffect, useContext} from "react";
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, View, Text, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import GymsApi from "../../../../api/GymsApi";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from "../../../../Utils/AuthContext";
import UsersApi from "../../../../api/UsersApi";
import storage from '@react-native-firebase/storage';
import { Image, StyleSheet } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { launchCamera } from 'react-native-image-picker';
import { Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const Membership = () => {
    const [gyms, setGyms] = useState([]);
    const [selectedGymId, setSelectedGymId] = useState(null);
    const [openGymsDropdown, setOpenGymsDropdown] = useState(false);
    const [user, setUser] = useState(null);
    const {currentUser } = useContext(AuthContext);
    const [climbImageUrl, setClimbImageUrl] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    await fetchImageURL(); // Your additional async function
                    //await handleClimbHistory();
                    // await handleTapHistory();
                } catch (error) {
                    console.error('Error during focus effect:', error);
                }
            };

            fetchData();
        }, [])
    );
    
    useEffect(() => {
        const loadImages = async () => {
            try {
                // Default image path
                let climbImageURL = null;
                if (user && user.image && user.image.length > 0) {
                    //Implement image fetch logic
                    climbImageURL = user.image[0].path;
                }
                if (climbImageURL) {
                    const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
                    setClimbImageUrl(loadedClimbImageUrl);
                    //console.log(loadedClimbImageUrl);
                }
            } catch (error) {
                console.error("Error loading images: ", error);
            }
        };
        loadImages();
    }, [user]);

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

    //Gets Your Media and Media Associated with the Climb!
    const fetchImageURL = async () => {
        try {
            if (currentUser) {
                //To get User information, retained as is
                //Get username first
                const { getUsersBySomeField } = UsersApi();
                let user = (await getUsersBySomeField('uid', currentUser.uid));
                if (user) {
                    setUser(user.docs[0].data());
                }
                //console.log('User: ', user.docs[0].data());
                // //Get all taps made by the user (non-archived) and fetched videos from within that tap
                // const userObj = (await UsersApi().getUsersBySomeField("uid", currentUser.uid)).docs[0].data(); //Using the Videos associated with the user Object
                // if (userObj && userObj.videos && userObj.videos.length > 0) {
                //     setAddedMedia(userObj.videos);
                // }
            }
            else {
                Alert.alert("Error", "There is no current User!");
                return;
            }
        } catch (error) {
            console.error('Failed to fetch image URL:', error);
        }
    };

    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const gymSnapshot = await GymsApi().fetchGyms();
                const gymOptions = gymSnapshot.map(doc => ({
                    label: doc.data().Name,
                    value: doc.id
                }));
                const cachedGym = await AsyncStorage.getItem('gymId');
                const defaultGym = gymOptions.find(gym => gym.label === "Movement Gowanus");

                setGyms(gymOptions);

                if (cachedGym) {
                    let gymId = String(JSON.parse(cachedGym)).trim();
                    setSelectedGymId(gymId);
                } else if (defaultGym) {
                    setSelectedGymId(defaultGym.value);
                }
            } catch (error) {
                console.error('Failed to fetch gyms:', error);
            }
        };

        fetchGyms();
    }, []);

    const closeDropdown = () => {
        setOpenGymsDropdown(false);
    };
    /*
    return (
        <TouchableWithoutFeedback onPress={closeDropdown}>
            <SafeAreaView style={{ flex: 1, marginHorizontal: 15 }}>
                <View style={{ marginTop: 30 }}>
                    <Text style={{ fontWeight: '700', fontSize: 28, color: 'black'}}>
                        Select a gym
                    </Text>
                </View>
                <DropDownPicker
                    open={openGymsDropdown}
                    value={selectedGymId}
                    items={gyms}
                    setOpen={setOpenGymsDropdown}
                    setValue={setSelectedGymId}
                    setItems={setGyms}
                    zIndex={3000}
                    zIndexInverse={1000}
                    containerStyle={{ height: 40, marginTop: 10 }}
                    style={{ backgroundColor: '#fafafa' }}
                    dropDownContainerStyle={{ backgroundColor: '#fafafa' }}
                />
                <View style={{ flex: 1 }}>
                //Spacer View 
                </View>
                <TouchableOpacity style={{ backgroundColor: '#FF8100', height: 70, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 60, marginHorizontal: 25 }}>
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 20 }}>ACTIVATE TAG</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
    */

    const requestCameraPermission = async () => {
        const permission = Platform.OS === 'ios' ? 
            PERMISSIONS.IOS.CAMERA :
            PERMISSIONS.ANDROID.CAMERA;

        try {
            const result = await check(permission);
            if (result === RESULTS.GRANTED) return true;

            const requestResult = await request(permission);
            return requestResult === RESULTS.GRANTED;
        } catch (error) {
            console.log(error);
            return false;
        }
    };

    const uploadImage = async (imagePath) => {
        const filename = imagePath.split('/').pop().replace(/\.jpg/gi, "").replace(/-/g, "");
        const storageRef = storage().ref(`climb_images/${filename}`);
        await storageRef.putFile(imagePath);
        return { id: filename, path: storageRef.fullPath, timestamp: new Date().toISOString() };
    };

    const uploadSelfie = async () => {
        const hasPermission = await requestCameraPermission();

        if (hasPermission) {
            const options = {
                saveToPhotos: true,
                mediaType: 'photo',
                includeBase64: false,
            };

            launchCamera(options, async (response) => {
                if (response.didCancel) {
                    console.log('User cancelled camera picker');
                } else if (response.error) {
                    console.log('CameraPicker Error: ', response.error);
                } else {
                    // Ensure the assets array exists and has at least one item
                    if (response.assets && response.assets.length > 0) {
                        const source = { uri: response.assets[0].uri };
                        setClimbImageUrl(response.assets[0].uri);
                        //console.log(source);
                        try {
                            const uploadedImage = await uploadImage(response.assets[0].uri);
                            await UsersApi().updateUser(currentUser.uid, { image: [uploadedImage] });
                            //console.log('Profile Pic updated for: ', currentUser.id);
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Error", "Couldn't update profile picture.");
                            return;
                        }
                    } else {
                        console.log('No assets found in response');
                    }
                }                
            });
        } else {
            Alert.alert('Permissions not granted', 'Camera permission is required to take a photo.');
        }
    };

    return (
        <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 20, marginTop: 40 }}>
            {user && user.paid ? (
                <LinearGradient
                    colors={['#FFFFFF', '#FF8100']} // White to orange gradient
                    style={styles.gradientStyle}
                >
                    <View style={{ width: '100%', alignItems: 'center', backgroundColor: 'transparent' }}>
                <Image
                    source={require('../../../../../assets/long-logo.png')}
                    style={{ width: '40%', height: undefined, aspectRatio: 5, marginTop: 10, marginBottom: 20}} // Adjust the aspectRatio according to your logo's aspect ratio
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
                    <TouchableOpacity onPress={uploadSelfie} style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: 'white'}}>
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
                }}>{user ? user.username : 'No User'}</Text>
                {user && user.paid && (
                <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#397538', width: '60%', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20,}}>MEMBER</Text>
                </View>)}
                {(!user || !user.paid) && (
                <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#FF8100', width: '60%', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20,}}>NOT A MEMBER</Text>
                </View>)}
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
                    style={{ width: '40%', height: undefined, aspectRatio: 5, marginTop: 10, marginBottom: 20}} // Adjust the aspectRatio according to your logo's aspect ratio
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
                    <TouchableOpacity onPress={uploadSelfie} style={{ justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', backgroundColor: 'white'}}>
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
                }}>{user ? user.username : 'No User'}</Text>
                {user && user.paid && (
                <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#397538', width: '60%', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20,}}>MEMBER</Text>
                </View>)}
                {(!user || !user.paid) && (
                <View style={{ padding: 15, borderRadius: 5, marginTop: 15, backgroundColor: '#FF8100', width: '60%', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20,}}>NOT A MEMBER</Text>
                </View>)}
                </View>
            )}
            {!climbImageUrl && (
                <TouchableOpacity onPress={uploadSelfie} style={{ padding: 10, backgroundColor: '#FF8100', borderRadius: 5, marginTop: 30 }}>
                <Text style={{ color: 'white' }}>Add photo to unlock membership</Text>
                </TouchableOpacity>
            )}
            {climbImageUrl && (
                <View style={{ padding: 10, borderRadius: 5, marginTop: 30 }}>
                <Text style={{ color: 'black' }}>Show membership to staff</Text>
                </View>
            )}
        </View>

    );
}

const styles = StyleSheet.create({
    gradientStyle: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        width: '90%',
        height: '85%',
        borderRadius: 20,
        flexDirection: 'column'
    },
});

export default Membership;