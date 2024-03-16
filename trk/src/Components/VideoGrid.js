import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image } from "react-native";
import { AuthContext } from '../Utils/AuthContext';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { fetchSets } from '../Screens/TabScreens/GymAnalytics/GymDaily/Backend/analyticsCalculations';

const VideoGrid = () => {
  const { currentUser } = useContext(AuthContext);
  const [videos, setVideos] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [openSetPicker, setOpenSetPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewableItems, setViewableItems] = useState(new Set()); // Track viewable items

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50 // Adjust as needed
  });

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const newViewableItems = new Set(viewableItems.map(item => item.key));
    setViewableItems(newViewableItems);
  });

  useEffect(() => {
    setLoading(true);
    fetchSets().then(({ uniqueSets, defaultSelected }) => {
      const dropdownSets = uniqueSets.map((set, index) => ({ label: set.label, value: index }));
      setSets(dropdownSets);
      setSelectedSetId(defaultSelected ?? 0);
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching sets:', error);
      setLoading(false);
    });
  }, [currentUser.uid]);

  useEffect(() => {
    if (selectedSetId == null || sets.length === 0) return;

    setLoading(true);
    const setName = sets[selectedSetId].label;

    // Fetch the selected set document from Firestore
    firestore().collection('sets').where('name', '==', setName).get()
      .then(setSnapshot => {
        if (setSnapshot.empty) {
          throw new Error(`No sets found with the name '${setName}'`);
        }
        const setDoc = setSnapshot.docs[0];
        const climbIds = setDoc.data().climbs;
        return Promise.all(climbIds.map(climbId =>
          firestore().collection('taps').where('climb', '==', climbId).get()
        ));
      })
      .then(tapsSnapshots => {
        let videoList = [];
        tapsSnapshots.forEach(snapshot => {
          if (!snapshot.empty) {
            snapshot.forEach(doc => {
              const tapVideos = doc.data().videos || [];
              videoList = [...videoList, ...tapVideos];
            });
          }
        });
        setVideos(videoList);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching videos for set:', error);
        setLoading(false);
      });
  }, [selectedSetId, sets]);

  const renderVideoItem = ({ item, index }) => {
    const isVisible = viewableItems.has(item);

    return (
      <TouchableOpacity style={styles.videoContainer} onPress={() => {/* Handle play logic if necessary */ }}>
        <Video
          source={{ uri: item }}
          style={styles.video}
          resizeMode="cover"
          controls={true}
          paused={!isVisible} // Video is paused by default unless it's viewable
          repeat={true} // Loop video
          // Important: mute the video by default to comply with auto-play policies
          muted={true}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <DropDownPicker
        listMode="SCROLLVIEW"
        open={openSetPicker}
        value={selectedSetId}
        items={sets}
        setOpen={setOpenSetPicker}
        setValue={setSelectedSetId}
        setItems={setSets}
        containerStyle={styles.dropdownContainer}
        dropDownContainerStyle={styles.dropdownStyle}
        zIndex={3000}
        zIndexInverse={1000}
      />
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3}
        contentContainerStyle={styles.videoGrid}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        extraData={viewableItems} // Ensures FlatList updates when viewable items change
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoGrid: {
    marginTop: 10,
  },
  videoContainer: {
    width: 110, // Adjust based on your layout
    height: 200, // Adjust for a 16:9 aspect ratio
    margin: 5,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  dropdownContainer: {
    margin: 20,
    height: 40,
    width: '90%',
  },
  dropdownStyle: {
    backgroundColor: '#fafafa',
  },
  loader: {
    marginTop: 50,
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000', // Placeholder background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 24,
    color: '#FFF', // Play button text color
  },
});

export default VideoGrid;