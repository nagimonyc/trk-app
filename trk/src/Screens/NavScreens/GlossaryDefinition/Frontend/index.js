import React, { useState, useEffect } from "react";
import { Text, View, ScrollView, SafeAreaView, StyleSheet, Image } from "react-native";
import fetchGlossaryData from "../Backend/GlossaryDefinitionLogic";


const GlossaryDefinition = ({ route }) => {

  const { descriptor } = route.params;
  const [definition, setDefinition] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    fetchGlossaryData(descriptor, setDefinition, setPhotoUrl);
  }, [descriptor]);

  return (
    <ScrollView>
      <SafeAreaView>
        <View style={styles.container}>
          <View style={styles.wrapper}>
            <Text style={styles.titleText}>{descriptor}</Text>
            <Text style={styles.definitionText}>{definition}</Text>
            {photoUrl && <Image source={{ uri: photoUrl }} style={styles.image} />}
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
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
  titleText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  definitionText: {
    marginTop: 15,
  },
  image: {
    width: '100%',
    height: 287,
    marginTop: 22,
    backgroundColor: 'white',
    borderRadius: 3.88,
  }
});

export default GlossaryDefinition