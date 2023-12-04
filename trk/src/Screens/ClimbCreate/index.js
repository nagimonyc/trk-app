import React, { useState, useEffect, useContext } from "react";
import DropDownPicker from 'react-native-dropdown-picker';
// import ImagePicker from 'react-native-image-crop-picker';

import { SafeAreaView, View, Text, StyleSheet, TextInput, Image, Button, Alert, TouchableOpacity, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView } from "react-native";

import { NfcTech } from "react-native-nfc-manager";
import NfcManager from "react-native-nfc-manager";
import writeClimb from "../../NfcUtils/writeClimb";
import writeSignature from "../../NfcUtils/writeSignature";
import ensurePasswordProtection from "../../NfcUtils/ensurePasswordProtection";
import AndroidPrompt from '../../Components/AndroidPrompt';
import ClimbsApi from "../../api/ClimbsApi";
import { AuthContext } from '../../Utils/AuthContext';
// import storage from '@react-native-firebase/storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';


const ClimbInputData = () => {
  console.log('[TEST] ClimbCreate called');
  const { currentUser } = useContext(AuthContext);
  const setter = currentUser;

  const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;
  console.log('platform: ', Platform.OS)
  console.log('androidPromptRef:', androidPromptRef);

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [gym, setGym] = useState(null);
  // const [image, setImage] = useState("");
  const [type, setType] = useState("Boulder");
  const [set, setSet] = useState("Commercial");
  const [ifsc, setIfsc] = useState("");
  const [info, setInfo] = useState("");

  const [open, setOpen] = useState(false);

  const yourCancelFunction = () => {
    console.log('Cancel button was pressed in AndroidPrompt');
  };

//this will later be populated by the gym documents in gym collection
  const [gymItems, setGymItems] = useState([
    { label: 'Palladium', value: 'Palladium' },
    { label: 'The Cliffs LIC', value: 'The Cliffs LIC' },
    { label: 'VITAL', value: 'VITAL' },
    { label: 'The Gravity Vault Hoboken', value: 'The Gravity Vault Hoboken' }]);


  // async function handleImagePick() {
  //   try {
  //     const pickedImage = await ImagePicker.openPicker({
  //       width: 300,
  //       height: 400,
  //       cropping: true,
  //     });
  //     setImage(pickedImage.path);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // }

  async function handleAddClimb() {
    const climb = {
      name,
      grade,
      gym,
      type,
      set,
      ifsc,
      info,
      // image, 
      setter: setter.uid, 
      timestamp: new Date(),
    };


    const { addClimb } = ClimbsApi();
    addClimb(climb)
      .then(async (newClimbId) => {

        androidPromptRef ? androidPromptRef.current.setVisible(true) : null;
        // if (Platform.OS === 'android') {
        //   androidPromptRef.current.setVisible(true);
        // }

        try {
          await NfcManager.requestTechnology(NfcTech.NfcA);
          await ensurePasswordProtection();
          const climbBytes = await writeClimb(newClimbId._documentPath._parts[1]);
          await writeSignature(climbBytes);

          // Image upload to Firebase here
          // if (image) {
          //   const climbId = newClimbId._documentPath._parts[1];
          //   const reference = storage().ref(`climb_image/${climbId}`);
          //   await reference.putFile(image);
          // }
        }
        catch (ex) {
          // console.warn("error is hello world");
        }

        finally {
          NfcManager.cancelTechnologyRequest();
        }

        androidPromptRef ? androidPromptRef.current.setVisible(false) : null;

        // Reset form
        setName("");
        setGrade("");
        setGym(null);
        // setImage("");
        setType("Boulder");
        setInfo('');
        setSet("Commercial");
        setIfsc("");
      })
      .catch((err) => {
        Alert.alert("Error saving climb");
        console.error(err);
      });
  }


  return (

    <KeyboardAvoidingView 
    behavior={Platform.OS === "ios" ? "padding" : "height"} 
    style={{ flex: 1 }}
    keyboardVerticalOffset={120}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>

      <ScrollView>
        <SafeAreaView style={styles.container}>

          <View style={styles.content}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              placeholderTextColor={"#b1b1b3"}
              onChangeText={setName}
              placeholder="Enter name"

            />


            <Text style={styles.label}>Grade</Text>
            <TextInput
              style={styles.input}
              value={grade}
              placeholderTextColor={"#b1b1b3"}
              onChangeText={setGrade}
              placeholder="Enter grade"

            />

            <Text style={styles.label}>IFSC Score</Text>
            <TextInput
              style={styles.input}
              value={ifsc}
              onChangeText={setIfsc}
              placeholderTextColor={"#b1b1b3"}
              placeholder="Enter score"
            />

            <Text style={styles.label}>Gym</Text>

            <DropDownPicker
            listMode="SCROLLVIEW"
              open={open}
              setOpen={setOpen}
              value={gym}
              setValue={setGym}
              items={gymItems}
              containerStyle={{ height: 60, zIndex: 5000}}
              style={styles.dropdown}
              dropDownContainerStyle={{
                backgroundColor: '#e0e0e0', 
                borderColor: '#e0e0e0', 
                borderWidth: 1, 
              }}
              setItems={setGymItems}
              placeholder="Select an item"
              placeholderStyle={{ color: 'grey', fontSize: 18 }}
              textStyle={{fontSize: 18}}
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.segmentedControlContainer}>
              <SegmentedControl
                values={['Boulder', 'Lead', 'Top Rope']}
                tintColor="#007AFF"
                fontStyle={{ fontSize: 18, color: '#007AFF' }}
                activeFontStyle={{ fontSize: 18, color: 'black' }}
                selectedIndex={['Boulder', 'Lead', 'Top Rope'].indexOf(type)}
                style={styles.segmentedControl}
                onChange={(event) => {
                  setType(event.nativeEvent.value);
                }}
              />
            </View>

            <Text style={styles.label}>More Info</Text>
            <TextInput
              style={styles.largeInput}
              value={info}
              placeholderTextColor={"#b1b1b3"}
              onChangeText={setInfo}
              placeholder="Enter more info"

            />

            <Text style={styles.label}>Set</Text>
            <View style={styles.segmentedControlContainer}>
              <SegmentedControl
                values={['Competition', 'Commercial']}
                tintColor="#007AFF"
                fontStyle={{ fontSize: 18, color: '#007AFF' }}
                activeFontStyle={{ fontSize: 18, color: 'black' }}
                style={styles.segmentedControl}
                selectedIndex={set === 'Competition' ? 0 : 1}  // Updated this line to set the selectedIndex based on the value of 'set'
                onChange={(event) => {
                  setSet(event.nativeEvent.value);
                }}
              />
            </View>





            {/* <Text style={styles.label}>Image</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
          <Text style={styles.uploadText}>Insert climb image</Text>
          <Image source={require('../../../assets/image-icon.png')} style={styles.imageIcon} resizeMode="contain"></Image>
        </TouchableOpacity> */}

          </View>

          {/* Include AndroidPrompt only for Android platform */}
          {Platform.OS === 'android' && <AndroidPrompt ref={androidPromptRef} onCancelPress={yourCancelFunction} />}


          <Button
            onPress={handleAddClimb}
            mode="contained"
            disabled={!name || !grade || !gym}
            title="Add Climb"
          >
          </Button>

        </SafeAreaView>
      </ScrollView>

    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 25
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 18,
    marginBottom: 8,
    color: 'black',
  },
  input: {
    backgroundColor: "#e0e0e0",
    marginBottom: 16,
    fontSize: 18,
    color: 'black',
  },
  largeInput: {
    backgroundColor: "#e0e0e0",
    marginBottom: 16,
    height: 150,
    fontSize: 18,
    color: 'black',
    borderRadius: 8,
    paddingBottom: 120, 
    paddingLeft: 10,
    textAlignVertical: 'top',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    height: 100,
    marginBottom: 16,
  },
  uploadText: {
    color: '#acabad'
  },
  imageIcon: {
    width: 40,
    height: 40,
  },
  segmentedControlContainer: {
    marginBottom: 10, // Adjust this value to add more or less space below the segmented control
  },
  dropdown: {
    backgroundColor: '#e0e0e0',
    borderColor: '#e0e0e0',
  },
});


export default ClimbInputData;
