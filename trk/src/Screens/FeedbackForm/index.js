import React, {useState} from "react";
import { Text, View, ScrollView, Keyboard, TouchableWithoutFeedback, TouchableOpacity, SafeAreaView, StyleSheet, TextInput } from "react-native";

const FeedbackForm = ({ route }) => {
  const { climbName } = route.params;
  const { climbGrade } = route.params;

  const [rating, setRating] = useState(null);
  const [explanation, setExplanation] = useState(null);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView>
        <SafeAreaView>
          <View style={styles.container}>
            <View style={styles.wrapper}>
              <View style={styles.top}>
                <View style={styles.topLeft}>
                  <View style={styles.gradeCircle}>
                    <Text>{climbGrade}</Text>
                  </View>
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>{climbName}</Text>
                </View>
              </View>
              <View style={styles.feedback}>
                <Text>Rate this climb</Text>
                <TextInput></TextInput>
              </View>

            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </TouchableWithoutFeedback>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {
    width: '90%',
    marginTop: 5,
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8.78,
    borderColor: '#f2f2f2',
    borderWidth: 1.49,
  },
  top: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  topLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C73B3B',
    marginLeft: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 5, // Take up the remaining space
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: 17.57,
    marginRight: 35,
  },
  feedback: {
    marginTop: 40,
  }
});




export default FeedbackForm