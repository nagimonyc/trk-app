import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";


function DescriptorsApi() {

  const ref = firebase.firestore().collection("descriptors");
  console.log('[DATABASE] DescriptorsApi called');

  // get descriptors by some field
  function getDescriptorsBySomeField(field, value) {
    return ref.where(field, '==', value).get();
  };

  return {
    getDescriptorsBySomeField,
  };
}

export default DescriptorsApi;
