import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, Animated} from 'react-native';

function ClimbDetail(props) {
  return (
    <View>
      <SafeAreaView/>
      <View>
        <Text>Climb Title</Text>
        <Text>Climb Level</Text>
        <Text>Climb Location</Text>
        <Text>Climb RouteSetter</Text>
        <Text>Climb Set On</Text>
      </View>
    </View>
  )
}

export default ClimbDetail;