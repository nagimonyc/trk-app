import React, { useState, useContext } from "react";
import { Text, Button, View, ScrollView, Keyboard, TouchableWithoutFeedback, TouchableOpacity, SafeAreaView, StyleSheet, TextInput } from "react-native";
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from "../../Utils/AuthContext";
import { useNavigation } from '@react-navigation/native'; 
import ClimberPerformance from "../../Components/ClimberPerformance";

const FeedbackForm = ({ route }) => {
  const { climbName } = route.params;
  const { climbGrade } = route.params;
  const { climbId } = route.params;

  const {  currentUser } = useContext(AuthContext);
  const userId = currentUser.uid;
  
  const navigation = useNavigation();

  const [rating, setRating] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleFeedback = async() => {

 
    try {
      await firestore()
        .collection('comments')
        .add({
          type: 'Feedback',
          rating: rating,
          user: userId,
          explanation: explanation,
          climb: climbId,
          timestamp: new Date(),
        });
      console.log('Feedback submitted!');
      navigation.goBack();
    } catch (error) {
      console.error("Error writing document: ", error);
    }


  }; 




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
                <Text style={styles.subtitle}>Rating</Text>
                <SegmentedControl
                  values={['1', '2', '3', '4', '5']}
                  selectedIndex={selectedIndex}
                  tintColor="#007AFF"
                  appearance='light'
                  onChange={(event) => {
                    setRating(event.nativeEvent.value);
                    setSelectedIndex(event.nativeEvent.selectedSegmentIndex);
                  }}
                />
                <Text style={styles.subtitle}>Reason for your rating</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={"#b1b1b3"}
                  value={explanation}
                  onChangeText={setExplanation}
                  placeholder="Enter reason"
                ></TextInput>

                <Button
                  title="Submit review"
                  disabled={!rating}
                  onPress={handleFeedback}
                />
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
    color: 'black'
  },
  feedback: {
    marginTop: 20,
    padding: 15,  
    width: '100%',
    color: 'black'
  },
  input: {
    backgroundColor: '#dedee0',
    height: 150, 
    marginBottom: 10,
    borderRadius: 8,
    paddingBottom: 120, // Add some padding for iOS
    paddingLeft: 10,
    textAlignVertical: 'top',
    color: 'black'
  },
  subtitle: {
    fontSize: 17,
    marginTop: 23, 
    marginBottom: 6,
    color: 'black'
  },
});




export default FeedbackForm