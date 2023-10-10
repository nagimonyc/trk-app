import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

function ClimbDetail(props) {
  const { climbData } = props.route.params;
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
          <Text>Insert setter photo</Text>
        </View>
      </View>
      <View style={styles.line}></View>
      <View style={styles.climbPhoto}>
        <Text>Insert climb photo</Text>
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
  },
  top: {
    flexDirection: 'row',
    marginTop: 28,
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
    backgroundColor: '#ff9a00'
  },
})

export default ClimbDetail;