import React, { useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TextInput, Button, TouchableWithoutFeedback, Keyboard, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
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
          //console.log('Error caught:', error);
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
      <KeyboardAvoidingView style={{ flex: 1 }} // Make KeyboardAvoidingView take up the entire screen
        behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust behavior based on platform
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Optional: adjust the offset
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView>
            <View style={styles.container}>
              <View style={[styles.wrapper]}>
                <SafeAreaView />
                <View style={styles.top}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={[styles.gradeCircle, { alignSelf: 'center' }]}>
                      <Text style={{ alignItems: 'center' }}>{climbData.grade}</Text>
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
      </KeyboardAvoidingView>
    )
  }
  else {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView>
          <View style={styles.container}>
            <View style={[styles.wrapper]} >
              <SafeAreaView />
              <View style={styles.header}>
                <View style={styles.setterCircle}>
                  {setterImageUrl ? <Image source={{ uri: setterImageUrl }} style={{ width: '100%', height: '100%' }} /> : <Text>Loading...</Text>}
                </View>
                <Text style={styles.setText}>Set by Eddie P.</Text>
                <View style={styles.button}>
                  <TouchableOpacity onPress={() => onFeedback(navigation, climbData, climbId)}>
                    <Text style={[{ color: '#007aff', marginLeft: 50, fontSize: 15 }]}>Review this climb</Text>
                  </TouchableOpacity>
                </View>

              </View>
              <View style={styles.line}></View>

              <View style={styles.verticalAlignmentContainer}>

                <View style={styles.top}>
                  <View style={styles.dataPair}>
                    <Text style={styles.subheading}>Grade</Text>
                    <View style={styles.gradeCircle}>
                      <Text style={[{ color: 'black', alignSelf: 'center' }]}>{climbData.grade}</Text>
                    </View>
                  </View>
                  <View style={styles.dataPair}>
                    <Text style={styles.subheading}>Name</Text>
                    <Text style={styles.titleText}>{climbData.name}</Text>
                  </View>


                </View>

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


                {climbData.info && (
                  <View style={styles.infoBox}>
                    <Text style={styles.subheading}>Info</Text>
                    <Text style={styles.info}>{climbData.info}</Text>
                  </View>
                )}

                <View style={styles.climbPhoto}>
                  <Text style={styles.subheading}>Photo</Text>
                  {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%', borderRadius: 5 }} /> : <Text>Loading...</Text>}
                </View>
                {role == 'climber' && <>
                  <View style={[styles.button, { marginTop: 40, alignItems: 'center', marginRight: 30 }]}>
                    <TouchableOpacity onPress={() => archiveTap(navigation, tapId)} color="red" >
                      <Text style={[{ color: '#fe0100', fontSize: 15 }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </>}
              </View>
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
  header: {
    flexDirection: 'row',
  },
  verticalAlignmentContainer: {
    marginLeft: 30,
    width: '100%',

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
    fontSize: 20,
    flexWrap: 'wrap',
    // maxWidth: '60%',
    color: 'black',
    marginTop: 5
  },
  dataPair: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    width: '50%',

  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    color: 'black',
    borderColor: '#fe8100',
    borderWidth: 1,
    padding: 8,
    alignItems: 'center', // Center content horizontally
    justifyContent: 'center', // Center content vertically
  },
  setterCircle: {
    width: 40,
    height: 40,
    borderRadius: 45,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginLeft: -10,
  },
  line: {
    width: '95%',
    height: 0.5,
    borderTopWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.26)',
    marginTop: 10,
  },

  climbPhoto: {
    width: '90%',
    height: 400,
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
    paddingBottom: 20,
    width: '100%', // Ensure it takes the full width if you want to center content inside

  },
  subheading: {
    fontWeight: '300',
    color: 'black',
    fontSize: 10,
    marginBottom: 3,
  },
  info: {
    fontSize: 16,

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
  },
  setText: {
    color: 'black',
    fontWeight: '400',
    marginTop: 10,
    marginLeft: 5,
    fontSize: 13,
  },
})

export default ClimbDetail;