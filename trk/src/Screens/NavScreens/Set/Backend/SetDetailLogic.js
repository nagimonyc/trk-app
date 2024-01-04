import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import CommentsApi from '../../../../api/CommentsApi';


export const renderRating = (rating) => {
  return '⭐️'.repeat(rating);
};

export const navigateToSetConfig = (navigation, climbData) => {
  navigation.navigate('ClimbInputData', { climbData, editMode: true });
};

export const loadImageUrl = async (imagePath) => {
  try {
    const url = await storage().ref(imagePath).getDownloadURL();
    return url;
  } catch (error) {
    console.error("Error getting image URL: ", error);
    throw error;
  }
};

export const getTaps = async (climbData) => {
  try {
    const tapQuerySnapshot = await firestore()
      .collection('taps')
      .where('climb', '==', climbData.id)
      .get();
    return tapQuerySnapshot.size;
  } catch (error) {
    console.error('Error fetching tap count:', error);
    throw error;
  }
};

export const getComments = async (climbData) => {
  const { getCommentsBySomeField } = CommentsApi();
  try {
    const querySnapshot = await getCommentsBySomeField('climb', climbData.id);
    const comments = [];
    querySnapshot.forEach(doc => {
      const commentData = doc.data();
      comments.push({
        id: doc.id,
        explanation: commentData.explanation,
        rating: commentData.rating,
        timestamp: commentData.timestamp
      });
    });
    comments.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
    return comments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};