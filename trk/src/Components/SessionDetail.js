import React, { useState, useContext, useEffect, useCallback, useMemo} from "react";
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
import SessionGraph from "./SessionGraph";
import UsersApi from "../api/UsersApi";
import moment from "moment-timezone";
import TapsApi from "../api/TapsApi";
import SessionsApi from "../api/SessionsApi";
import ClimbsApi from "../api/ClimbsApi";

//Session data is passed here, relevant data is fetched and calculated
const SessionDetail = ({route}) => {
  const navigation = useNavigation();
  let data = route.params.data;
  if (!data) {
    return;
  }
    const allImages = (data.sessionImages? data.sessionImages: []);
  
    const [selectedImage, setSelectedImage] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [initialText, setInitialText] = useState('');
    const [duration, setDuration] = useState('');
    const [selectedData, setSelectedData] = useState(null); //The tap object of the featured Climb
    const [title, setTitle] = useState(['','']);
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const { currentUser } = useContext(AuthContext);
    const [taggedWithImages, setTaggedWithImages] = useState(null);
    
    const [climbs, setClimbs] = useState([]);
    const [descClimbs, setDescClimbs] = useState([]);
    //NEED TO PREPARE CLIMBS FOR THE SESSION GRAPH
    //NEED TO ORDER CLIMBS FOR LISTHISTORY

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
        if (data.climbs) {
            const value = (await calculateDuration(data.climbs));
            if (value){
                setDuration(value);
            }
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

    const calculateDuration = async (data) => {
        if (data.length < 2) {
            return '0 minutes';
        }
        try {
            // Assuming timestamps are in milliseconds
            const firstTap = data[0];
            const lastTap = data[data.length - 1];
            const lastTapItem = (await TapsApi().getTap(lastTap)).data();
            const firstTapItem = (await TapsApi().getTap(firstTap)).data();
            const firstTimestamp = firstTapItem.timestamp.toDate(); // Most recent
            const lastTimestamp = lastTapItem.timestamp.toDate(); // Oldest
        
            // Calculate the difference in hours
            const differenceInHours = (firstTimestamp - lastTimestamp) / (1000 * 60 * 60);
        
            // If the difference is less than an hour, return in minutes
            if (differenceInHours < 1) {
                const differenceInMinutes = Math.round((firstTimestamp - lastTimestamp) / (1000 * 60));
                return `${differenceInMinutes} mins`;
            }
        
            // Otherwise, round to the nearest half hour and return in hours
            const roundedHours = Math.round(differenceInHours * 2) / 2;
            return `${roundedHours} hrs`;
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
    }, [data]);

    const EditButton = ({ onPress }) => {
        return (
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Icon name="more-horiz" size={20} color="black" />
            </TouchableOpacity>
        );
    };

  return (
    <SafeAreaView style={{margin: 0, padding: 0, width: '100%', height:'100%'}}>
      <ScrollView style={{display: 'flex', flexDirection: 'column', paddingVertical: 10}}>
      <View style={{height: 150, width: '100%', backgroundColor: 'transparent', borderRadius: 10, display: 'flex', flexDirection: 'row'}}>
                <View style={{width: '30%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10}}>
                {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%', borderRadius: 5}} /> : <ActivityIndicator color="#3498db"/>}
                </View>
                <View style={{width: '70%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingRight: 10, paddingVertical: 10}}>
                    <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'flex-start'}}>
                        <Text style={{color: 'black', fontSize: 15, fontWeight: '500'}}>{initialText}</Text>
                        <Text style={{color: 'black', fontSize: 12}}>{title[0]}</Text>
                        <Text style={{color: 'black', fontSize: 12}}>{title[1]}</Text>
                    </View>
                    <View style={{width: '100%', height: '70%', display: 'flex', flexDirection: 'row', paddingTop: 10}}>
                        <View style={{width: '50%', padding: 10, display:'flex', justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{color: 'black', fontSize: 25, fontWeight: '500'}}>{data.climbs.length}</Text>
                            <Text style={{color: 'black', fontSize: 12}}>Total Climbs</Text>
                        </View>
                        <View style={{width: '50%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}>
                            <View style={{marginRight: 10}}>
                                    <ListItemSessions dotStyle={styles.climbDot} grade={(selectedData? selectedData.grade: '')}>
                                        <Text style={styles.climbName}>{(selectedData? selectedData.name: '')}</Text>
                                        <View>
                                            <Text style={styles.timerInfo}>
                                                {(selectedData && selectedData.tapTimestamp)? (timeStampFormatting(selectedData.tapTimestamp).replace(/AM|PM/i, '').trim()): ''}
                                            </Text>
                                        </View>
                                    </ListItemSessions>
                            </View>
                            <Text style={{color: 'black', padding: 5, fontSize: 12}}>Last Climb</Text>
                        </View>
                    </View>
                </View>
        </View>
        <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row'}}>
            <View style={{display: 'flex', width: '30%', height: 10}}></View>
            <View style={{display: 'flex', width: '40%', justifyContent: 'center', alignItems: 'center', padding: 20}}>
            <Text style={{color: 'black', fontSize: 25, fontWeight: '500'}}>{duration}</Text>
            <Text style={{color: 'black', fontSize: 12}}>Session Duration</Text>
            </View>
            <View style={{display: 'flex', width: '30%', justifyContent: 'center', alignItems: 'center', padding: 20}}>
                <EditButton onPress={() => {navigation.navigate('Edit_Session', {data: data, climbs: descClimbs})}}/>
            </View>
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingVertical: 10, paddingLeft: 10, paddingRight: 20}}>
            <Text style={{color: 'black', paddingRight: 10, paddingLeft: 10}}><Icon name="supervisor-account" size={25} color="#000"/></Text>
            <View style={{display:'flex', flexDirection:'row'}}>
            {taggedWithImages && taggedWithImages.map((user, index) => (
                <View key={index} style={{ alignItems: 'center', marginRight: -20}}>
                    {user.imageUrl? <Image source={{ uri: user.imageUrl }} style={{ width: 50, height: 50, borderRadius: 25, borderColor: '#f2f2f2', borderWidth: 2}} />: <Text style={{color: 'black', fontSize: 10, display: 'flex', height: 50, width: 50, backgroundColor: '#D9D9D9', borderRadius: 30, textAlign: 'center', textAlignVertical: 'center', borderWidth: 2, borderColor: '#f2f2f2'}}>{user.email.charAt(0).toUpperCase()}</Text>}
                </View>
            ))}
            </View>
            <Text style={{color: 'black', paddingHorizontal: 40}}>{taggedWithImages && (taggedWithImages.length == 1? '1 Tag': taggedWithImages.length + ' Tags')}</Text>
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 10}}>
            <Text style={{color: 'black', paddingHorizontal: 20, fontWeight: 'bold'}}>Session Graph</Text>
        </View>
        <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row', padding: 10}}>
            <SessionGraph data={climbs}/>
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 10}}>
            <Text style={{color: 'black', paddingHorizontal: 20, fontWeight: 'bold'}}>{allImages.length>0? 'All Media': 'No Media'}</Text>
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', padding: 10, alignSelf:'flex-start'}}>
            <FlatList
                data={allImages}
                horizontal={true}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => {handleImagePress(item.path)}}>
                    <ImageItem imagePath={item.path} />
                    </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
                style={{alignSelf: 'flex-start'}}
            />
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 10}}>
            <Text style={{color: 'black', paddingHorizontal: 20, fontWeight: 'bold'}}>Climb Details</Text>
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
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        const fetchImageUrl = async () => {
            const url = await loadImageUrl(imagePath);
            setImageUrl(url);
        };

        fetchImageUrl();
    }, [imagePath]);

    if (!imageUrl) {
        // Show placeholder or spinner
        return <View style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: 130, height: 180}}><ActivityIndicator color="#3498db"/></View>; // Replace with your spinner or placeholder component
    }
    if (!isModal){
        return (
            <Image source={{ uri: imageUrl }} style={{ width: 130, height: 180, marginHorizontal: 5, borderRadius: 5}} />
        );
    } else {
        return (
            <Image source={{ uri: imageUrl }} style={{ width: 200, height: 300, borderRadius: 5}} />
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
