import React, {useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import storage from '@react-native-firebase/storage';

function ClimbDetail(props) {
  console.log('[TEST] ClimbDetail called');
  const { climbData } = props.route.params;
  const [climbImageUrl, setClimbImageUrl] = useState(null);
  const [setterImageUrl, setSetterImageUrl] = useState(null);

  useEffect(() => {
    const climbReference = storage().ref('climb photos/the_crag.png');
    climbReference.getDownloadURL()
      .then((url) => {
        setClimbImageUrl(url);
      })
      .catch((error) => {
        console.error("Error getting climb image URL: ", error);
      });
    
    const setterReference = storage().ref('profile photos/epset.png');
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
            <Text>{climbData.grade}</Text>
          </View>

          <Text style={styles.titleText}>{climbData.name}</Text>
        </View>
        <View style={styles.setterCircle}>
          { setterImageUrl ? <Image source={{ uri: setterImageUrl }} style={{width: '100%', height: '100%'}} /> : <Text>Loading...</Text> }
        </View>
      </View>
      <View style={styles.line}></View>
      <View style={styles.climbPhoto}>
      { climbImageUrl ? <Image source={{ uri: climbImageUrl }} style={{width: '100%', height: '100%'}} /> : <Text>Loading...</Text> }
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
})

export default ClimbDetail;