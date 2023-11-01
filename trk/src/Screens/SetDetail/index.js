import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, Image, TextInput, Button } from 'react-native';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';


function SetDetail(props) {
  console.log('[TEST] SetDetail called')

  const { climbData } = props.route.params;
  console.log(`Climb id is ${climbData.id}`)

  const [tapCount, setTapCount] = useState(0);
  const [climbImageUrl, setClimbImageUrl] = useState(null);
  const [setterImageUrl, setSetterImageUrl] = useState(null);


  useEffect(() => {
    const fetchTapCount = async () => {
      try {
        const tapQuerySnapshot = await firestore()
          .collection('taps')
          .where('climb', '==', climbData.id)
          .get();
          
        setTapCount(tapQuerySnapshot.size);
      } catch (error) {
        console.error('Error fetching tap count:', error);
      }
    };

    fetchTapCount();
  }, [climbData.id]);


  useEffect(() => {
    console.log(`photo is : ${climbData.photo}`)
    const climbReference = climbData.photo ? storage().ref(`${climbData.photo}`) : storage().ref('climb photos/the_crag.png');
    climbReference.getDownloadURL()
      .then((url) => {
        setClimbImageUrl(url);
      })
      .catch((error) => {
        console.error("Error getting climb image URL: ", error);
      });

    const setterReference = storage().ref('profile photos/marcial.png');
    setterReference.getDownloadURL()
      .then((url) => {
        setSetterImageUrl(url);
      })
      .catch((error) => {
        console.error("Error getting setter image URL: ", error);
      });
  }, []);

  return (
    <View style={styles.container}>
    <View style={[styles.wrapper]} >
      <SafeAreaView />
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <View style={styles.gradeCircle}>
            <Text style={styles.grade}>{climbData.grade}</Text>
          </View>

          <Text style={styles.titleText}>{climbData.name}</Text>
        </View>
        <View style={styles.circleWrapper}>
        <View style={styles.setterCircle}>
        {setterImageUrl && <Image source={{ uri: setterImageUrl }} style={{ width: '100%', height: '100%' }} /> }
        </View>
        </View>
      </View>
      <View style={styles.countBox}>
      <Text style={styles.count}>{tapCount}</Text>
      </View>
      <View style={styles.climbPhoto}>
      {climbImageUrl && <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} />}
      </View>

    </View>
  </View>
  )
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
    flex: 1,
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
    marginLeft: 20,
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
    marginTop: 15,
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
  countBox: {
    marginTop: 15,
  },
  count: {
    fontSize: 45,
    fontWeight: '700'
  },
  circleWrapper: {
    width: 100,  // or whatever width keeps your layout consistent
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0
  },
  grade: {
    color: 'white',
  },
})

export default SetDetail;