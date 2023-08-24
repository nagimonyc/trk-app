import React, { useState, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, TextInput, Image, Button, Alert } from "react-native";
import ClimbsApi from "../../api/ClimbsApi";

const ClimbInputData = () => {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");

  const { addClimb } = ClimbsApi();

  function handleAddClimb() {
    const climb = {
      name,
      grade,
      location,
      image,
    };

    addClimb(climb)
      .then((newClimbId) => {
        console.log("New climb added with ID:", newClimbId);
        // You can now use newClimbId for other purposes

        setName("");
        setGrade("");
        setLocation("");
        setImage("");
        Alert.alert("Climb saved!");
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