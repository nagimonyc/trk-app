import React, { useState, useEffect, useContext } from "react";
// import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView, View, Text, StyleSheet, TextInput, Image, Button, Alert, TouchableOpacity, Platform } from "react-native";
import { NfcTech } from "react-native-nfc-manager";
import NfcManager from "react-native-nfc-manager";
import writeClimb from "../../NfcUtils/writeClimb";
import writeSignature from "../../NfcUtils/writeSignature";
import ensurePasswordProtection from "../../NfcUtils/ensurePasswordProtection";
import androidPromptRef from "../../Components/AndroidPrompt";
import ClimbsApi from "../../api/ClimbsApi";
import { AuthContext } from '../../Utils/AuthContext';
// import storage from '@react-native-firebase/storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';


const ClimbInputData = () => {
  console.log('[TEST] ClimbList called');
  const { currentUser } = useContext(AuthContext);
  const setter = currentUser;



  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [location, setLocation] = useState("Gowanus");
  // const [image, setImage] = useState("");
  const [type, setType] = useState("Boulder");
  const [set, setSet] = useState("Competition");
  const [ifsc, setIfsc] = useState("");

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
      location,
      type,
      set,
      ifsc,
      // image, 
      setter: setter.uid
    };

    const { addClimb } = ClimbsApi();
    addClimb(climb)
      .then(async (newClimbId) => {
        if (Platform.OS === 'android') {
          androidPromptRef.current.setVisible(true);
        }

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

        if (Platform.OS === 'android') {
          androidPromptRef.current.setVisible(false);
        }

        // Reset form
        setName("");
        setGrade("");
        setLocation("Gowanus");
        // setImage("");
        setType("Boulder");
        setSet("Competition");
        setIfsc("");
      })
      .catch((err) => {
        Alert.alert("Error saving climb");
        console.error(err);
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
        />

        <Text style={styles.label}>Grade</Text>
        <TextInput
          style={styles.input}
          value={grade}
          onChangeText={setGrade}
          placeholder="Enter grade"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location"
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.segmentedControlContainer}>
          <SegmentedControl
            values={['Boulder', 'Lead', 'Top Rope']}
            tintColor="#007AFF"
            selectedIndex={['Boulder', 'Lead', 'Top Rope'].indexOf(type)}
            style={styles.segmentedControl}
            onChange={(event) => {
              setType(event.nativeEvent.value);

            }}
          />
        </View>

        <Text style={styles.label}>Set</Text>
        <View style={styles.segmentedControlContainer}>
          <SegmentedControl
            values={['Competition', 'Commercial']}
            tintColor="#007AFF"
            style={styles.segmentedControl}
            selectedIndex={set === 'Competition' ? 0 : 1}  // Updated this line to set the selectedIndex based on the value of 'set'
            onChange={(event) => {
              setSet(event.nativeEvent.value);
            }}
          />
        </View>



        <Text style={styles.label}>IFSC Score</Text>
        <TextInput
          style={styles.input}
          value={ifsc}
          onChangeText={setIfsc}
          placeholder="Enter score"
        />

        {/* <Text style={styles.label}>Image</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
          <Text style={styles.uploadText}>Insert climb image</Text>
          <Image source={require('../../../assets/image-icon.png')} style={styles.imageIcon} resizeMode="contain"></Image>
        </TouchableOpacity> */}

        <Text style={styles.label}>Setter</Text>
        <TextInput
          style={styles.input}
          value={setter.email}
        />
      </View>

      <Button
        onPress={handleAddClimb}
        mode="contained"
        disabled={!name || !grade || !ifsc}
        title="Add Climb"
      >
      </Button>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#e0e0e0",
    marginBottom: 16
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

});

export default ClimbInputData;
