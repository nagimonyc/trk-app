import firestore from '@react-native-firebase/firestore';


function GymsApi() {

  async function fetchGyms() {
    try {
      const snapshot = await firestore().collection('gyms').get();
      return snapshot.docs;
    } catch (error) {
      console.error("Error fetching gyms: ", error);
      return [];
    }
  }

  return {
    fetchGyms,
  }
}

export default GymsApi

