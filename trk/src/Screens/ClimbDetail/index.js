import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import TapsApi from '../../api/TapsApi';

import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, Button } from 'react-native';

import storage from '@react-native-firebase/storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

function ClimbDetail(props) {
  console.log('[TEST] ClimbDetail called');


  const { climbData } = props.route.params;
  const [climbImageUrl, setClimbImageUrl] = useState(null);
  const [setterImageUrl, setSetterImageUrl] = useState(null);
  const [completion, setCompletion] = useState('1/2');
  const [attempts, setAttempts] = useState('1');
  const [witness1, setWitness1] = useState('');
  const [witness2, setWitness2] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      if (props.route.params.profileCheck) {
        const { getTap } = TapsApi();
        const { tapId } = props.route.params;
        try {
          const tap = (await getTap(tapId)).data();  // Using await here
          let stringCompletion;
          if (tap.completion === 0.5) {
            stringCompletion = '1/2'
          } else if (tap.completion === 1) {
            stringCompletion = 'full'
          } else {
            stringCompletion = '1/2'
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





  const handleUpdate = async () => {
    const { tapId } = props.route.params;

    let numericCompletion;
    if (completion === '1/2') {
      numericCompletion = 0.5;
    } else if (completion === 'full') {
      numericCompletion = 1;
    }

    let numericAttempts;
    if (attempts === '⚡️') {
      numericAttempts = 1;
    } else {
      numericAttempts = parseInt(attempts, 10); // Convert to integer if it's not the flash emoji
    }

    const updatedTap = {
      completion: numericCompletion,
      attempts: numericAttempts,
      witness1: witness1,
      witness2: witness2,
    };
    try {
      const { updateTap } = TapsApi();
      await updateTap(tapId, updatedTap);
      Alert.alert("Success", "Tap has been updated");
    } catch (error) {
      Alert.alert("Error", "Couldn't update tap");
    }
  }

  const getSelectedIndex = (value) => {
    if (value === '⚡️') {
      return 0;  // '⚡️' represents a '1', so return 0 for the index
    } else {
      return parseInt(value, 10) - 1;
    }
  };



  // useEffect(() => {
  //   const climbReference = storage().ref('climb photos/the_crag.png');
  //   climbReference.getDownloadURL()
  //     .then((url) => {
  //       setClimbImageUrl(url);
  //     })
  //     .catch((error) => {
  //       console.error("Error getting climb image URL: ", error);
  //     });

  //   const setterReference = storage().ref('profile photos/epset.png');
  //   setterReference.getDownloadURL()
  //     .then((url) => {
  //       setSetterImageUrl(url);
  //     })
  //     .catch((error) => {
  //       console.error("Error getting setter image URL: ", error);
  //     });
  // }, []);



  if (climbData.set === 'Competition') {
    return (
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
                values={['1/2', 'full']}
                tintColor="#007AFF"
                selectedIndex={completion === "1/2" ? 0 : 1} // set the initially selected index
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
                value={witness1}
                onChangeText={setWitness1}
                placeholder="Enter witness 1"
              />
            </View>
            <View style={styles.group}>
              <Text style={styles.title}>Witness 2</Text>
              <TextInput
                style={styles.input}
                value={witness2}
                onChangeText={setWitness2}
                placeholder="Enter witness 2"
              />
            </View>
            <Button
              title="Update"
              disabled={!witness1 || !witness2 || !completion || !attempts}
              onPress={handleUpdate}
            >

            </Button>
          </SafeAreaView>

        </View>
      </View>
    )
  }
  else {
    return (
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
          <View style={styles.climbPhoto}>
            {climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} /> : <Text>Loading...</Text>}
          </View>

        </View>
      </View>
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
    width: 317,
    height: 539.89,
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
    backgroundColor: '#CDB58F',
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
    marginTop: 55,
  },

  climbPhoto: {
    width: 197,
    height: 287,
    marginTop: 42,
    backgroundColor: '#ff9a00',
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
})

export default ClimbDetail;