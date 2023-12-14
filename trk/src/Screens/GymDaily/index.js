import React from "react";
import { Text, View, ScrollView, SafeAreaView, StyleSheet } from "react-native";

const GymDaily = () => {
  return (
    <ScrollView>
      <SafeAreaView>
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>Latest</Text>
          </View>
          <View style={styles.boxCollection}>
            <View style={styles.row}>
              <View style={styles.box}>
                <Text>Total ascents</Text>
              </View>
              <View style={styles.box}>
                <Text>Most popular climb</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.box}>
                <Text>Highest rated climb</Text>
              </View>
              <View style={styles.box}>
                <Text>Latest feedback</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.box}>

              </View>
              <View style={styles.box}>

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
    borderColor: 'grey', 
    margin: 5, 
  },
});

export default GymDaily;
