import React, { useState, useContext } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView, Touchable } from "react-native";
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from "../../../../Utils/AuthContext";
import { useNavigation } from '@react-navigation/native';

const DeveloperFeedbackForm = () => {
  const navigation = useNavigation();
  const { currentUser } = useContext(AuthContext);
  const [response, setResponse] = useState('');
  const [canContact, setCanContact] = useState(false);
  const { resetOnboarding } = useContext(AuthContext);

  const handleFeedbackSubmit = async () => {
    // Check if feedback is empty
    if (!response.trim()) {
      Alert.alert("Feedback Required", "Please enter your feedback before submitting.");
      return;
    }

    try {
      await firestore()
        .collection('comments')
        .add({
          userId: currentUser.uid,
          timestamp: new Date(),
          response: response,
          canContact: canContact,
          type: 'developerFeedback'
        });
      //console.log('Feedback submitted!');
      Alert.alert("Feedback Submitted", "Thanks for taking the time to provide feedback, we value your thoughts on how to improve the app!");
      navigation.goBack(); // Navigate back after submission
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      Alert.alert("Submission Error", "There was a problem submitting your feedback.");
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={{ justifyContent: 'center', alignItems: 'center', height: '50%' }}>
          <TouchableOpacity style={styles.button} onPress={() => {
            resetOnboarding(); // Optionally reset onboarding state if needed
            navigation.navigate('RecordPage_stack', { showOnboardingModal: true }); // Adjust the screen name if necessary
          }}>
            <Text style={{ fontSize: 20 }}>Rewatch Onboarding Tutorial</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.wrapper]}>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Your feedback here"
            placeholderTextColor="#b1b1b3"
            value={response}
            onChangeText={setResponse}
          />
          <TouchableOpacity onPress={() => setCanContact(!canContact)} style={styles.checkboxContainer}>
            <View style={[styles.checkbox, canContact && styles.checkboxActive]}>
              {canContact && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>I agree to be contacted for further feedback</Text>
          </TouchableOpacity>
          <TouchableOpacity  onPress={handleFeedbackSubmit}>
                    <Text style={[{color: '#007aff', fontSize: 15, alignSelf: 'center', paddingTop: 10}]}>Submit Feedback</Text>
          </TouchableOpacity>
        </View>
      </ScrollView >
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white', // Ensure background is white
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  wrapper: {
    width: '100%', // Set wrapper width to 100%
    padding: 20,   // Add padding for inner spacing
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'black', // Title text color
    textAlign: 'center', // Center title text
    width: '100%' // Set title width to 100%
  },
  input: {
    backgroundColor: '#dedee0',
    height: 150,
    marginBottom: 10,
    borderRadius: 8,
    paddingBottom: 120, // Add some padding for iOS
    paddingLeft: 10,
    textAlignVertical: 'top',
    color: 'black',
    width: '100%'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%' // Set checkbox container width to 100%
  },
  checkbox: {
    width: 20,
    height: 20,
    borderColor: 'gray',
    borderWidth: 1,
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#007AFF',
  },
  checkboxCheck: {
    color: 'white',
  },
  checkboxLabel: {
    fontSize: 16,
    color: 'black', // Checkbox label text color
  },
  button: {
    // Style your button
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    borderColor: '#fe8100',
    display: 'flex',
    flexDirection: 'column',
    borderStyle: 'dashed'
  },
});

export default DeveloperFeedbackForm;
