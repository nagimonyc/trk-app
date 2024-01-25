import React, { useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import TapsApi from '../../../../api/TapsApi';
import ClimbsApi from '../../../../api/ClimbsApi';

import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TextInput, Button, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';

import storage from '@react-native-firebase/storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { AuthContext } from '../../../../Utils/AuthContext';
import { fetchClimbData, getTapDetails, loadImageUrl, updateTap, archiveTap, handleUpdate, onFeedback, onDefinition, getSelectedIndex } from '../Backend/ClimbDetailLogic';

function ClimbDetail(props) {
  console.log('[TEST] ClimbDetail called');

  const { climbId, isFromHome } = props.route.params;
  const [climbData, setClimbData] = useState(props.route.params.climbData || null);
  const [isLoading, setIsLoading] = useState(isFromHome);
  const [climbImageUrl, setClimbImageUrl] = useState(null);
  const [setterImageUrl, setSetterImageUrl] = useState(null);
  const [completion, setCompletion] = useState('Zone');
  const [attempts, setAttempts] = useState('1');
  const [witness1, setWitness1] = useState('');
  const [witness2, setWitness2] = useState('');
  const { currentUser, role } = useContext(AuthContext);
  const [tapId, setTapId] = useState(props.route.params.tapId || null);


  const { navigation } = props;

  useEffect(() => {
    if (isFromHome && climbId) {
      async function fetchData() {
        try {
          const { climbData, tapId } = await fetchClimbData(climbId, currentUser, role);
          setClimbData(climbData);
          if (tapId) {
            setTapId(tapId);
            Alert.alert('Success', 'Climb saved to Profile.', [{ text: 'OK' }]);
          }
        } catch (error) {
          console.log('Error caught:', error);
          Alert.alert(
            "Error",
            error.message,
            [{ text: "OK", onPress: () => navigation.goBack() }],
            { cancelable: false }
          );
        } finally {
          setIsLoading(false);
        }
      }
      fetchData();
    }
  }, [climbId, isFromHome, currentUser.uid, navigation]);

  useEffect(() => {
    const fetchData = async () => {
      if (props.route.params.profileCheck && tapId) {
        //const { getTap } = TapsApi();
        try {
          const tap = await getTapDetails(tapId)  // Using await here
          let stringCompletion;
          if (tap.completion === 0.5) {
            stringCompletion = 'Zone'
          } else if (tap.completion === 1) {
            stringCompletion = 'Top'
          } else {
            stringCompletion = 'Zone'
          }
          setCompletion(stringCompletion);

          let stringAttempts;
          if (tap.attempts === 1) {
            stringAttempts = '1'
          } else if (tap.attempts === 2) {
            stringAttempts = '2'
          } else if (tap.attempts === 3) {
            stringAttempts = '3'
          } else if (tap.attempts === 4) {
            stringAttempts = '4'
          } else {
            stringAttempts = '1'
          }
          setAttempts(stringAttempts);

          setWitness1(tap.witness1);
          setWitness2(tap.witness2);
        } catch (error) {
          console.error('Error getting tap:', error);
        }
      }
    };

    fetchData();  // Call the async function
  }, [props.route.params.profileCheck, props.route.params.tapId]);  // dependencies array


  useEffect(() => {
    const loadImages = async () => {
      try {
        // Default image path
        let climbImageURL = 'climb photos/the_crag.png';

        // If there is climb data and images are available, use the latest image
        if (climbData && climbData.images && climbData.images.length > 0) {
          const latestImageRef = climbData.images[climbData.images.length - 1];
          climbImageURL = latestImageRef.path;
        }

        // Load climb image
        const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
        setClimbImageUrl(loadedClimbImageUrl);

        // Load setter image
        const setterImageUrl = await loadImageUrl('profile photos/marcial.png');
        setSetterImageUrl(setterImageUrl);
      } catch (error) {
        console.error("Error loading images: ", error);
      }
    };

    loadImages();
  }, [climbData]);

  if (isLoading || !climbData) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: 'black' }}>Fetching climb information...</Text>
      </View>
    );
    //  the reason i put this here is because we will eventually display name and grade here when we encode it onto the nfc tags 
    //  right now it means that if there is no wifi, something is shown on screen
  } else if (climbData.set === 'Competition') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView>
          <View style={styles.container}>
            <View style={[styles.wrapper]}>
              <SafeAreaView />
              <View style={styles.top}>
                <View style={styles.topLeft}>
                  <View style={styles.gradeCircle}>
                    <Text>{climbData.grade}</Text>
                  </View>

                  <Text style={styles.titleText}>{climbData.name}</Text>
                </View>
              </View>
              <View style={styles.line}></View>


              <SafeAreaView style={styles.contentArea} >
                <View style={styles.group}>
                  <Text style={styles.title}>IFSC score:</Text>
                  <Text>{climbData.ifsc}</Text>
                </View>
                <View style={styles.group}>
                  <Text style={styles.title}>Type:</Text>
                  <Text>{climbData.type}</Text>
                </View>
                <View style={styles.group}>
                  <Text>Completion</Text>
                </View>
                <View style={styles.segmentedControlContainer}>
                  <SegmentedControl
                    values={['Zone', 'Top']}
                    tintColor="#007AFF"
                    selectedIndex={completion === "Zone" ? 0 : 1} // set the initially selected index
                    style={styles.segmentedControl}
                    onChange={(event) => {
                      setCompletion(event.nativeEvent.value);
                    }}
                  />
                </View>
                <View style={styles.group}>
                  <Text>Attempts</Text>
                  <View style={styles.segmentedControlContainer}>
                    <SegmentedControl
                      values={['⚡️', '2', '3', '4']}
                      tintColor="#007AFF"
                      selectedIndex={getSelectedIndex(attempts)} // set the initially selected index
                      style={styles.segmentedControl}
                      onChange={(event) => {
                        setAttempts(event.nativeEvent.value);
                      }}
                    />
                  </View>
                </View>
                <View style={styles.group}>
                  <Text style={styles.title}>Witness 1</Text>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={"#b1b1b3"}
                    value={witness1}
                    onChangeText={setWitness1}
                    placeholder="Enter witness 1"
                  />
                </View>
                <View style={styles.group}>
                  <Text style={styles.title}>Witness 2</Text>
                  <TextInput
                    style={styles.input}
                    placeholderTextColor={"#b1b1b3"}
                    value={witness2}
                    onChangeText={setWitness2}
                    placeholder="Enter witness 2"
                  />
                </View>
                <Button
                  title="Update"
                  disabled={!witness1 || !witness2 || !completion || !attempts}
                  onPress={() => handleUpdate(completion, attempts, witness1, witness2, tapId)}
                >

                </Button>
              </SafeAreaView>

            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    )
  }
  else {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView>
          <View style={styles.container}>
            <View style={[styles.wrapper]} >
              <SafeAreaView />
              <View style={styles.top}>
                <View style={styles.topLeft}>
                  <View style={styles.gradeCircle}>
                    <Text>{climbData.grade}</Text>
                  </View>

                  <Text style={styles.titleText}>{climbData.name}</Text>
                </View>
                <View style={styles.setterCircle}>
                  {setterImageUrl ? <Image source={{ uri: setterImageUrl }} style={{ width: '100%', height: '100%' }} /> : <Text>Loading...</Text>}
                </View>
              </View>
              <View style={styles.line}></View>
              <View style={styles.descriptorsContainer}>
                {climbData.descriptors && climbData.descriptors.map((descriptor, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.descriptorButton}
                    onPress={() => onDefinition(navigation, descriptor)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.descriptorText}>{descriptor}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.climbPhoto}>
                {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} /> : <Text>Loading...</Text>}
              </View>

              <View style={{ marginTop: 20 }}>
                <View style={styles.button}>
                  <Button title='Review this climb' onPress={() => onFeedback(navigation, climbData, climbId)} />
                </View>
              </View>
              {climbData.info && (
                <View style={styles.infoBox}>
                  <Text style={styles.subheading}>Climb Info</Text>
                  <Text style={styles.info}>{climbData.info}</Text>
                </View>
              )}
              {role == 'climber' && <>
                <View style={styles.button}>
                  <Button title='Delete Tap' onPress={() => archiveTap(navigation, tapId)} color="red" />
                </View>
              </>}
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  wrapper: {
    width: '90%',
    marginTop: 5,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8.78,
    borderColor: '#f2f2f2',
    borderWidth: 1.49,
  },
  top: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleText: {
    flexShrink: 1, // To prevent text overflow
    fontWeight: 'bold',
    marginLeft: 15,
    fontSize: 17.57,
    flexWrap: 'wrap',
    maxWidth: '60%',
    color: 'black',
  },

  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C73B3B', //this color is hardcoded for now, but needs to match the level/grading system of the gym
    alignItems: 'center',
    justifyContent: 'center',
  },
  setterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 50,
    overflow: 'hidden',
  },
  line: {
    width: 200,
    height: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.26)',
    marginTop: 30,
  },

  climbPhoto: {
    width: 197,
    height: 287,
    marginTop: 22,
    backgroundColor: 'white',
    borderRadius: 3.88,
  },
  contentArea: {
    padding: 10,  // Add padding around the content
    width: '100%',
  },
  group: {
    marginBottom: 10,
    marginTop: 10,  // Add space below each group
  },
  title: {
    fontWeight: 'bold',
  },
  button: {
    marginTop: 10
  },
  infoBox: {
    paddingVertical: 15,
    alignSelf: 'center', // Align the box itself to the center
    paddingHorizontal: 30,
    width: '100%', // Ensure it takes the full width if you want to center content inside
  },
  subheading: {
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'center', // Center the text inside
    color: 'black',
  },
  info: {
    fontSize: 16,
    textAlign: 'center', // Center the text inside
    color: 'black',
  },
  descriptorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,  // Add vertical margin for spacing
  },
  descriptorButton: {
    marginHorizontal: 5,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#e7e7e7', // Slightly different background color
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e7e7e7', // Add border
  },

  descriptorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF', // Color indicating it's clickable (like a link)
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  }
})

export default ClimbDetail;