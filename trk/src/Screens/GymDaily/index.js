import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { Text, View, ScrollView, SafeAreaView, StyleSheet } from "react-native";

const GymDaily = () => {
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <ScrollView>
      <SafeAreaView>
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>Lead Cave</Text>
          </View>
          <View style={styles.boxCollection}>

            <View style={styles.row}>
              <View style={styles.box}>
                <Animated.Text style={[styles.activeBigNumber, { opacity: fadeAnim }]}>18</Animated.Text>
                <Text>Active Climbs</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.bigNumber}>43</Text>
                <Text>Total ascents</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.box}>
                <Text style={styles.routeTitle}>Slime - 5.11c</Text>
                <Text>Most completed route</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.routeTitle}>Slime - 5.11c</Text>
                <Text>Highest rated climb</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.box}>
                <Text style={styles.routeTitle}>Blue - 5.11d</Text>
                <Text>Least completed route</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.feedback}>'I loved this climb! It really challenged my core' - Yellow 5.10d</Text>
                <Text>Latest feedback</Text>

              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.box}>
                <Text style={styles.time}>6:50pm</Text>
                <Text>Most active time</Text>
              </View>
              <View style={styles.box}>
                <Text style={styles.bigNumber}>20</Text>
                <Text>Ascents since yesterday</Text>
              </View>
            </View>

          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  )
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  boxCollection: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  box: {
    width: '45%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    margin: 5,
    borderRadius: 12,
    backgroundColor: '#E6E6E6'
  },
  time: {
    fontWeight: 'bold',
    fontSize: 25,
    marginBottom: 20,
    color: '#3498db',
  },
  activeBigNumber: {
    fontWeight: 'bold',
    fontSize: 35,
    marginBottom: 13,
    color: 'green',
  },
  bigNumber: {
    fontWeight: 'bold',
    fontSize: 35,
    marginBottom: 13,
    color: '#ff8100',
  },
  routeTitle: {
    fontSize: 20,
    marginBottom: 20,
    color: '#ff8100',
    
  },
  feedback: {
    fontStyle: 'italic',
    padding: 10,
    color: 'black',
  }
});

export default GymDaily;
