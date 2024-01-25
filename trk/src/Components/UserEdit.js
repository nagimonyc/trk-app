import React, { useState, useContext, useEffect, useRef } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from "react-native";
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from "../Utils/AuthContext";
import { useNavigation } from '@react-navigation/native';
import storage from '@react-native-firebase/storage';
import ListItemSessions from "./ListItemSessions";
import { Image } from "react-native";
import ClimbItem from "./ClimbItem";
import ListHistory from "./ListHistory";
import { FlatList } from "react-native-gesture-handler";
import { ActivityIndicator } from "react-native-paper";
import {Modal} from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import TapsApi from "../api/TapsApi";
import ImagePicker from 'react-native-image-crop-picker';
import { Line, Svg } from "react-native-svg";
import UsersApi from "../api/UsersApi";

const UserEdit = ({route}) => {
    const navigation = useNavigation();
    //let data = route.params.data;
    //const title = route.params.title;
    const {currentUser, role} = useContext(AuthContext);
    const [user, setUser] = useState(route.params.user);

    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const [initialImagePath, setInitialImagePath] = useState(null);
    const [initialUsername, setInitialUsername] = useState((currentUser.username? currentUser.username: currentUser.email.split('@')[0]));
    const [username, setUsername] = useState((currentUser.username? currentUser.username: currentUser.email.split('@')[0]));
    console.log('The initial username is: ', initialUsername);

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
    
    //When the data loads, fetches the image of the latest climb to display for the session
    useEffect(() => {
        const loadImages = async () => {
          try {
            // Default image path
            let climbImageURL = 'climb photos/the_crag.png';
            if (user && user.image && user.image.length > 0) {
                //Implement image fetch logic
                climbImageURL = user.image[0].path;
            }
            const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
            setClimbImageUrl(loadedClimbImageUrl);
            setInitialImagePath(loadedClimbImageUrl);
          } catch (error) {
            console.error("Error loading images: ", error);
          }
        };
       loadImages();
    }, [currentUser]);

    const UpdateButton = ({ onPress }) => {
        return (
            <TouchableOpacity style={{width: '100%', backgroundColor: '#3498db', borderRadius: 10, display: 'flex', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center'}} onPress={onPress}>
                <Text style={{color: 'white', fontSize: 15, textAlign: 'center'}}>Update Profile</Text>
            </TouchableOpacity>
        );
    };

    const uploadImage = async (imagePath) => {
        const filename = imagePath.split('/').pop().replace(/\.jpg/gi, "").replace(/-/g, "");
        const storageRef = storage().ref(`climb_images/${filename}`);
        await storageRef.putFile(imagePath);
        return { id: filename, path: storageRef.fullPath, timestamp: new Date().toISOString() };
    };

    const selectImageLogic = async () => {
        console.log("handleImagePick called");
        try {
        const pickedImage = await ImagePicker.openPicker({
            width: 200,
            height: 200,
            cropping: true,
        });

        // Save the full image path for later uploading
        const imagePath = pickedImage.path;

        // Set the image state to include the full path
        setClimbImageUrl(imagePath);

        } catch (err) {
        console.error("Error picking image:", err);
        }
    };


    const handleUpdateProfile = () => {
        Alert.alert(
            "Confirm Update",
            "Are you sure you want to update your profile?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Update cancelled"),
                    style: "cancel"
                },
                { 
                    text: "OK", 
                    onPress: () => updateProfile() 
                }
            ],
            { cancelable: false }
        );
    };
    
    const updateProfile = async () => {
        console.log('Initial image path: ', initialImagePath);
        console.log('Updated image path: ', climbImageUrl);
        console.log('Updating Profile for user: ', currentUser.uid);
        try {
            // Logic to update the session
            if (initialUsername !== username) {
                //Simple rules for username
                if (username.trim() === '' || username.trim().indexOf(' ') >= 0) {
                    Alert.alert("Error", "Username cannot be empty or have a whitespace!");
                    return;
                }
                let snapshot = (await UsersApi().getUsersBySomeField('username', username.trim()));
                if (snapshot.docs.length > 0) {
                    Alert.alert("Error", "Username already in use!");
                    return;
                }
                try {
                    await UsersApi().updateUser(currentUser.uid, {username: username.trim()});
                    setInitialUsername(username);
                } catch (error) {
                    console.error(error);
                    Alert.alert("Error", "Couldn't update profile.");
                    return;
                }
            }
            if (initialImagePath !== '' && initialImagePath !== climbImageUrl) {
                try {
                    const uploadedImage = await uploadImage(climbImageUrl);
                    await UsersApi().updateUser(currentUser.uid, {image: [uploadedImage]});
                    console.log('Profile Pic updated for: ', currentUser.id);
                    setInitialImagePath(climbImageUrl);
                } catch (error) {
                    console.error(error);
                    Alert.alert("Error", "Couldn't update profile picture.");
                    return;
                }
            }
            Alert.alert("Success", "Profile updated!");
            console.log("Session updated");
            navigation.popToTop();
        } catch (error) {
            console.log('Error: ', error);
            Alert.alert("Error", "Profile could not be updated!");
        }
    };


  return (
    <SafeAreaView style={{flex: 1}}>
        <View style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: 1}}>
        <View style={{display: 'flex', flexDirection: 'column', padding: 10, flex: 1, width:'100%'}}>
            <View style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <View style={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: 10, padding: 10 }}>
                    <View style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '60%', padding: 20, justifyContent: 'center', alignItems: 'center', borderBottomColor: 'black', borderBottomWidth: 0.5, borderRadius: 0, width: '100%'}}>
                        {climbImageUrl ? (
                            <View style={{ position: 'relative' }}>
                                <TouchableOpacity onPress={selectImageLogic}>
                                    <Image source={{ uri: climbImageUrl }} style={{ width: 75, height: 75, borderRadius: 50}} />
                                    <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'white', borderRadius: 50, padding: 5, borderWidth: 0.5, borderColor:'black' }}>
                                    <Icon name="edit" size={20} color="black" />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : <ActivityIndicator color="#3498db" />}
                    </View>
                    <View style={{display:'flex', flexDirection: 'row', height:'20%', width: '100%', padding: 10, justifyContent: 'center', alignItems: 'flex-start'}}>
                        <View style={{color: 'black', display: 'flex', width: '25%', height: '100%', justifyContent: 'center', alignItems: 'flex-start'}}><Text style={{fontSize: 13, color: 'black'}}>Email</Text></View>
                        <View style={{display :'flex', width: '75%', fontSize: 13, color: 'black', height: '100%', justifyContent: 'center', paddingLeft: 20}}><Text style={{color: 'black'}}>{currentUser.email}</Text></View>
                    </View>
                    <View style={{display:'flex', flexDirection: 'row', height:'20%', width: '100%', padding: 10, justifyContent: 'center', alignItems: 'flex-start'}}>
                        <View style={{color: 'black', display: 'flex', width: '25%', height: '100%', justifyContent: 'center', alignItems: 'flex-start'}}><Text style={{fontSize: 13, color: 'black'}}>Username</Text></View>
                        <TextInput style={{display :'flex', width: '75%', fontSize: 13, color: 'black', height: '100%', justifyContent: 'center', paddingLeft: 20}} placeholderTextColor="black" defaultValue={(user && user.username? user.username: '')} autoFocus={true} onChangeText={(text) => {setUsername(text.trim())}}></TextInput>
                    </View>
                </View>
            </View>
        </View>
        <View style={{justifyContent: 'center', alignItems: 'center', padding: 10, width: '100%', paddingHorizontal: 10, backgroundColor: 'white'}}>
            <UpdateButton onPress={handleUpdateProfile}/>
        </View>
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
});

export default UserEdit;