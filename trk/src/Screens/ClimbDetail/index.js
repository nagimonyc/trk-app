import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

function ClimbDetail(props) {
  const { climbData } = props.route.params;
  return (
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
        <Text>{climbData.setter}</Text>
        </View>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white'
  },
  top: {
    flexDirection: 'row',
    margin: 50, 
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
    borderRadius: 47,     
    backgroundColor: '#C73B3B', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 50,
  },
})

export default ClimbDetail;