import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";
import firestore from '@react-native-firebase/firestore';

function SetsApi() {

  const ref = firebase.firestore().collection("sets");
  console.log('[DATABASE] SetsApi called');

  function addSet(set) {
    return ref.add(set);
    }

  function fetchSets() {
    return ref.get().then(snapshot => {
      return snapshot.docs;
    }).catch(error => {
      console.error("Error fetching sets: ", error);
      return [];
    });
    }
    
    function getSetByName(name) {
        return ref.where('archived', '==', false)
        .where('name','==', name)
        .get();
    }

    function getSetById(id) {
        return ref.doc(id).get();
    }

    async function updateSet(setId, updatedSet) {
        const setRef = ref.doc(setId);
        return await setRef.update(updatedSet);
    }

  return {
    fetchSets,
    getSetByName,
    updateSet,
    getSetById,
    addSet,
  }
}

export default SetsApi