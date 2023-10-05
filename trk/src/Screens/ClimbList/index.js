import React, { useState, useEffect, useContext } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, Image, Button, Alert } from "react-native";
import { NfcTech } from "react-native-nfc-manager";
import NfcManager from "react-native-nfc-manager";
import writeClimb from "../../NfcUtils/writeClimb";
import writeSignature from "../../NfcUtils/writeSignature";
import ensurePasswordProtection from "../../NfcUtils/ensurePasswordProtection";
import androidPromptRef from "../../Components/AndroidPrompt";
import ClimbsApi from "../../api/ClimbsApi";
import { AuthContext } from '../../Utils/AuthContext';


const ClimbInputData = () => {

  const { currentUser } = useContext(AuthContext);
  const setter = currentUser;


  const { addClimb } = ClimbsApi();

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");


  function handleAddClimb() {
    const climb = {
      name,
      grade,
      location,
      image,
      setter: setter.uid
    };

    addClimb(climb)
      .then(async (newClimbId) => { // Notice the async here
        if (Platform.OS === 'android') {
          androidPromptRef.current.setVisible(true);
        }

        try {
          await NfcManager.requestTechnology(NfcTech.NfcA);
          await ensurePasswordProtection();
          const climbBytes = await writeClimb(newClimbId._documentPath._parts[1]);
          await writeSignature(climbBytes);
        } catch (ex) {
          console.warn(ex);
        } finally {
          NfcManager.cancelTechnologyRequest();
        }

        if (Platform.OS === 'android') {
          androidPromptRef.current.setVisible(false);
        }

        setName("");
        setGrade("");
        setLocation("");
        setImage("");
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

        <Text style={styles.label}>Image</Text>
        <TextInput
          style={styles.input}
          value={image}
          onChangeText={setImage}
          placeholder="Enter image"
        />

        <Text style={styles.label}>Setter</Text>
        <TextInput
          style={styles.input}
          value={setter.email}
        />
      </View>

      <Button
        style={styles.button}
        onPress={handleAddClimb}
        mode="contained"
        disabled={!name || !grade || !location || !image}
        title="Add Climb"
      >
      </Button>

      <Button
        style={styles.button}
        onPress={() => navigation.navigate("List")}
        mode="contained"
        title="Go to Climb List"
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
  }
});

export default ClimbInputData;