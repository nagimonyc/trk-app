import React, { useState, useEffect, useContext } from "react";
import DropDownPicker from 'react-native-dropdown-picker';
import ImagePicker from 'react-native-image-crop-picker';

import { SafeAreaView, View, Text, StyleSheet, TextInput, Image, Button, Alert, TouchableOpacity, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView } from "react-native";

import { NfcTech } from "react-native-nfc-manager";
import NfcManager from "react-native-nfc-manager";
import writeClimb from "../../NfcUtils/writeClimb";
import writeSignature from "../../NfcUtils/writeSignature";
import ensurePasswordProtection from "../../NfcUtils/ensurePasswordProtection";
import AndroidPrompt from '../../Components/AndroidPrompt';
import ClimbsApi from "../../api/ClimbsApi";
import { AuthContext } from '../../Utils/AuthContext';
import storage from '@react-native-firebase/storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';


const ClimbInputData = (props) => {



  const { route } = props;
  const climbData = route.params?.climbData;
  const isEditMode = route.params?.editMode;

  useEffect(() => {
    if (isEditMode && climbData) {
      // Set your state here based on climbData
      setName(climbData.name);
      setGrade(climbData.grade);
      setGym(climbData.gym);
      setType(climbData.type);
      setSet(climbData.set);
      setIfsc(climbData.ifsc);
      setInfo(climbData.info);
    }
  }, [isEditMode, climbData]);




  console.log('[TEST] ClimbCreate called');
  const { currentUser } = useContext(AuthContext);
  const setter = currentUser;

  const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [gym, setGym] = useState(null);
  const [image, setImage] = useState("");
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


  const handleImagePick = async () => {
    console.log("handleImagePick called");
    try {
      const pickedImage = await ImagePicker.openPicker({
        width: 300,
        height: 400,
        cropping: true,
      });
      setImage(pickedImage.path);
    } catch (err) {
      console.error("Error picking image:", err);
    }
  };


  async function handleUpdateClimb() {
    try {
      const climb = {
        name,
        grade,
        gym,
        type,
        set,
        ifsc,
        info,
        image,
        setter: setter.uid,
        timestamp: new Date(),
      };

      const { updateClimb } = ClimbsApi();
      updateClimb(climbData.id, climb)
        .then(async (newClimbId) => {
          setName("");
          setGrade("");
          setGym(null);
          setImage("");
          setType("Boulder");
          setInfo('');
          setSet("Commercial");
          setIfsc("");
        })
      Alert.alert("Success", "Climb updated successfully");
    } catch (err) {
      Alert.alert("Error updating climb");
      console.error(err);
    }
  }




  async function handleAddClimb() {
    const climb = {
      name,
      grade,
      gym,
      type,
      set,
      ifsc,
      info,
      image,
      setter: setter.uid,
      timestamp: new Date(),
    };




    const { addClimb } = ClimbsApi();
    addClimb(climb)
      .then(async (newClimbId) => {

        androidPromptRef ? androidPromptRef.current.setVisible(true) : null;

        try {
          await NfcManager.requestTechnology(NfcTech.NfcA);
          await ensurePasswordProtection();
          const climbBytes = await writeClimb(newClimbId._documentPath._parts[1]);
          if (image) {
            const climbId = newClimbId._documentPath._parts[1];
            const reference = storage().ref(`climb_image/${climbId}`);
            await reference.putFile(image);
          }
          else {
            console.log("no image");
          }
          await writeSignature(climbBytes);
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
        setImage("");
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



  const confirmDelete = () => {
    Alert.alert(
      "Delete Climb",
      "Are you sure you want to delete this climb?",
      [
        {
          text: "No",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "Yes", onPress: () => handleDeleteClimb()
        }
      ],
      { cancelable: false }
    );
  };

  async function handleDeleteClimb() {
    const { updateClimb } = ClimbsApi();
    updateClimb(climbData.id, { archived: true })
    props.navigation.navigate('User_Profile');
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
            {isEditMode ?
              <View style={styles.buttonContainer}>
                <Button color='red' title="Delete Climb" onPress={confirmDelete} />
              </View> : null
            }

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
                containerStyle={{ height: 60, zIndex: 5000 }}
                style={styles.dropdown}
                dropDownContainerStyle={{
                  backgroundColor: '#e0e0e0',
                  borderColor: '#e0e0e0',
                  borderWidth: 1,
                }}
                setItems={setGymItems}
                placeholder="Select an item"
                placeholderStyle={{ color: 'grey', fontSize: 18 }}
                textStyle={{ fontSize: 18 }}
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





              <Text style={styles.label}>Image</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Text style={styles.uploadText}>Insert climb image</Text>
                <Image source={require('../../../assets/image-icon.png')} style={styles.imageIcon} resizeMode="contain"></Image>
              </TouchableOpacity>
            </View>

            {/* Image Preview */}
            {image && <Image source={{ uri: image }} style={styles.previewImage} />}


            {Platform.OS === 'android' && <AndroidPrompt ref={androidPromptRef} onCancelPress={yourCancelFunction} />}


            {
              isEditMode ?
                (<View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                  <Button title="Update Climb" onPress={handleUpdateClimb} />
                </View>) :
                <Button title="Add Climb" onPress={handleAddClimb} disabled={!name || !grade || !gym} />
            }
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
  previewImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain', // Or 'cover', depending on what you prefer
    marginVertical: 10,
  },
  segmentedControlContainer: {
    marginBottom: 10, // Adjust this value to add more or less space below the segmented control
  },
  dropdown: {
    backgroundColor: '#e0e0e0',
    borderColor: '#e0e0e0',
  },
  buttonContainer: {
    width: '100%', // take full width
    justifyContent: 'flex-end', // align button to the right
    flexDirection: 'row',
    paddingTop: 10,
    paddingRight: 10,

  }
});


export default ClimbInputData;
