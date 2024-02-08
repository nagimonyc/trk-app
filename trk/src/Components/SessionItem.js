import React from 'react';
import { ScrollView, Text, Image, Button, Dimensions} from 'react-native';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import TapsApi from '../api/TapsApi';
import ClimbsApi from '../api/ClimbsApi';
import storage from '@react-native-firebase/storage';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../Utils/AuthContext';
import ClimbItem from './ClimbItem';
import ListItemSessions from './ListItemSessions';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import ShareView from '../Screens/NavScreens/ShareSession/Frontend';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import UsersApi from "../api/UsersApi";
import moment from 'moment-timezone';
import { FlatList } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';

//FIXED SHARE TO PASS IN CLIMB DATA!
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
    shadow: {
        flex: 1,
        // Shadow properties for iOS
        shadowColor: "#000",
        shadowOffset: {
          width: 0, // These values can be adjusted
          height: 2, // These values can be adjusted
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
    
        // Elevation property for Android
        elevation: 4,
        overflow: 'visible', // This can help ensure shadows are not clipped on Android
      },
});

//Only Session Item relevant data is calculated here now, rest of the data is passed into Detail and Edit.
const SessionItem = ({data}) => {
    //console.log('[TEST] ListHistory called');
    if (!data) {
        return;
    }
    //console.log(data);
    const [initialText, setInitialText] = useState('');
    const [selectedData, setSelectedData] = useState(null); //The tap object of the featured Climb
    const [title, setTitle] = useState(['','']);
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const { currentUser } = useContext(AuthContext);
    const [taggedWithImages, setTaggedWithImages] = useState(null);
    const [duration, setDuration] = useState('0 mins');

    //For the Images in SessionItem
    const [allImages, setAllImages] = useState([]);
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
        
            // Calculate the difference in hours
            const differenceInHours = (firstTimestamp - lastTimestamp) / (1000 * 60 * 60);
        
            // If the difference is less than an hour, return in minutes
            if (differenceInHours < 1) {
                const differenceInMinutes = Math.round((firstTimestamp - lastTimestamp) / (1000 * 60));
                setDuration(`${differenceInMinutes} mins`);
            }
        
            // Otherwise, round to the nearest half hour and return in hours
            const roundedHours = Math.round(differenceInHours * 2) / 2;
            setDuration(`${roundedHours} hrs`);
        } catch (error){
            console.error('Error while calculating duration: ', error.message);
        }
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
        if (data.climbs && data.climbs.length > 0) {
            calculateDuration(data.climbs);
        }
        //For the call to fetch images
        if ((data.sessionImages && data.sessionImages.length > 0) || data.climbs && data.climbs.length > 0) {
            imageFetch(data.sessionImages, data.climbs);
        }
    }, [data]);

    //Image Loading for SessionItem
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
                <Image source={{ uri: imageUrl }} style={{ width: 200, height: 280, borderRadius: 5}} />
            );
        }
    };

    const navigation = useNavigation();

    //Hardcoded Gym Name for Now
    //UI changes
    return (
        <ScrollView contentContainerStyle={{ padding: 10}}>
            <View style={[styles.shadow, { borderRadius: 10, backgroundColor: 'white'}]}>
                <TouchableOpacity onPress={() => { navigation.navigate('Session_Detail', {data: data}) }}>
                    <View style={{ height: 500, width: '100%', backgroundColor: 'white', display: 'flex', flexDirection: 'row', borderRadius: 10}}>
                        {/*<View style={{ width: '30%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10 }}>
                            {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%', borderRadius: 5 }} /> : <Text style={{ color: 'black', fontSize: 8 }}>Loading...</Text>}
                        </View> */}
                        <View style={{ width: '100%', marginBottom:0}}>
                            <View style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingRight: 10}}>
                                <View style={{ width: '100%', justifyContent: 'flex-start', alignItems: 'flex-start', paddingLeft: 20, flexDirection: 'row', paddingRight: 10, paddingTop: 20, height: '15%'}}>
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
                                <View style={{ width: '100%', height: '25%', display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 40, paddingBottom: 10}}>
                                    <View style={{ width: '27%', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text style={{ color: 'black', fontSize: 15, width: '100%', textAlign: 'left', fontWeight: '300', paddingHorizontal: 20}}>Climbs</Text>
                                        <Text style={{ color: 'black', fontSize: 28, fontWeight: '400', width: '100%', textAlign: 'left', borderRightWidth: 0.5, borderRightColor: 'black', paddingHorizontal: 20}}>{data.climbs.length}</Text>
                                    </View>
                                    <View style={{ width: '40%', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text style={{ color: 'black', fontSize: 15, width: '100%', textAlign: 'left', fontWeight: '300', paddingHorizontal: 20}}>Time</Text>
                                        <Text style={{ color: 'black', fontSize: 28, fontWeight: '400', width: '100%', textAlign: 'left', borderRightWidth: 0.5, borderRightColor: 'black', paddingHorizontal: 20}}>{duration}</Text>
                                    </View>
                                    <View style={{ width: '33%', alignItems: 'center', justifyContent: 'center'}}>
                                        <Text style={{ color: 'black', fontSize: 15, width: '100%', textAlign: 'left', fontWeight: '300', paddingHorizontal: 20}}>Best Effort</Text>
                                        <Text style={{ color: 'black', fontSize: 28, fontWeight: '400', width: '100%', textAlign: 'left', paddingHorizontal: 20}}>{selectedData? selectedData.grade: 'V1'}</Text>
                                    </View>
                                    {false && (<View style={{ width: '50%', justifyContent: 'center', alignItems: 'center' }}>
                                        <View style={{ marginRight: 10 }}>
                                            <ListItemSessions dotStyle={styles.climbDot} grade={(selectedData? selectedData.grade: '')}>
                                                <Text style={styles.climbName}>{(selectedData? selectedData.name: '')}</Text>
                                                <View>
                                                    <Text style={styles.timerInfo}>
                                                        {(selectedData && selectedData.tapTimestamp)? (timeStampFormatting(selectedData.tapTimestamp).replace(/AM|PM/i, '').trim()): ''}
                                                    </Text>
                                                </View>
                                            </ListItemSessions>
                                        </View>
                                        <Text style={{ color: 'black', padding: 5, fontSize: 12 }}>Last Climb</Text>
                                    </View>)}
                                </View>
                                <View style={{height: '60%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', alignSelf: 'flex-start', paddingVertical: 10, paddingLeft: 10}}>
                                    <FlatList
                                        data={allImages}
                                        horizontal={true}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity onPress={() => {/*handleImagePress(item.path)*/}}>
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
                </TouchableOpacity>
                <View style={{ height: 45, flexDirection: 'row'}}>
                    {false && (<View style={{ width: '30%' }}>
                    </View>)}
                    <View style={{ width: '100%', flexDirection: 'row', height: '100%'}}>
                        
                        
                        {false && (<>
                        <View style={{ justifyContent: 'flex-start', width: '60%', alignItems: 'center', padding: 0}}>
                        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingLeft: 10, paddingRight: 20}}>
                            <Text style={{color: 'black', paddingRight: 10}}><Image source={require('./../../assets/tag.png')} style={{ width: 20, height: 20 }}  resizeMode="contain" /></Text>
                            <ScrollView contentContainerStyle={{display:'flex', flexDirection:'row', justifyContent:'flex-start', alignItems:'center', height:'100%'}}>
                            {taggedWithImages && taggedWithImages.map((user, index) => (
                                <View key={index} style={{ alignItems: 'center', marginRight: -12}}>
                                    {user.imageUrl? <Image source={{ uri: user.imageUrl }} style={{ width: 27, height: 27, borderRadius: 25, borderColor: '#f2f2f2', borderWidth: 1}} />: <View style={{display: 'flex', height: 27, width: 27, backgroundColor: '#D9D9D9', borderRadius: 30, borderWidth: 1, borderColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center'}}><Text style={{color: 'black', fontSize: 10}}>{user.email.charAt(0).toUpperCase()}</Text></View>}
                                </View>
                            ))}
                            </ScrollView>
                        </View>
                        </View>
                        <View style={{ width: 0.5, backgroundColor: '#BBBBBB', alignSelf: 'stretch', marginVertical: 5 }}></View></>)}
                        <View style={{ justifyContent: 'center', width: '100%', height: '100%', alignItems: 'center'}}>
                        <TouchableOpacity
                            style={{width: Dimensions.get('window').width-20, height: '100%', borderBottomRightRadius: 10, borderBottomLeftRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e5e5'}}
                            onPress={() => { navigation.navigate('Share_Session', { climbData: { imageUrl: climbImageUrl, climbCount: (data.climbs?data.climbs.length: 0), grade: selectedData.grade, duration: duration}}) }}
                        >
                            <Image
                            source={require('../../assets/share.png')}
                            style={{height: 30, width: 23.2}}
                            />
                        </TouchableOpacity>
                        </View>
                        </View>
                </View>
            </View>
        </ScrollView >
    );
}
//Just passing the highlighted variable for rendering in ClimbItem
export default SessionItem;
