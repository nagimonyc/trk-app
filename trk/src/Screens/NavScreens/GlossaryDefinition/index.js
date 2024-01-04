import React, { useState, useEffect } from "react";
import { Text, View, ScrollView, SafeAreaView, StyleSheet, Image } from "react-native";
import DescriptorsApi from "../../../api/DescriptorsApi";
import storage from '@react-native-firebase/storage';

const GlossaryDefinition = ({ route }) => {

  const { descriptor } = route.params;
  const [definition, setDefinition] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const api = DescriptorsApi();
      try {
        const querySnapshot = await api.getDescriptorsBySomeField('descriptor', descriptor);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setDefinition(data.definition);

          // Fetching the image URL from Firebase Storage
          const photoRef = data.photo ? storage().ref(`${data.photo}`) : storage().ref('default/path/to/image.png');
          photoRef.getDownloadURL()
            .then((url) => {
              setPhotoUrl(url);
            })
            .catch((error) => {
              console.error("Error getting photo URL: ", error);
            });
        } else {
          console.log('No matching document found');
        }
      } catch (error) {
        console.error('Error fetching descriptor:', error);
      }
    };

    fetchData();
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