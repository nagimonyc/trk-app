import React from "react";
import { Text, View, ScrollView, Keyboard, TouchableWithoutFeedback, TouchableOpacity, SafeAreaView,StyleSheet, TextInput } from "react-native";

const FeedbackForm = () => {

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView>
    <SafeAreaView>
    <Text>Any other comments?</Text>
    <TextInput></TextInput>
    </SafeAreaView>
    </ScrollView>
    </TouchableWithoutFeedback>
  )
};

export default FeedbackForm