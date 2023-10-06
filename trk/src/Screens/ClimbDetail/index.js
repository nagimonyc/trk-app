import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

function ClimbDetail(props) {
  const { climbData } = props.route.params;
  return (
    <View style={[styles.wrapper]} >
      <SafeAreaView/>
      <View style={[styles.center]}>
        {Object.entries(climbData).map(([key, value], index) => (
          <View key={index} style={styles.row}>
            <Text style={styles.keyText}>{key}</Text>
            <Text style={styles.valueText}>{value}</Text>
          </View>
        ))}
     
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 15,
  }, 
  center: {
    alignItems: 'center',
     
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keyText: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  valueText: {
    flexShrink: 1, // To prevent text overflow
  },
})

export default ClimbDetail;