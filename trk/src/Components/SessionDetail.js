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

const SessionDetail = ({route}) => {
  const navigation = useNavigation();
  let data = route.params.data;
  const title = route.params.title;
  //data[0].images = [{path: 'climb photos/the_crag.png'},{path: 'climb photos/the_crag.png'},{path: 'climb photos/the_crag.png'},{path: 'climb photos/the_crag.png'}];
  const allImages = useMemo(() => {
    return data.flatMap(item => item.sessionImages ? item.sessionImages : []);
  }, [data]);  
  console.log('All Images: ', allImages);
  let initallySelected = null;
  let initialText = null;
  let selectedData = null;
  console.log(data);
  //Selected Item Set
  if (data.length>0) {
      selectedData = data.filter(obj => obj.isSelected == true);
      console.log('The selected Data is: ', selectedData);
      if (selectedData.length == 0) {
          initallySelected = data[0].tapId;
          selectedData = [data[0]];
          console.log('Initially selected value is: ', initallySelected);
      } else {
          initallySelected = selectedData[0].tapId;
          console.log('Initially selected value is: ', initallySelected);
      }
      if (data[data.length-1].sessionTitle === undefined || (data[data.length-1].sessionTitle && data[data.length-1].sessionTitle === '')) {
          initialText = 'Session on '+title[1];
      }
      else {
          initialText = data[data.length-1].sessionTitle;
      }
      console.log('Initial session text: ', initialText);
  }

  const [climbImageUrl, setClimbImageUrl] = useState(null);
  const { currentUser } = useContext(AuthContext);

  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
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

    const calculateDuration = (data) => {
        if (data.length < 2) {
            return '0 minutes';
        }
    
        // Assuming timestamps are in milliseconds
        const firstTimestamp = data[0].tapTimestamp.toDate(); // Most recent
        const lastTimestamp = data[data.length - 1].tapTimestamp.toDate(); // Oldest
    
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
          } catch (error) {
            console.error("Error loading images: ", error);
          }
        };
        loadImages();
    }, [data]);


    const EditButton = ({ onPress }) => {
        return (
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Icon name="more-horiz" size={20} color="black" />
            </TouchableOpacity>
        );
    };

  return (
    <SafeAreaView style={styles.container}>
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
                            <Text style={{color: 'black', fontSize: 25, fontWeight: '500'}}>{data.length}</Text>
                            <Text style={{color: 'black', fontSize: 12}}>Total Climbs</Text>
                        </View>
                        <View style={{width: '50%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center'}}>
                            <View style={{marginRight: 10}}>
                                <ListItemSessions dotStyle={styles.climbDot} grade={selectedData[0].grade}>
                                    <Text style={styles.climbName}>{selectedData[0].name}</Text>
                                    <View>
                                    <Text style={styles.timerInfo}>
                                        {timeStampFormatting(selectedData[0].tapTimestamp).replace(/AM|PM/i, '').trim()}
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
            <Text style={{color: 'black', fontSize: 25, fontWeight: '500'}}>{calculateDuration(data)}</Text>
            <Text style={{color: 'black', fontSize: 12}}>Session Duration</Text>
            </View>
            <View style={{display: 'flex', width: '30%', justifyContent: 'center', alignItems: 'center', padding: 20}}>
                <EditButton onPress={() => {navigation.navigate('Edit_Session', {data: data, title: title})}}/>
            </View>
        </View>

        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 10}}>
            <Text style={{color: 'black', paddingHorizontal: 20, fontWeight: 'bold'}}>Session Graph</Text>
        </View>
        <View style={{width: '100%', justifyContent:'center', display:'flex', alignItems: 'center', flexDirection: 'row', padding: 10}}>
            <SessionGraph data={data}/>
        </View>

        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 10}}>
            <Text style={{color: 'black', paddingHorizontal: 20, fontWeight: 'bold'}}>{allImages.length>0? 'All Media': 'No Media'}</Text>
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', padding: 10}}>
            <FlatList
                data={allImages}
                horizontal={true}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => {handleImagePress(item.path)}}>
                    <ImageItem imagePath={item.path} />
                    </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
            />
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row', paddingTop: 10}}>
            <Text style={{color: 'black', paddingHorizontal: 20, fontWeight: 'bold'}}>Climb Details</Text>
        </View>
        <View style={{width: '100%', justifyContent:'flex-start', display:'flex', alignItems: 'center', flexDirection: 'row'}}>
            <ListHistory
            data={data}
            renderItem={(item, index, isHighlighted) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={timeStampFormatting(item.tapTimestamp)} fromHome={false} isHighlighted={(index == 0 && isHighlighted)}/>}
            //highlighted variable passed for index 0, only if it is an active session
            keyExtractor={(item, index) => index.toString()}
            isHighlighted = {false}
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