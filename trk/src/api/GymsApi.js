import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";
import firestore from '@react-native-firebase/firestore';


function GymsApi() {

  const ref = firebase.firestore().collection("gyms");
  console.log('[DATABASE] TApsApi called');

  function fetchGyms() {
    return ref.get().then(snapshot => {
      return snapshot.docs;
    }).catch(error => {
      console.error("Error fetching gyms: ", error);
      return [];
    });
}

  return {
    fetchGyms,
  }
}

export default GymsApi