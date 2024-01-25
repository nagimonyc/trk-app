import DescriptorsApi from "../../../../api/DescriptorsApi";
import storage from '@react-native-firebase/storage';

const fetchGlossaryData = async (descriptor, setDefinition, setPhotoUrl) => {
  try {
    const api = DescriptorsApi();
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

export default fetchGlossaryData;