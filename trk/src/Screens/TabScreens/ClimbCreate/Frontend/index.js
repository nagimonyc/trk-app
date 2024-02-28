import React, { useState, useEffect, useContext } from "react";
import DropDownPicker from 'react-native-dropdown-picker';
import ImagePicker from 'react-native-image-crop-picker';

import { SafeAreaView, View, Text, StyleSheet, TextInput, Image, Button, Alert, TouchableOpacity, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView } from "react-native";

import { NfcTech } from "react-native-nfc-manager";
import NfcManager from "react-native-nfc-manager";
import writeClimb from "../../../../NfcUtils/writeClimb";
import writeSignature from "../../../../NfcUtils/writeSignature";
import ensurePasswordProtection from "../../../../NfcUtils/ensurePasswordProtection";
import AndroidPrompt from '../../../../Components/AndroidPrompt';
import ClimbsApi from "../../../../api/ClimbsApi";
import { AuthContext } from '../../../../Utils/AuthContext';
import storage from '@react-native-firebase/storage';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import GymsApi from "../../../../api/GymsApi";
import SetsApi from "../../../../api/SetsApi";
import Slider from '@react-native-community/slider';


const ClimbInputData = (props) => {



  const { route } = props;
  const climbData = route.params?.climbData;
  const isEditMode = route.params?.editMode;

  //To handle NFC state change
  const [isNfcRequestActive, setIsNfcRequestActive] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      if (isEditMode && climbData) {
        // Assuming SetsApi().getSetByName is an async function that fetches the set ID
        let setId = null;
        if (climbData.set) {
          setId = await SetsApi().getSetByName(climbData.set);
        }
        setName(climbData.name);
        setGrade(climbData.grade);
        setGym(climbData.gym);
        setType(climbData.type);
        if (setId && !setId.empty) {
          setSet(setId.docs[0].id); // Assuming this sets the ID for dropdown selection
          setSelectedValue(climbData.set); // Additional state update for selected value, if necessary
        }
        setIfsc(climbData.ifsc);
        setInfo(climbData.info);
      }
    };

    fetchData();
  }, [isEditMode, climbData]); // Dependencies





  console.log('[TEST] ClimbCreate called');
  const { currentUser } = useContext(AuthContext);
  const setter = currentUser;

  const androidPromptRef = Platform.OS === 'android' ? React.useRef() : null;

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [gym, setGym] = useState(null);
  const [image, setImage] = useState("");
  const [type, setType] = useState("Boulder");
  //const [set, setSet] = useState("Commercial");
  const [ifsc, setIfsc] = useState("");
  const [info, setInfo] = useState("");

  const [open, setOpen] = useState(false);

  //For the Sets Dropdown
  const [setsOpen, setSetsOpen] = useState(false);
  const [set, setSet] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [reload, setReload] = useState(false); //To reload with new sets


  //RIC sliders
  const [risk, setRisk] = useState(2);
  const [intensity, setIntensity] = useState(2);
  const [complexity, setComplexity] = useState(2);


  const yourCancelFunction = () => {
    NfcManager.cancelTechnologyRequest()
    console.log('Cancel button was pressed in AndroidPrompt');
  };

  const validateInput = () => {
    if (name.length > 10) {
      Alert.alert("Validation Error", "Name must be 10 characters or less.");
      return false;
    }
    if (grade.length > 5) {
      Alert.alert("Validation Error", "Grade must be 5 characters or less.");
      return false;
    }
    return true;
  };

  const [gymItems, setGymItems] = useState([]);

  useEffect(() => {
    GymsApi().fetchGyms().then(gyms => {
      const formattedGyms = gyms.map(doc => ({ label: doc.data().Name, value: doc.id }));
      setGymItems(formattedGyms);
    });
  }, []);



  //For Loading of Existing Sets
  const [setItems, setSetItems] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [value, setValue] = useState(null);

  useEffect(() => {
    SetsApi().fetchSets('TDrC1lRRjbMuMI06pONY').then(sets => {      //Passing Movement's Gym ID
      const formattedSets = sets.map(doc => ({ label: doc.data().name, value: doc.id }));
      setSetItems(formattedSets);
    });
  }, [reload]);


  //To create custom sets
  useEffect(() => {
    setSetItems(prevItems => {
      // Check if there's a custom item already
      const existingCustom = prevItems.find(item => item.value === 'custom');
      const searchTextLower = searchText.toLowerCase().trim();
      const exists = prevItems.some(item => item.label.toLowerCase().trim() === searchTextLower);

      if (searchText && !exists) {
        // If there's searchText and it does not match any existing item, add "Add custom"
        if (!existingCustom) {
          return [...prevItems, { label: `Add "${searchText}"`, value: 'custom', name: searchText.trim() }];
        } else {
          // Update the existing custom item label without removing it
          return prevItems.map(item => item.value === 'custom' ? { ...item, label: `Add "${searchText}"`, name: searchText.trim() } : item);
        }
      } else {
        // If searchText is empty or there's a match, remove "Add custom" option
        return prevItems.filter(item => item.value !== 'custom');
      }
    });
  }, [searchText]);

  const handleImagePick = async () => {
    //console.log("handleImagePick called");
    try {
      const pickedImage = await ImagePicker.openPicker({
        width: 300,
        height: 400,
        cropping: true,
      });

      // Save the full image path for later uploading
      const imagePath = pickedImage.path;

      // Set the image state to include the full path
      setImage({ path: imagePath });

    } catch (err) {
      console.error("Error picking image:", err);
    }
  };


  const uploadImage = async (imagePath) => {
    const filename = imagePath.split('/').pop().replace(/\.jpg/gi, "").replace(/-/g, "");
    const storageRef = storage().ref(`climb_images/${filename}`);
    await storageRef.putFile(imagePath);
    return { id: filename, path: storageRef.fullPath, timestamp: new Date().toISOString() };
  };


  async function handleUpdateClimb() {
    if (!validateInput()) return;
    const currentClimbData = await ClimbsApi().getClimb(climbData.id);
    let imagesArray = currentClimbData.images || [];

    if (image && image.path) {
      const newImageRef = await uploadImage(image.path);
      imagesArray.push(newImageRef); // Add new image reference to the array
    }

    const updatedClimb = {
      name,
      grade,
      gym,
      type,
      set: selectedValue,
      ifsc,
      info,
      images: imagesArray,
      setter: setter.uid,
      timestamp: new Date(),
      risk: risk,
      intensity: intensity,
      complexity: complexity,
    };

    try {
      const { updateClimb } = ClimbsApi();
      const newClimbId = await updateClimb(climbData.id, updatedClimb);
      //console.log(newClimbId);
      if (newClimbId) {
        //Check if set is a custom set (make), add climb and setter
        const filteredSets = setItems.filter(set => set.value === 'custom');
        //console.log(newClimbId);


        //Same Logic for deletion
        if (climbData.set && selectedValue !== climbData.set) {
          //We need to remove it from its existing set
          const setObjSnapshot = await SetsApi().getSetByName(climbData.set, 'TDrC1lRRjbMuMI06pONY'); //Passing Movement's Gym ID
          if (!setObjSnapshot.empty) {
            const setObj = setObjSnapshot.docs[0].data();
            console.log(setObj);
            const setObjId = setObjSnapshot.docs[0].id;
            const climbs = setObj.climbs;
            const setters = setObj.setters;
            if (climbs.length > 0) {
              const idx = climbs.indexOf(String(newClimbId));
              if (idx > -1) {
                climbs.splice(idx, 1);
                setters.splice(idx, 1);
              } else {
                console.error('Climb has a set, but the set has no record of the climb [ITEMS EXIST]');
              }
              await SetsApi().updateSet(setObjId, { climbs: climbs, setters: setters }); //Removing the old climb and setter
            } else {
              console.error('Climb has a set, but the set has no record of the climb');
            }
          }
        }

        if (filteredSets.length === 0 && (!climbData || selectedValue !== climbData.set)) { //No need to add if same set
          //Use the existing setName
          //console.log('Set already exists!: ', selectedValue);
          const oldSet = await SetsApi().getSetByName(String(selectedValue).trim(), 'TDrC1lRRjbMuMI06pONY'); //Passing Movement's Gym ID
          //console.log(oldSet);
          if (oldSet && oldSet.docs[0]) {
            const setId = oldSet.docs[0].id;
            const setData = oldSet.docs[0].data();
            const newClimbs = [newClimbId].concat((setData.climbs ? setData.climbs : [])); //replace with newClimbId
            const newSetters = [currentUser.uid].concat((setData.setters ? setData.setters : []));
            await SetsApi().updateSet(setId, { climbs: newClimbs, setters: newSetters });
          } else {
            console.error('Set Exists But Not Found!');
          }
        } else if ((!climbData || selectedValue !== climbData.set)) { //If not a duplicate, then make a custom set
          const setObj = {
            archived: false,
            name: filteredSets[0].name,
            climbs: [newClimbId], //replace with newClimbId
            setters: [currentUser.uid],
            gym: "TDrC1lRRjbMuMI06pONY", //Movement's Gym ID
          }
          await SetsApi().addSet(setObj);
        }

        setName("");
        setGrade("");
        setGym(null);
        setImage("");
        setType("Boulder");
        setInfo('');
        setSet(null);
        setSelectedValue(null);
        setIfsc("");
        setRisk(2);
        setIntensity(2);
        setComplexity(2);
        Alert.alert("Success", "Climb updated successfully");
      }
    } catch (err) {
      Alert.alert("Error updating climb");
      console.error(err);
    }
  }

  //Altered to include Set Details
  async function handleAddClimb() {
    if (!validateInput()) return;
    let isReading = true;
    if (Platform.OS === 'android' && androidPromptRef.current) { androidPromptRef.current?.setVisible(true) };
    try {
      await NfcManager.requestTechnology(NfcTech.NfcA);
      isReading = false;
      await ensurePasswordProtection();
      let imagesArray = [];
      if (image && image.path) {
        const newImageRef = await uploadImage(image.path);
        imagesArray.push(newImageRef);
      }
      const climb = {
        name,
        grade,
        gym,
        type,
        set: selectedValue,
        ifsc,
        info,
        images: imagesArray,
        setter: setter.uid,
        timestamp: new Date(),
        risk: risk,
        intensity: intensity,
        complexity: complexity,
      };

      const { addClimb } = ClimbsApi();
      const newClimbId = await addClimb(climb); //Adding the climb to firebase

      if (newClimbId) {
        const climbId = newClimbId._documentPath._parts[1]; // Get the document ID
        await ClimbsApi().updateClimb(climbId, { climb_id: climbId }); // Update the document to include the climb_id
      }

      //Check if set is a custom set (make), add climb and setter
      const filteredSets = setItems.filter(set => set.value === 'custom');
      if (filteredSets.length === 0) {
        //Use the existing setName
        //console.log('Set already exists!: ', selectedValue);
        const oldSet = await SetsApi().getSetByName(String(selectedValue).trim(), 'TDrC1lRRjbMuMI06pONY'); //Passing Movement's Gym ID
        console.log(oldSet);
        if (oldSet && oldSet.docs[0]) {
          const setId = oldSet.docs[0].id;
          const setData = oldSet.docs[0].data();
          const newClimbs = [newClimbId._documentPath._parts[1]].concat((setData.climbs ? setData.climbs : [])); //replace with newClimbId
          const newSetters = [currentUser.uid].concat((setData.setters ? setData.setters : []));
          await SetsApi().updateSet(setId, { climbs: newClimbs, setters: newSetters });
        } else {
          console.error('Set Exists But Not Found!');
        }
      } else {
        //console.log('New Set to be Created!');
        const setObj = {
          archived: false,
          name: filteredSets[0].name,
          climbs: [newClimbId._documentPath._parts[1]], //replace with newClimbId
          setters: [currentUser.uid],
          gym: "TDrC1lRRjbMuMI06pONY", //Movement's Gym ID
        }
        await SetsApi().addSet(setObj);
      }

      const climbBytes = await writeClimb(newClimbId._documentPath._parts[1], grade, name);

      //await writeSignature(climbBytes); For now, always fails

      // Reset form values here since NFC and addClimb were successful
      setName("");
      setGrade("");
      setGym(null);
      setImage("");
      setType("Boulder");
      setInfo('');
      setSet(null);
      setSelectedValue(null);
      setIfsc("");
      setRisk(2);
      setIntensity(2);
      setComplexity(2);
      setReload(current => !current); //To reload sets (with newly created one too!)
    } catch (ex) {
      if (isReading) {
        Alert.alert('Action', 'Climb tagging cancelled.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', ex.message || 'An error occurred', [{ text: 'OK' }]);
      }
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => 0);
      androidPromptRef.current?.setVisible(false);
    }
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
    const newClimbId = await updateClimb(climbData.id, { archived: true });
    if (newClimbId && climbData.set) {
      const setObjSnapshot = await SetsApi().getSetByName(climbData.set, 'TDrC1lRRjbMuMI06pONY'); //Moevement's Gym ID
      if (!setObjSnapshot.empty) {
        const setObj = setObjSnapshot.docs[0].data();
        //console.log(setObj);
        const setObjId = setObjSnapshot.docs[0].id;
        const climbs = setObj.climbs;
        const setters = setObj.setters;
        if (climbs.length > 0) {
          const idx = climbs.indexOf(String(newClimbId));
          if (idx > -1) {
            climbs.splice(idx, 1);
            setters.splice(idx, 1);
          } else {
            console.error('Climb has a set, but the set has no record of the climb [ITEMS EXIST]');
          }
          await SetsApi().updateSet(setObjId, { climbs: climbs, setters: setters }); //Removing the old climb and setter
        } else {
          console.error('Climb has a set, but the set has no record of the climb');
        }
      }
    }
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
                maxHeight={2000}
                dropDownDirection="BOTTOM"
                nestedScrollEnabled={true}
                setOpen={setOpen}
                value={gym}
                setValue={setGym}
                items={gymItems}
                containerStyle={{ height: 60, zIndex: 1000 }}
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

              <Text style={styles.label}>Set</Text>

              <DropDownPicker
                listMode="SCROLLVIEW"
                open={setsOpen}
                maxHeight={2000}
                dropDownDirection="BOTTOM"
                nestedScrollEnabled={true}
                setOpen={setSetsOpen}
                value={set}
                onSelectItem={(item) => {
                  if (item && item.value && item.label) {
                    setSet(item.value);
                    if (item.value === 'custom') {
                      setSelectedValue(item.name);
                    } else {
                      setSelectedValue(item.label);
                    }
                  }
                }}
                items={setItems}
                containerStyle={{ height: 60, zIndex: 500 }}
                style={styles.dropdown}
                dropDownContainerStyle={{
                  backgroundColor: '#e0e0e0',
                  borderColor: '#e0e0e0',
                  borderWidth: 1,
                }}
                setItems={setSetItems}
                searchable={true}
                searchPlaceholder="Search or add..."
                searchTextInputProps={{
                  onChangeText: text => setSearchText(text),
                  value: searchText,
                }}
                placeholderStyle={{ color: 'grey', fontSize: 18 }}
                textStyle={{ fontSize: 18 }}
              />

              <Text style={styles.label}>More Info</Text>
              <TextInput
                style={styles.largeInput}
                value={info}
                placeholderTextColor={"#b1b1b3"}
                onChangeText={setInfo}
                placeholder="Enter more info"
                multiline={true}

              />

              <View style={{ flex: 1, justifyContent: 'space-around', alignItems: 'stretch', padding: 0,}}>
                  <Text style={[styles.label, { color: '#000000' }]}>RIC (Risk, Intensity, Complexity)</Text>
                  <View>
                      <Slider
                          style={{ width: '100%', height: 40 }}
                          minimumValue={0}
                          maximumValue={5}
                          minimumTrackTintColor="#000000"
                          maximumTrackTintColor="#000000"
                          thumbTintColor="#000000"
                          step={1} // This ensures the slider moves in steps of 1
                          onValueChange={(value) => setRisk(Math.round(value))} // Rounds the value to ensure it's an integer
                          value={risk}
                      />
                      <Text style={{ textAlign: 'center', color: '#000000', fontSize: 15}}>Risk: {risk}</Text>
                  </View>

                  <View>
                      <Slider
                          style={{ width: '100%', height: 40 }}
                          minimumValue={0}
                          maximumValue={5}
                          minimumTrackTintColor="#000000"
                          maximumTrackTintColor="#000000"
                          thumbTintColor="#000000"
                          step={1} // This ensures the slider moves in steps of 1
                          onValueChange={(value) => setIntensity(Math.round(value))} // Rounds the value to ensure it's an integer
                          value={intensity}
                      />
                      <Text style={{ textAlign: 'center', color: '#000000', fontSize: 15}}>Intensity: {intensity}</Text>
                  </View>

                  <View>
                      <Slider
                          style={{ width: '100%', height: 40 }}
                          minimumValue={0}
                          maximumValue={5}
                          minimumTrackTintColor="#000000"
                          maximumTrackTintColor="#000000"
                          thumbTintColor="#000000"
                          step={1} // This ensures the slider moves in steps of 1
                          onValueChange={(value) => setComplexity(Math.round(value))} // Rounds the value to ensure it's an integer
                          value={complexity}
                      />
                      <Text style={{ textAlign: 'center', color: '#000000', fontSize: 15}}>Complexity: {complexity}</Text>
                  </View>
              </View>





              <Text style={styles.label}>Image</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Text style={styles.uploadText}>Insert climb image</Text>
                <Image source={require('../../../../../assets/image-icon.png')} style={styles.imageIcon} resizeMode="contain"></Image>
              </TouchableOpacity>
            </View>

            {/* Image Preview */}
            {image && image.path && <Image source={{ uri: image.path }} style={styles.previewImage} />}



            {Platform.OS === 'android' && <AndroidPrompt ref={androidPromptRef} onCancelPress={yourCancelFunction} />}


            {
              isEditMode ?
                (<View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                  <Button title="Update Climb" onPress={handleUpdateClimb} disabled={!name || !grade || !gym || !set} />
                </View>) :
                <Button title="Add Climb" onPress={handleAddClimb} disabled={!name || !grade || !gym || !set} />
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
    paddingBottom: 20,
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
