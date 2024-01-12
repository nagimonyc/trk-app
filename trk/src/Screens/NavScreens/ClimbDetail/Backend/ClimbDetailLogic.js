import TapsApi from '../../../../api/TapsApi';
import ClimbsApi from '../../../../api/ClimbsApi';
import storage from '@react-native-firebase/storage';
import { Alert } from 'react-native';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, TextInput, Button, TouchableWithoutFeedback, Keyboard, Share, TouchableOpacity } from 'react-native';

export const fetchClimbData = async (climbId, currentUser, role) => {
  try {
    const climbDataResult = await ClimbsApi().getClimb(climbId);
    let tapId = null;
    if (climbDataResult && climbDataResult._data) {
      //setClimbData(climbDataResult._data);
      console.log("Fetched climb data:", climbDataResult._data);
      if (currentUser.uid !== climbDataResult._data.setter && role !== "setter") { //case for climbers (tap should log), else should not
        const { addTap } = TapsApi();
        const tap = {
          climb: climbId,
          user: currentUser.uid,
          timestamp: new Date(),
          completion: 0,
          attempts: '',
          witness1: '',
          witness2: '',
        };
        const documentReference = await addTap(tap);
        console.log('Tap created!');
        //setTapId(documentReference.id); // Set tapId only when navigating from home
        tapId = documentReference.id;
      }
      return { climbData: climbDataResult._data, tapId };
    } else {
      throw new Error("Climb data not found.");
    }
  } catch (error) {
    //console.error('Error fetching climb data:', error);
    throw new Error("Failed to load climb data.");
  }
};

export const getTapDetails = async (tapId) => {
  try {
    const { getTap } = TapsApi();
    const tap = (await getTap(tapId)).data();
    return tap;
  } catch (error) {
    console.error('Error getting tap:', error);
    throw error;
  }
};

export const loadImageUrl = async (imagePath) => {
  try {
    const url = await storage().ref(imagePath).getDownloadURL();
    return url;
  } catch (error) {
    console.error("Error getting image URL: ", error);
    throw error;
  }
};

export const handleUpdate = async (completion, attempts, witness1, witness2, tapId) => {

  let numericCompletion;
  if (completion === 'Zone') {
    numericCompletion = 0.5;
  } else if (completion === 'Top') {
    numericCompletion = 1;
  }

  let numericAttempts;
  if (attempts === '⚡️') {
    numericAttempts = 1;
  } else {
    numericAttempts = parseInt(attempts, 10); // Convert to integer if it's not the flash emoji
  }

  const updatedTap = {
    completion: numericCompletion,
    attempts: numericAttempts,
    witness1: witness1,
    witness2: witness2,
  };
  try {
    const { updateTap } = TapsApi();
    await updateTap(tapId, updatedTap);
    Alert.alert("Success", "Tap has been updated");
  } catch (error) {
    Alert.alert("Error", "Couldn't update tap");
  }
}

export const onShare = async (climbData) => {
  console.log('Sharing');
  try {
    // Gather climb information
    const climbName = climbData.name;
    const climbGrade = climbData.grade;

    // Format the share message
    const message = `Check out this climb I did on Nagimo.\n\n` +
      `Name: ${climbName}\n` +
      `Grade: ${climbGrade}\n` +
      `Location: Palladium\n\n`;

    // Share the message
    const result = await Share.share({
      message: message,
    });

    // Additional logic based on the share result
    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
      } else {
        // shared
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    Alert.alert(error.message);
  }
};

export const archiveTap = async (navigation, tapId) => {
  Alert.alert(
    "Delete Tap",
    "Do you really want to delete this tap?",
    [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel"
      },
      {
        text: "Yes",
        onPress: async () => {
          try {
            await TapsApi().updateTap(tapId, { archived: true });
            Alert.alert("Tap Deleted", "The tap has been successfully deleted.");
            navigation.goBack();
          } catch (error) {
            console.error("Error deleting tap:", error);
            Alert.alert("Error", "Could not delete tap.");
          }
        }
      }
    ]
  );
};



export const onFeedback = (navigation, climbData, climbId) => {
  navigation.navigate('Feedback', { climbName: climbData.name, climbGrade: climbData.grade, climbId: climbId })
};

export const onDefinition = (navigation, descriptor) => {
  navigation.navigate('Definition', { descriptor: descriptor });
};

export const getSelectedIndex = (value) => {
  if (value === '⚡️') {
    return 0;  // '⚡️' represents a '1', so return 0 for the index
  } else {
    return parseInt(value, 10) - 1;
  }
};