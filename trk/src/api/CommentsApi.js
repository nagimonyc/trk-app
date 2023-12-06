import firebase from "@react-native-firebase/app";
import "@react-native-firebase/firestore";


function CommentsApi() {

  const ref = firebase.firestore().collection("comments");
  console.log('[DATABASE] CommentsApi called');

  // get comments by some field
  function getCommentsBySomeField(field, value) {
    return ref.where(field, '==', value).get();
  };

  return {
    getCommentsBySomeField,
  };
}

export default CommentsApi;
