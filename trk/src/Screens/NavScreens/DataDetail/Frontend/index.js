import React, { useState, useEffect } from "react";
import { Text, View, ScrollView, SafeAreaView, StyleSheet, Image } from "react-native";

const DataDetail = ({ route }) => {

  const title = route.params;

  return (
    <ScrollView>
      <SafeAreaView>
        <View >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.main}>
          <Text>This feature is coming soon 🔥</Text>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

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
  main: {
    marginLeft: 20,
    marginTop: 20,
  },
})

export default DataDetail;