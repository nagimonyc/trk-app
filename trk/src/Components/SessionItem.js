import React from 'react';
import { ScrollView, Text, Image } from 'react-native';
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
});

const SessionItem = ({ data, title, renderItem, keyExtractor, isHighlighted}) => {
    console.log('[TEST] ListHistory called');
    if (!data) {
        return;
    }   
    console.log('Data in the Session is: ', data);

    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const {currentUser} = useContext(AuthContext);
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
            if (data[0] && data[0].images && data[0].images.length > 0) {
              const latestImageRef = data[0].images[data[0].images.length - 1];
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
    }, [data]);

    return (
        <ScrollView contentContainerStyle={{ padding: 10}}>
            <TouchableOpacity onPress={() => {console.log('Session Clicked: ', data)}}>
            <View style={{height: 150, width: '100%', backgroundColor: 'white', borderRadius: 10, display: 'flex', flexDirection: 'row'}}>
                <View style={{width: '30%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 10}}>
                {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%', borderRadius: 5}} /> : <Text style={{color: 'black', fontSize: 8}}>Loading...</Text>}
                </View>
                <View style={{width: '70%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingRight: 10, paddingVertical: 10}}>
                    <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'flex-start'}}>
                        <Text style={{color: 'black', fontSize: 15, fontWeight: '500'}}>Session on {title[1]}</Text>
                        <Text style={{color: 'black', fontSize: 12}}>{title[0]}</Text>
                    </View>
                    <View style={{width: '100%', height: '70%', display: 'flex', flexDirection: 'row', paddingTop: 10}}>
                    <View style={{width: '50%', padding: 10, display:'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{color: 'black', fontSize: 25, fontWeight: '500'}}>{data.length}</Text>
                        <Text style={{color: 'black', fontSize: 12}}>Total Climbs</Text>
                    </View>
                    <View style={{width: '50%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}>
                        <View style={{marginRight: 10}}>
                            <ListItemSessions dotStyle={styles.climbDot} grade={data[0].grade}>
                                <Text style={styles.climbName}>{data[0].name}</Text>
                                <View>
                                <Text style={styles.timerInfo}>
                                    {timeStampFormatting(data[0].tapTimestamp).replace(/AM|PM/i, '').trim()}
                                </Text>
                                </View>
                            </ListItemSessions>
                        </View>
                        <Text style={{color: 'black', padding: 5, fontSize: 12}}>Last Climb</Text>
                    </View>
                    </View>
                </View>
            </View>
            </TouchableOpacity>
        </ScrollView>
    );
}
//Just passing the highlighted variable for rendering in ClimbItem
export default SessionItem;