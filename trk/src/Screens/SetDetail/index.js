import React, { useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, Button } from 'react-native';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from '../../Utils/AuthContext';
import CommentsApi from '../../api/CommentsApi';
import {renderRating, navigateToSetConfig, loadImageUrl, getTaps, getComments} from '../SetDetail_Backend/SetDetailLogic';

function SetDetail(props) {
  console.log('[TEST] SetDetail called')

  const { role } = useContext(AuthContext);

  const { climbData } = props.route.params;
  const { navigation } = props;

  const [tapCount, setTapCount] = useState(0);
  const [climbImageUrl, setClimbImageUrl] = useState(null);
  const [setterImageUrl, setSetterImageUrl] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);


  useEffect(() => {
    const loadImages = async () => {
      try {
        let climbImageURL = 'climb photos/the_crag.png'; 
        if (climbData.images && climbData.images.length > 0) {
          const latestImageRef = climbData.images[climbData.images.length - 1];
          climbImageURL = latestImageRef.path;
        }
        const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
        setClimbImageUrl(loadedClimbImageUrl);
        const setterImageUrl = await loadImageUrl('profile photos/marcial.png');
        setSetterImageUrl(setterImageUrl);
      } catch (error) {
        console.error("Error loading images: ", error);
      }
    };
      loadImages();
  }, [climbData.images]);

  useEffect(() => {
    const fetchTapCount = async () => {
      try {
        const tapCount = await getTaps(climbData);
        setTapCount(tapCount);
      } catch (error) {
        console.error('Error fetching tap count:', error);
      }
    };
    fetchTapCount();
  }, [climbData.id]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const comments = await getComments(climbData);
        setFeedbackList(comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };
    fetchComments();
  }, [climbData.id]);

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={[styles.wrapper]} >
          <SafeAreaView />
          {(role === 'setter' ?
            <View style={styles.buttonContainer}>
              <Button style={{}} title='edit' onPress={() => navigateToSetConfig(navigation, climbData)}></Button>
            </View>
            : null
          )}
          <View style={styles.top}>
            <View style={styles.topLeft}>
              <View style={styles.gradeCircle}>
                <Text style={styles.grade}>{climbData.grade}</Text>
              </View>

              <Text style={styles.titleText}>{climbData.name}</Text>
            </View>
            <View style={styles.circleWrapper}>
              <View style={styles.setterCircle}>
                {setterImageUrl && <Image source={{ uri: setterImageUrl }} style={{ width: '100%', height: '100%' }} />}
              </View>
            </View>
          </View>
          <View style={styles.countBox}>
            <Text style={styles.count}>{tapCount}</Text>
          </View>
          <View style={styles.climbPhoto}>
            {climbImageUrl && <Image source={{ uri: climbImageUrl }} style={{ width: '100%', height: '100%' }} />}
          </View>

          <View style={styles.contentArea}>
            {feedbackList.length > 0 && (
              <Text style={styles.feedbackTitle}>Feedback</Text>
            )}
            {feedbackList.length > 0 ? (
              feedbackList.map((comment, index) => (
                <View key={index} style={styles.commentContainer}>
                  <Text style={styles.commentText}>{comment.explanation}</Text>
                  <Text style={styles.commentRating}>{() => renderRating(comment.rating)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noFeedback}>No feedback yet.</Text>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    PaddingTop: 10,
    PaddingBottom: 20
  },

  wrapper: {
    width: '90%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8.78,
    borderColor: '#f2f2f2',
    borderWidth: 1.49,
  },
  top: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleText: {
    flexShrink: 1, // To prevent text overflow
    fontWeight: 'bold',
    marginLeft: 15,
    fontSize: 17.57,
    color: 'black',
  },

  topLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#C73B3B', //this color is hardcoded for now, but needs to match the level/grading system of the gym
    alignItems: 'center',
    justifyContent: 'center',
  },
  setterCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
    overflow: 'hidden',
  },
  line: {
    width: 200,
    height: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.26)',
    marginTop: 55,
  },

  climbPhoto: {
    width: 197,
    height: 287,
    marginTop: 15,
    backgroundColor: 'white',
    borderRadius: 3.88,
  },
  contentArea: {
    padding: 10,  // Add padding around the content
    width: '100%',
  },
  group: {
    marginBottom: 10,
    marginTop: 10,  // Add space below each group
  },
  title: {
    fontWeight: 'bold',
    color: 'black',
  },
  countBox: {
    marginTop: 15,
  },
  count: {
    fontSize: 45,
    fontWeight: '700'
  },
  circleWrapper: {
    width: 100,  // or whatever width keeps your layout consistent
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0
  },
  grade: {
    color: 'white',
  },
  infoBox: {
    marginTop: 15,
    alignSelf: 'flex-start',
    marginLeft: 30,
    color: 'black',

  },
  subheading: {
    fontWeight: '700',
    fontSize: 20,
    textAlign: 'left',
    color: 'black',
  },
  info: {
    marginTop: 5,
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 10,
    color: 'black',
  },
  buttonContainer: {
    width: '100%', // take full width
    justifyContent: 'flex-end', // align button to the right
    flexDirection: 'row',
  },
  commentText: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    flex: 1,
    color: 'black',
  },
  feedbackTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 5,
    marginTop: 15,
    color: 'black',
  },
  noFeedback: {
    marginTop: 15,
    color: 'black',
  },
  commentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 5,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    color: 'black',
  },
  commentRating: {
    fontWeight: 'bold',
    marginLeft: 10,
    marginRight: 7,
    color: 'black',

  },
})

export default SetDetail;