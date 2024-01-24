import React, { useState, useContext, useEffect, useRef } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
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

const EditSession = ({route}) => {
  const navigation = useNavigation();
  let data = route.params.data;
  const title = route.params.title;
  //data[0].images = [{path: 'climb photos/the_crag.png'},{path: 'climb photos/the_crag.png'},{path: 'climb photos/the_crag.png'},{path: 'climb photos/the_crag.png'}];
  
  //Setting selected tapId
  const tapIdRef = useRef(null);

  let initallySelected = null;
  let initialText = null;
  console.log(data);
  //Selected Item Set
  if (data.length>0) {
    const selectedData = data.filter(obj => obj.isSelected == true);
    console.log('The selected Data is: ', selectedData);
    if (selectedData.length == 0) {
        tapIdRef.current = data[0].tapId;
        initallySelected = data[0].tapId;
        console.log('Initially selected value is: ', tapIdRef.current);
    } else {
        tapIdRef.current = selectedData[0].tapId;
        initallySelected = selectedData[0].tapId;
        console.log('Initially selected value is: ', tapIdRef.current);
    }
    if (data[data.length-1].sessionTitle === undefined || (data[data.length-1].sessionTitle && data[data.length-1].sessionTitle === '')) {
        initialText = 'Session on '+title[1];
    }
    else {
        initialText = data[data.length-1].sessionTitle;
    }
    console.log('Initial session text: ', initialText);
  }
  const [selectedTapId, setSelectedTapId] = useState(tapIdRef.current);
  const [sessionTitle, setSessionTitle] = useState(initialText);

  const [climbImageUrl, setClimbImageUrl] = useState(null);
  const [initialImagePath, setInitialImagePath] = useState('');
  const { currentUser } = useContext(AuthContext);

  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
    setModalVisible(true);
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

    //When the data loads, fetches the image of the latest climb to display for the session
    useEffect(() => {
        const loadImages = async () => {
          try {
            // Default image path
            let climbImageURL = 'climb photos/the_crag.png';
    
            // If there is climb data and images are available, use the latest image
            if (data[data.length-1] && data[data.length-1].sessionImages && data[data.length-1].sessionImages.length > 0) {

              const latestImageRef = data[data.length-1].sessionImages[0]; //Fetches the first Image, useful when the user sets a new look for the session
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
    }, [data]);


    const EditButton = ({ onPress }) => {
        return (
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Icon name="add-photo-alternate" size={20} color="black" />
                <Text style={{color: 'black', padding: 5, fontSize: 12}}>Add Photos</Text>
            </TouchableOpacity>
        );
    };

    const UpdateButton = ({ onPress }) => {
        return (
            <TouchableOpacity style={{width: '100%', backgroundColor: '#3498db', borderRadius: 10, display: 'flex', flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center'}} onPress={onPress}>
                <Text style={{color: 'white', fontSize: 15, textAlign: 'center'}}>Update Session</Text>
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
            <View style={{width: '100%', paddingVertical: 20}}>
                <TouchableOpacity style={styles.header} onPress={toggleOpen}>
                    <View style={{display: 'flex', flexDirection :'row'}}>
                    <Icon name="star-border" size={20} color="#000"/>
                    <Text style={styles.headerText}>Featured Climb</Text>
                    </View>
                    <Icon name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={20} color="#000"/>
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
        console.log('Initial image path: ', initialImagePath);
        console.log('Updated image path: ', climbImageUrl);
        // Logic to update the session
        if (initialText !== sessionTitle) {
            if (sessionTitle.trim() === '') {
                Alert.alert("Error", "Session title cannot be empty!");
                return;
            }
            try {
                const { updateTap } = TapsApi();
                //Minor fix to trim the name of the session (NOT UNIQUE EVER, SO TRIVIAL FIX)
                await updateTap(data[data.length-1].tapId, {sessionTitle: sessionTitle.trim()});
                initialText = sessionTitle.trim();
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Couldn't update session.");
                return;
            }
        }
        if (initallySelected !== selectedTapId) {
            try {
                const { updateTap } = TapsApi();
                await updateTap(selectedTapId, {isSelected: true});
                await updateTap(initallySelected, {isSelected: false});
                initallySelected = selectedTapId;
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Couldn't update selection.");
                return;
            }
        }
        if (initialImagePath !== '' && initialImagePath !== climbImageUrl) {
            try {
                const uploadedImage = await uploadImage(climbImageUrl);
                const { updateTap } = TapsApi();
                await updateTap(data[data.length-1].tapId, {sessionImages: [uploadedImage].concat((data[data.length-1].sessionImages? data[data.length-1].sessionImages: []))});
                console.log('Image updated for: ', data[data.length-1].tapId);
                setInitialImagePath(climbImageUrl);
            } catch (error) {
                console.error(error);
                Alert.alert("Error", "Couldn't update image.");
                return;
            }
        }
        Alert.alert("Success", "Session updated!");
        console.log("Session updated");
        navigation.popToTop();
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
        <View style={{display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'center', flexDirection: 'row'}}>
            <CollapsibleItem>
                <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row'}}>
                <ListHistory
                data={data}
                renderItem={(item, index, isHighlighted) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={timeStampFormatting(item.tapTimestamp)} fromHome={false} isHighlighted={(item.tapId === selectedTapId && isHighlighted)} sessionPick={true} tapIdRef={tapIdRef} setSelectedTapId={setSelectedTapId}/>}
                //highlighted variable passed for index 0, only if it is an active session
                keyExtractor={(item, index) => index.toString()}
                isHighlighted = {true}
                />
                </View>
            </CollapsibleItem>
        </View>
      </ScrollView>
        <View style={{justifyContent: 'center', alignItems: 'center', padding: 10, width: '100%', paddingHorizontal: 10, backgroundColor: 'white'}}>
            <UpdateButton onPress={handleUpdateSession}/>
        </View>
        </View>
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
}
});

export default EditSession;