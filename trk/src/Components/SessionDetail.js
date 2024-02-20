import React, { useState, useContext, useEffect, useCallback, useMemo} from "react";
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
import SessionGraph from "./SessionGraph";
import UsersApi from "../api/UsersApi";
import moment from "moment-timezone";
import TapsApi from "../api/TapsApi";
import SessionsApi from "../api/SessionsApi";
import ClimbsApi from "../api/ClimbsApi";
import LineGraphComponent from "./LineGraphComponent";

//Session data is passed here, relevant data is fetched and calculated
const SessionDetail = ({route}) => {
    const navigation = useNavigation();
    let data = route.params.data;
    if (!data) {
        return;
    }
  
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [initialText, setInitialText] = useState('');

    const [selectedData, setSelectedData] = useState(null); //The tap object of the featured Climb
    const [title, setTitle] = useState(['','']);
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const { currentUser } = useContext(AuthContext);
    const [taggedWithImages, setTaggedWithImages] = useState(null);
    
    const [climbs, setClimbs] = useState([]);
    const [descClimbs, setDescClimbs] = useState([]);
    //NEED TO PREPARE CLIMBS FOR THE SESSION GRAPH
    //NEED TO ORDER CLIMBS FOR LISTHISTORY

    //For the Images in SessionItem
    const [allImages, setAllImages] = useState([]);
    const [duration, setDuration] = useState('0 mins');
    const [elevation, setElevation] = useState(0);

    

    const prepClimbs = async () => {
        try  {
            const tapsPromises = data.climbs.map(tapId => TapsApi().getTap(tapId));
            const tapsData = await Promise.all(tapsPromises);
            const promise = tapsData.map(tap => ClimbsApi().getClimb(tap.data().climb));
            const recentSnapshot = await Promise.all(promise);
            const recentSessionStarts = recentSnapshot.map((climbSnapshot, index) => {
                if (!climbSnapshot.exists) return null;
                return { ...climbSnapshot.data(), tapId: tapsData[index].id, tapTimestamp: tapsData[index].data().timestamp};
            }).filter(climb => climb !== null);
            setClimbs(recentSessionStarts);
            setDescClimbs([...recentSessionStarts].reverse());

            setElevation(recentSessionStarts.length * 4);
        } catch (error) {
            console.error('Error while preparing climbs: ', error.message);
        }
    };

    // Helper function to format timestamp
    const sessionTimestamp = (timestamp) => {
        const date = moment(timestamp).tz('America/New_York');
        
        // Round down to the nearest half hour
        const minutes = date.minutes();
        const roundedMinutes = minutes < 30 ? 0 : 30;
        date.minutes(roundedMinutes);
        date.seconds(0);
        date.milliseconds(0);
    
        let formatString;
        let formatStringHeader;
        formatStringHeader = 'Do MMM';
        if (roundedMinutes === 0) {
            // Format without minutes for times on the hour
            formatString = 'dddd, h A';
        } else {
            // Format with minutes for times on the half hour
            formatString = 'dddd, h:mm A';
        }
        const formattedDate = date.format(formatString);
        const formattedDateSubtext = date.format(formatStringHeader);
        if (formattedDate === 'Invalid date' || formattedDateSubtext === 'Invalid date') {
            return ['Unknown Time', 'Unknown Date'];
        }
        return [formattedDate, formattedDateSubtext];
    };

    const handleImageFetch = async () => {
        if (data.timestamp && data.timestamp.toDate) {
            const tempTitle = sessionTimestamp(data.timestamp.toDate());
            setTitle([tempTitle[0], tempTitle[1]]);
        }
        if (data.name && data.name.trim() !== '') {
            setInitialText(data.name);
        }
        if (data.climbs && data.climbs.length > 0) {
            calculateDuration(data.climbs);
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
            //console.log('Images Fetched for Tagged Users!');
            setTaggedWithImages(usersWithImages);
    };

    //To fetch the Images shown in SessionItem
    const fetchUrl = async (path) => {
        const url = await loadImageUrl(path);
        return url;
    };

    const imageFetch = async (images, climbs) => {
        let final_paths = [];
        let image_paths = [];
        const preloaded_images = ['climb photos/the_crag.png', 'climb photos/the_cove.gif']
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                image_paths.push(images[i].path);
            }
        }
        if (climbs && climbs.length > 0) {
            for (let i = 0; i < Math.min(2, climbs.length); i++) {
                image_paths.push(preloaded_images[i]);
            }
        }
        for (let i = 0; i < image_paths.length; i++) {
            let path  = image_paths[i];
            let url = await fetchUrl(path);
            final_paths.push(url);
        }
       setAllImages(final_paths);
    }

  const handleImagePress = useCallback((imageUrl) => {
        setSelectedImage(imageUrl);
        setModalVisible(true);
  }, [setSelectedImage, setModalVisible]);  


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

 //To calculate the session duration for share
 const calculateDuration = async (data) => {
    if (data.length < 2) {
        return;
    }
    try {
        // Assuming timestamps are in milliseconds
        const firstTap = data[0];
        const lastTap = data[data.length - 1];
        const lastTapItem = (await TapsApi().getTap(lastTap)).data();
        const firstTapItem = (await TapsApi().getTap(firstTap)).data();
        const firstTimestamp = firstTapItem.timestamp.toDate(); // Most recent
        const lastTimestamp = lastTapItem.timestamp.toDate(); // Oldest
    
        // Calculate the difference in minutes directly
        const differenceInMinutes = Math.round((firstTimestamp - lastTimestamp) / (1000 * 60));
        
        // Handle singular and plural forms for "minute"
        const durationText = differenceInMinutes === 1 ? `${differenceInMinutes} min` : `${differenceInMinutes} mins`;
        setDuration(durationText);
    } catch (error){
        console.error('Error while calculating duration: ', error.message);
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
                    setSelectedData(combinedTap);
                }
                // Default image path
                let climbImageURL = 'climb photos/the_crag.png';
                // If there is climb data and images are available, use the latest image
                if (data && data.sessionImages && data.sessionImages.length > 0) {
                    const latestImageRef = data.sessionImages[0]; //Fetches the first Image, useful when the user sets a new look for the session
                    climbImageURL = latestImageRef.path;
                }
                // Load climb image
                const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
                setClimbImageUrl(loadedClimbImageUrl);
            } catch (error) {
                console.error("Error loading images: ", error);
            }
        };
        loadImages();
        handleImageFetch();
        prepClimbs();
         //For the call to fetch images
         if ((data.sessionImages && data.sessionImages.length > 0) || data.climbs && data.climbs.length > 0) {
            imageFetch(data.sessionImages, data.climbs);
        }
    }, [data]);

    const EditButton = ({ onPress }) => {
        return (
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Image source={require('./../../assets/edit.png')} style={{ width: 20, height: 20 }}   resizeMode="contain" />
            </TouchableOpacity>
        );
    };

  return (
    <SafeAreaView style={{margin: 0, padding: 0, width: '100%', height:'100%'}}>
      <ScrollView style={{display: 'flex', flexDirection: 'column', paddingVertical: 10}}>
        <View style={{width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 20}}>
            <EditButton onPress={() => {navigation.navigate('Edit_Session', {data: data, climbs: descClimbs})}}/>
        </View>
                <View style={{ height: 380, width: '100%', display: 'flex', flexDirection: 'row', borderRadius: 10}}>
                        {/*<View style={{ width: '30%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10 }}>
                            {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%', borderRadius: 5 }} /> : <Text style={{ color: 'black', fontSize: 8 }}>Loading...</Text>}
                        </View> */}
                        <View style={{ width: '100%', marginBottom:0}}>
                            <View style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingRight: 10}}>
                                <View style={{ width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start', paddingLeft: 20, flexDirection: 'row', paddingRight: 10, paddingTop: 10, height: '20%'}}>
                                    <View style={{display: 'flex', flexDirection: 'column', paddingBottom: 10, width: '75%'}}>
                                    <Text style={{ color: 'black', fontSize: 20, fontWeight: '500', paddingBottom: 8}}>{initialText}</Text>
                                    <View style={{display: 'flex', flexDirection: 'row'}}><Text style={{ color: 'black', fontSize: 13, paddingRight: 10, borderRightWidth: 0.5, borderRightColor: 'black', fontWeight: '300'}}>{title[0]}</Text>
                                    <Text style={{ color: 'black', fontSize: 13, paddingLeft: 10, paddingRight: 10, borderRightWidth: 0.5, borderRightColor: 'black', fontWeight: '300'}}>{title[1]}</Text>
                                    <Text style={{ color: 'black', fontSize: 13, paddingLeft: 10, paddingRight: 10, fontWeight: '300'}}>Movement LIC</Text> 
                                    </View>
                                    </View>
                                    <View style={{display: 'flex', flexDirection: 'row', width: '25%', paddingBottom: 5}}>
                                    <Image source={require('../../assets/movement_rounded.png')} style={{width: '100%', height: 20, borderRadius: 10}} />
                                    </View>
                                </View>
                                <View style={{height: '80%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', alignSelf: 'flex-start', paddingVertical: 10, paddingLeft: 5}}>
                                    <FlatList
                                            data={allImages}
                                            horizontal={true}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity onPress={() => {handleImagePress(item)}}>
                                                <ImageItem imagePath={item} />
                                                </TouchableOpacity>
                                            )}
                                            keyExtractor={(item, index) => index.toString()}
                                            style={{alignSelf: 'flex-start'}}
                                        />
                                </View>
                            </View>
                        </View>
                    </View>
        <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 20}}>
            <View style={{display: 'flex', width: '50%', height: 80,  borderBottomWidth: 0.5, borderBottomColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 15, fontWeight: '300', borderRightWidth: 0.5, borderRightColor: 'black', width: '100%', textAlign:'center'}}>Climbs</Text>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 25, fontWeight: '400', borderRightWidth: 0.5, borderRightColor: 'black', width: '100%', textAlign:'center'}}>{data.climbs.length}</Text>
            </View>
            <View style={{display: 'flex', width: '50%', height: 80,  borderBottomWidth: 0.5, borderBottomColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 15, fontWeight: '300', width: '100%', textAlign:'center'}}>Time</Text>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 25, fontWeight: '400', width: '100%', textAlign:'center'}}>{duration}</Text>
            </View>
        </View>
        <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10}}>
            <View style={{display: 'flex', width: '50%', height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 15, fontWeight: '300', borderRightWidth: 0.5, borderRightColor: 'black', width: '100%', textAlign:'center'}}>Elevation</Text>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 25, fontWeight: '400', borderRightWidth: 0.5, borderRightColor: 'black', width: '100%', textAlign:'center'}}>{elevation} m</Text>
            </View>
            <View style={{display: 'flex', width: '50%', height: 80, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 15, fontWeight: '300', width: '100%', textAlign:'center'}}>Best Effort</Text>
                <Text style={{color: 'black', paddingBottom: 5, fontSize: 25, fontWeight: '400', width: '100%', textAlign:'center'}}>{selectedData && selectedData.grade}</Text>
            </View>
        </View>
        {false && (
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingVertical: 10, paddingLeft: 10, paddingRight: 20}}>
            <Text style={{color: 'black', paddingRight: 10, paddingLeft: 10}}> <Image source={require('./../../assets/tag.png')} style={{ width: 25, height: 25 }}   resizeMode="contain" /></Text>
            <View style={{display:'flex', flexDirection:'row'}}>
            {taggedWithImages && taggedWithImages.map((user, index) => (
                <View key={index} style={{ alignItems: 'center', marginRight: -20}}>
                    {user.imageUrl? <Image source={{ uri: user.imageUrl }} style={{ width: 50, height: 50, borderRadius: 25, borderColor: '#f2f2f2', borderWidth: 2}} />: <View style={{display: 'flex', height: 50, width: 50, backgroundColor: '#D9D9D9', borderRadius: 30, borderWidth: 1, borderColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center'}}><Text style={{color: 'black', fontSize: 15}}>{user.email.charAt(0).toUpperCase()}</Text></View>}
                </View>
            ))}
            </View>
            <Text style={{color: 'black', paddingHorizontal: 40}}>{taggedWithImages && (taggedWithImages.length == 1? '1 Tag': taggedWithImages.length + ' Tags')}</Text>
        </View>)}


        {/* Session Graph Section*/}
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 15}}>
            <Text style={{ color: 'black', fontSize: 20, fontWeight: '500', paddingBottom: 0, paddingHorizontal: 20}}>Session Progress</Text>
        </View>
        <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row', padding: 15}}>
            <LineGraphComponent data={climbs}/>
        </View>
        
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 15}}>
            <Text style={{ color: 'black', fontSize: 20, fontWeight: '500', paddingBottom: 8, paddingHorizontal: 20}}>Climb Details</Text>
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row'}}>
            <ListHistory
            data={descClimbs}
            renderItem={(item, index, isHighlighted) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={timeStampFormatting(item.tapTimestamp)} fromHome={false} isHighlighted={(index == 0 && isHighlighted)}/>}
            //highlighted variable passed for index 0, only if it is an active session
            keyExtractor={(item, index) => index.toString()}
            isHighlighted = {true}
            />
        </View> 
      </ScrollView>
      <ImageModal visible={modalVisible} onClose={() => setModalVisible(false)} imagePath={selectedImage}/>
    </SafeAreaView>
  );
};

const loadImageUrl = async (imagePath) => {
    try {
      const url = await storage().ref(imagePath).getDownloadURL();
      return url;
    } catch (error) {
      console.error("Error getting image URL: ", error);
      throw error;
    }
};

const ImageItem = ({ imagePath, isModal = false}) => {
    const imageUrl = imagePath;
    if (!imageUrl) {
        // Show placeholder or spinner
        return <View style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: 130, height: 180}}><ActivityIndicator color="#3498db"/></View>; // Replace with your spinner or placeholder component
    }
    if (!isModal){
        return (
            <Image source={{ uri: imageUrl }} style={{ width: 200, height: 280, marginHorizontal: 5, borderRadius: 5}} />
        );
    } else {
        return (
            <Image source={{ uri: imageUrl }} style={{ width: Dimensions.get('window').width - 50, height: Dimensions.get('window').height/1.5, borderRadius: 5}} />
        );
    }
};

const ImageModal = ({ visible, onClose, imagePath }) => {
    return (
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
        style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}
      >
        <ImageItem imagePath={imagePath} isModal={true} />
      </Modal>
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
    padding: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
},
});

export default SessionDetail;
