import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Modal } from "react-native";
import { AuthContext } from '../Utils/AuthContext';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { fetchSets } from '../Screens/TabScreens/GymAnalytics/GymDaily/Backend/analyticsCalculations';

const VideoGrid = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

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
    // Update viewableItems with the keys of viewable items, ensuring keys are stored as strings
    const newViewableItems = new Set(viewableItems.map(item => item.key.toString()));
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
    // Extract video URL, accommodating both string URLs and object { url, role } formats
    const videoUrl = typeof item === 'object' && item.url ? item.url : item;

    // Check if the current item is viewable. Use the item's index as a string for key comparison.
    const isVisible = viewableItems.has(index.toString());

    return (
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={() => {
          setCurrentVideoUrl(videoUrl); // Set the URL for the video to be played
          setModalVisible(true); // Show the modal
        }}>
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode="cover"
          controls={true}
          paused={!viewableItems.has(index.toString())} // Assume you want to pause when not in view
          repeat={false}
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible); // Allows modal to be closed
        }}
      >
        <TouchableOpacity
          style={styles.centeredView}
          activeOpacity={1}
          onPressOut={() => setModalVisible(!modalVisible)} // Close modal on outside touches
        >
          <View style={styles.modalView} onStartShouldSetResponder={() => true}>
            <Video
              source={{ uri: currentVideoUrl }}
              style={styles.modalVideo}
              resizeMode="contain"
              controls={true}
              autoplay={true}
            />
            {/* Add any other modal content here */}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Keep your existing styles as they are
  centeredView: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 80,
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  modalView: {
    backgroundColor: "black",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
    height: '85%',
  },
  modalVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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