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
import {Modal, Portal} from "react-native-paper";
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import TapsApi from "../api/TapsApi";
import ImagePicker from 'react-native-image-crop-picker';
import UsersApi from "../api/UsersApi";
import { Camera, useCameraDevice, useCodeScanner } from "react-native-vision-camera";
import UserSearch from "./UserSearch";
import ClimbsApi from "../api/ClimbsApi";
import SessionsApi from "../api/SessionsApi";

//UPDATED TO MAKE CHANGES TO THE SESSION OBJECT INSTEAD OF TAP OBJECTS
const EditSession = ({route}) => {
    const navigation = useNavigation();
    let data = route.params.data;
    let climbs = route.params.climbs;
    if (!data || !climbs || (climbs && climbs.length == 0)) {
      return;
    }
    const tapIdRef = useRef(null);
    const allImages = (data.sessionImages? data.sessionImages: []);
    const [initialText, setInitialText] = useState('');

    const [selectedData, setSelectedData] = useState(null); //The tap object of the featured Climb (UNUSED)
    
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const { currentUser } = useContext(AuthContext);
   
    const [taggedWithImages, setTaggedWithImages] = useState(null); //UNUSED FOR NOW
    
    const [tagged, setTagged] = useState(null);
  
    const [selectedTapId, setSelectedTapId] = useState(tapIdRef.current);
    const [initallySelected, setInitiallySelected] = useState(tapIdRef.current);

    const [sessionTitle, setSessionTitle] = useState(initialText);

    const [initialImagePath, setInitialImagePath] = useState('');
    const [user, setUser] = useState(null);
  
    // State for modal visibility
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalVisibleText, setIsModalVisibleText] = useState(false);

    const [activeQR, setActiveQR] = useState(null);
    const lastScannedCodeRef = useRef(null);

    const device = useCameraDevice('back');

    // Function to open the modal
    const openModal = () => {
            //console.log('Modal Opened!');
        setIsModalVisible(true);
    };

    // Function to close the modal
    const closeModal = () => {
        setIsModalVisible(false);
    };


    const openModalText = () => {
    //console.log('Modal Opened!');
    setIsModalVisibleText(true);
    };

    // Function to close the modal
    const closeModalText = () => {
    setIsModalVisibleText(false);
    };
    
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
    
    
    //Time stamp formatting like Home Page for clarity (Altered ClimbItem to match)
    const timeStampFormatting = (timestamp) => {
        let tempTimestamp = null;
        if (timestamp.toDate) { // Convert Firebase Timestamp to JavaScript Date
            tempTimestamp = timestamp.toDate().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York' // NEW YORK TIME
            });
        }
        return tempTimestamp;
    };

    const handleImageFetch = async () => {
        if (data.name && data.name.trim() !== '') {
            setInitialText(data.name);
            setSessionTitle(data.name);
        }
        const tagged = (data.taggedUsers? data.taggedUsers: []);
        let combinedUsers = [];
        for (const searchQuery of tagged) {
            // Assuming you have separate API functions for fetching by username and email
            const querySnapshotByUsername = await UsersApi().getUsersByForSearch(searchQuery);
            const usersByUsername = querySnapshotByUsername.docs.map(doc => doc.data());
            const querySnapshotByEmail = await UsersApi().getUsersByForSearchEmail(searchQuery);
            const usersByEmail = querySnapshotByEmail.docs.map(doc => doc.data());
            // Combine and deduplicate users
            combinedUsers = [...combinedUsers, ...usersByUsername, ...usersByEmail];
        }
        let uniqueUsers = Array.from(new Set(combinedUsers.map(user => user.uid)))
            .map(uid => {
                return combinedUsers.find(user => user.uid === uid);
        });
        //Fetching Images
        const userPromises = uniqueUsers.map(async user => {
                // Assuming user.image[0].path exists and loadImageUrl is the function to get the URL
                if (user.image && user.image.length > 0 && loadImageUrl) {
                    try {
                        const imageUrl = await loadImageUrl(user.image[0].path);
                        return { ...user, imageUrl }; // Add imageUrl to the user object
                    } catch (error) {
                        console.error("Error fetching image URL for user:", user, error);
                        // If there's an error, set imageUrl to null
                        return { ...user, imageUrl: null };
                    }
                } else {
                    // If no image is available, set imageUrl to null
                    return { ...user, imageUrl: null };
                }
            });
            const usersWithImages = await Promise.all(userPromises);
            //setTaggedWithImages(usersWithImages);
            setTagged(usersWithImages.map(tag => (tag.username?tag.username:tag.email.split('@')[0])));
    };

    //When the data loads, fetches the image of the latest climb to display for the session
    useEffect(() => {
        const loadImages = async () => {
          try {
                const selected = (data.featuredClimb?data.featuredClimb: (data.climbs?data.climbs[0]:null));
                //Fetch the Featured Tap Object
                if (selected) {
                    const tapsSnapshot = (await TapsApi().getTap(selected));
                    const filteredTap = {id: tapsSnapshot.id, ...tapsSnapshot.data()}; // Convert to a Tap Object
                    const climbSnapshot = (await ClimbsApi().getClimb(filteredTap.climb));
                    let combinedTap = null
                    if (climbSnapshot.exists) {
                        combinedTap = { ...climbSnapshot.data(), tapId: filteredTap.id, tapTimestamp: filteredTap.timestamp}
                    }
                    //console.log('Combined Tap is: ', combinedTap);
                    //setSelectedData(combinedTap);
                    setSelectedTapId(combinedTap.tapId);
                    setInitiallySelected(combinedTap.tapId);
            }

            // Default image path
            let climbImageURL = 'climb photos/the_crag.png';
            const {getUsersBySomeField} = UsersApi();
            let user = (await getUsersBySomeField('uid', currentUser.uid));
            if (user) {
                setUser(user.docs[0].data());
            }
            // If there is climb data and images are available, use the latest image
            if (data && data.sessionImages && data.sessionImages.length > 0) {
              const latestImageRef = data.sessionImages[0]; //Fetches the first Image, useful when the user sets a new look for the session
              climbImageURL = latestImageRef.path;
            }
            // Load climb image
            const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
            setClimbImageUrl(loadedClimbImageUrl);
            setInitialImagePath(loadedClimbImageUrl);
          } catch (error) {
            console.error("Error loading images: ", error);
          }
        };
        loadImages();
        handleImageFetch();
    }, [data]);


    const EditButton = ({ onPress }) => {
        return (
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Image source={require('./../../assets/add-photo.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
                <Text style={{color: 'black', padding: 5, fontSize: 12}}>Add Photos</Text>
            </TouchableOpacity>
        );
    };

    const UpdateButton = ({ onPress, text}) => {
        return (
            <TouchableOpacity style={{width: '100%', backgroundColor: '#3498db', borderRadius: 10, display: 'flex', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center'}} onPress={onPress}>
                <Text style={{color: 'white', fontSize: 15, textAlign: 'center'}}>{text}</Text>
            </TouchableOpacity>
        );
    };

    const TagButton = ({onPress}) => {
        return (
            <TouchableOpacity style={{width: '100%', backgroundColor: '#3498db', borderRadius: 10, display: 'flex', flexDirection: 'row', padding: 10, justifyContent: 'center', alignItems: 'center'}} onPress={onPress}>
                <Image source={require('./../../assets/camera.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
            </TouchableOpacity>
        );
    };


    const TagButtonType = ({onPress}) => {
        return (
            <TouchableOpacity style={{width: '100%', backgroundColor: '#3498db', borderRadius: 10, display: 'flex', flexDirection: 'row', padding: 10, justifyContent: 'center', alignItems: 'center'}} onPress={onPress}>
                <Image source={require('./../../assets/short-text.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
            </TouchableOpacity>
        );
    };

    //DropDown for Featured Climbs
    const CollapsibleItem = ({ children }) => {
        const [isOpen, setIsOpen] = useState(false);
    
        const toggleOpen = () => {
            setIsOpen(!isOpen);
        };
    
        return (
            <View style={{width: '100%'}}>
                <TouchableOpacity style={styles.header} onPress={toggleOpen}>
                    <View style={{display: 'flex', flexDirection :'row'}}>
                    <Image source={require('./../../assets/featured.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
                    <Text style={styles.headerText}>Featured Climb</Text>
                    </View>
                    <Image source={isOpen ? require('./../../assets/keyboard-up.png') : require('./../../assets/keyboard-down.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
                </TouchableOpacity>
                {isOpen && (
                    <View style={styles.content}>
                        {children}
                    </View>
                )}
            </View>
        );
    };    

    const AddUserCollapsibleItem = ({ children }) => {
        const [isOpen, setIsOpen] = useState(false);
    
        const toggleOpen = () => {
            setIsOpen(!isOpen);
        };
    
        return (
            <View style={{width: '100%'}}>
                <TouchableOpacity style={styles.header} onPress={toggleOpen}>
                    <View style={{display: 'flex', flexDirection :'row'}}>
                    <Image source={require('./../../assets/tag.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
                    <Text style={styles.headerText}>Tagged Partners</Text>
                    </View>
                    <Image source={isOpen ? require('./../../assets/keyboard-up.png') : require('./../../assets/keyboard-down.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
                </TouchableOpacity>
                {isOpen && (
                    <View style={styles.content}>
                        {children}
                    </View>
                )}
            </View>
        );
    };

    const handleUpdateSession = () => {
        Alert.alert(
            "Confirm Update",
            "Are you sure you want to update this session?",
            [
                {
                    text: "Cancel",
                    onPress: () => console.log("Update cancelled"),
                    style: "cancel"
                },
                { 
                    text: "OK", 
                    onPress: () => updateSession() 
                }
            ],
            { cancelable: false }
        );
    };

    const updateSession = async () => {
        if (initialText !== sessionTitle) {
            if (sessionTitle.trim() === '') {
                Alert.alert("Error", "Session title cannot be empty!");
                return;
            }
            try {
                //Minor fix to trim the name of the session (NOT UNIQUE EVER, SO TRIVIAL FIX)
                await SessionsApi().updateSession(data.id, {name: sessionTitle.trim()});
                //console.log('Title Updated!');
                setInitialText(sessionTitle.trim());
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Couldn't update session.");
                return;
            }
        }
        if (initallySelected !== selectedTapId) {
            try {
                await SessionsApi().updateSession(data.id, {featuredClimb: selectedTapId});
                //console.log('Featured Tap Updated!');
                setInitiallySelected(selectedTapId);
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Couldn't update selection.");
                return;
            }
        }
        if (initialImagePath !== '' && initialImagePath !== climbImageUrl) {
            try {
                const uploadedImage = await uploadImage(climbImageUrl);
                await SessionsApi().updateSession(data.id, {sessionImages: [uploadedImage].concat(data.sessionImages)});
                //console.log('Image Updated!');
                setInitialImagePath(climbImageUrl);
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Couldn't update image.");
                return;
            }
        }
        if (tagged) {
            try {
                await SessionsApi().updateSession(data.id, {taggedUsers: tagged});            
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Couldn't update tagged users.");
                return;
            }
        } 
        Alert.alert("Success", "Session updated!");
        //console.log("Session updated");
        navigation.popToTop();
    };

    const uploadImage = async (imagePath) => {
        const filename = imagePath.split('/').pop().replace(/\.jpg/gi, "").replace(/-/g, "");
        const storageRef = storage().ref(`climb_images/${filename}`);
        await storageRef.putFile(imagePath);
        return { id: filename, path: storageRef.fullPath, timestamp: new Date().toISOString() };
    };



    const selectImageLogic = async () => {
        //console.log("handleImagePick called");
        try {
        const pickedImage = await ImagePicker.openPicker({
            width: 300,
            height: 400,
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


    const codeScanner = useCodeScanner({
        codeTypes: ['qr', 'ean-13'],
        onCodeScanned: (codes) => {
            if (codes.length > 0) {
                let code_read = codes[0].value;
                // Check if the new code is different from the last scanned code
                if (code_read && lastScannedCodeRef.current !== code_read) {
                    lastScannedCodeRef.current = code_read; // Update the ref with the new code
                    setActiveQR(code_read.trim());
                }
            }
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            if (activeQR !== null && !activeQR.startsWith('http://') && !activeQR.startsWith('https://')) {
                try {
                    const { getUsersBySomeField } = UsersApi();
                    const snapshot = await getUsersBySomeField('uid', activeQR);
                    if (snapshot && snapshot.docs) {
                        if (snapshot.docs.length === 0) {
                            //console.log(snapshot.docs);
                            throw new Error("No user found!");
                        } else if (snapshot.docs.length > 1) {
                            throw new Error("Multiple users found!");
                        } else {
                            let user = snapshot.docs[0].data(); // Assuming you want the first document
                            //console.log('User: ', user);
                            if (currentUser.uid === user.uid.trim()) {
                                throw new Error("Cannot tag yourself!");
                            }
                            let check_val = (user.username?user.username.trim(): user.email.split('@')[0].trim());
                            // Add to local tagged variable
                            if (!tagged.includes(check_val)) {
                                // Add user.uid to the top of the array
                                const newTagged = [check_val, ...tagged];
                                setTagged(newTagged);
                                //console.log('User tagged!: ', newTagged); 
                            } else {
                                throw new Error("User already added!");
                            }
                        }
                    } else {
                        throw new Error("Invalid snapshot data!");
                    }
                } catch (error) {
                    //console.log('Could not tag user: ', error);
                    Alert.alert("Error", error.message);
                } finally {
                    closeModal();
                    closeModalText();
                }
            }
        };
        fetchData();
    }, [activeQR]);    


    const removeTag = (index) => {
        setTagged(currentTagged => currentTagged.filter((_, i) => i !== index));
        setActiveQR(null);
        lastScannedCodeRef.current = null;
    }


    const handleTag = (code_read) => {
        if (code_read && lastScannedCodeRef.current !== code_read) {
            lastScannedCodeRef.current = code_read; // Update the ref with the new code
            setActiveQR(code_read.trim());
        }
    };

  return (
    <SafeAreaView style={{flex: 1}}>
    <View style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', flex: 1}}>
      <ScrollView style={{display: 'flex', flexDirection: 'column', paddingVertical: 10, flex: 1}}>
        <View style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 30}}>
            <TextInput style={styles.textInput} placeholder="" placeholderTextColor='black' defaultValue={initialText} onChangeText={(text) => {setSessionTitle(text.trim())}}/>
        </View>
        <View style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', padding: 10, flexDirection: 'row'}}>
            <View style= {{display: 'flex', width: '40%'}}>
            {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: 130, height: 180, borderRadius: 5}} /> : <ActivityIndicator color="#3498db"/>}
            </View>
            <View style= {{display: 'flex', width: '40%', height: '100%', paddingHorizontal: 10}}>
                <EditButton onPress={selectImageLogic}/>
            </View>
        </View>
        <View style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
            <CollapsibleItem>
                <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row'}}>
                <ListHistory
                data={climbs}
                renderItem={(item, index, isHighlighted) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={timeStampFormatting(item.tapTimestamp)} fromHome={false} isHighlighted={(item.tapId === selectedTapId && isHighlighted)} sessionPick={true} tapIdRef={tapIdRef} setSelectedTapId={setSelectedTapId}/>}
                //highlighted variable passed for index 0, only if it is an active session
                keyExtractor={(item, index) => index.toString()}
                isHighlighted = {true}
                />
                </View>
            </CollapsibleItem>
        </View>
        <View style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
            <AddUserCollapsibleItem>
                <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'column'}}>
                <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row', padding: 10}}>
                    <View style={{display:'flex', width:'50%', paddingHorizontal: 10}}>
                    <TagButtonType onPress={openModalText} />
                    </View>
                    <View style={{display:'flex', width:'50%', paddingHorizontal: 10}}>
                    <TagButton onPress={openModal} />
                    </View>
                </View>
                <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row'}}>
                <View style={{width: '100%', display: 'flex', flexDirection: 'column', paddingTop: 10, paddingBottom: 40, paddingHorizontal: 10}}>
                        {tagged && tagged.map((tag, index) => (
                            <View key={index} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15}}>
                                <Text style={{color: 'black'}}>{tag}</Text>
                                <TouchableOpacity onPress={() => removeTag(index)}>
                                <Image source={require('./../../assets/cancel.png')} style={{ width: 24, height: 24 }}   resizeMode="contain" />
                                </TouchableOpacity>
                            </View>
                        ))}
                </View>
                </View>
                </View>
            </AddUserCollapsibleItem>
        </View>
      </ScrollView>
        <View style={{justifyContent: 'center', alignItems: 'center', padding: 10, width: '100%', paddingHorizontal: 10, backgroundColor: 'white'}}>
            <UpdateButton onPress={handleUpdateSession} text={'Update Session'}/>
        </View>
        </View>
        <Portal>
                <Modal visible={isModalVisible} onDismiss={closeModal} contentContainerStyle={{width: '90%', height: '40%', alignSelf:'center', display: 'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                    <View style={{width: '100%', height:'100%', overflow:'hidden', borderRadius: 20}}>
                    {device == undefined || device == null?<></>: <Camera
                        style={{width:'100%', height:'100%'}}
                        device={device}
                        isActive={isModalVisible}
                        codeScanner={codeScanner}
                    />
                    }
                    </View>
                
                </Modal>
                <Modal visible={isModalVisibleText} onDismiss={closeModalText} contentContainerStyle={{width: '90%', height: '80%', alignSelf:'center', display: 'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
                    <View style={{width: '100%', height:'100%', borderRadius: 20, backgroundColor: '#F2F2F2', display:'flex', flexDirection:'column', justifyContent:'flex-start', alignItems:'center', padding: 20}}>
                        <UserSearch onTag={handleTag}/>
                    </View>
                </Modal>
        </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  climbDot: {
    width: 'auto',
    height: 'auto',
    borderRadius: 15,
    color: 'black',
    borderColor: '#fe8100',
    borderWidth: 1,
    padding: 5,
    fontSize: 10,
},
climbName: {
    color: 'black',
    fontSize: 10,
    padding: 5,
},
climbImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
},
timerInfo: {
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'black',
    fontSize: 10,
    padding: 5,
},
button: {
    // Style your button
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    borderColor: '#fe8100',
    display: 'flex',
    flexDirection: 'column',
    borderStyle: 'dashed'
},
textInput: {
    width: '90%', // Width of the TextInput
    height: 50, // Height of the TextInput
    borderWidth: 1, // Border to make the TextInput visible
    borderColor: 'black', // Border color
    paddingLeft: 10, // Padding inside the TextInput
    color: 'black',
    borderRadius: 10,
    backgroundColor: 'white'
},
header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    margin:10,
    // Add additional styling as needed
},
headerText: {
    fontWeight: '500',
    color: 'black',
    paddingHorizontal: 10,
    // Add additional styling as needed
},
content: {
    padding: 0,
    color: 'black',
    borderRadius: 10,
    // Add additional styling for the content area
},
});

export default EditSession;