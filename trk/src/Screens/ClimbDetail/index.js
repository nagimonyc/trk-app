import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

function ClimbDetail(props) {
  return (
    <View style={[styles.wrapper]} >
      <SafeAreaView />
      <View style={[styles.center]}>
        <Text>Climb Title</Text>
        <Text>Climb Level</Text>
        <Text>Climb Location</Text>
        <Text>Climb RouteSetter</Text>
        <Text>Climb Set On</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 15
  },
  center: {
    alignItems: 'center',

  }
})

export default ClimbDetail;