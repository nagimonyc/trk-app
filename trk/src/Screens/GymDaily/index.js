import React, { useEffect, useState, useContext } from 'react';
import { Text, View, ScrollView, SafeAreaView, StyleSheet } from "react-native";
import { AuthContext } from '../../Utils/AuthContext';
import ClimbsApi from '../../api/ClimbsApi';
import TapsApi from '../../api/TapsApi';
import CommentsApi from '../../api/CommentsApi';
import {fetchSetClimbs} from '../../Backend/analyticsCalculations';
import { fetchTapsAndCalculateAscents } from '../../Backend/analyticsCalculations';


const GymDaily = () => {

  const [yourClimbs, setYourClimbs] = useState([]);
  const [yourComments, setYourComments] = useState([]);
  const [totalClimbs, setTotalClimbs] = useState('');
  const [asents, setAscents] = useState([]);

  const [totalAscents, setTotalAscents] = useState('');
  const [latestAscents, setLatestAscents] = useState('');
  const [mostCompleted, setMostCompleted] = useState('');
  const [leastCompleted, setLeastCompleted] = useState('');
  const [peakTime, setPeakTime] = useState('');
  const [highestRated, setHighestRated] = useState({
    name: '',
    grade: '',
    type: '',
    climb: '',
  });
  const [latestFeedback, setLatestFeedback] = useState({
    explanation: '',
    climb: '',
    rating: '',
    climbName: '',
  });
  
  const { currentUser } = useContext(AuthContext);
  const userId = currentUser.uid; 

  useEffect(() => {
    const initializeSetClimbs = async () => {
      const climbs = await fetchSetClimbs(userId);
      setYourClimbs(climbs);
      setTotalClimbs(climbs.length.toString());
    };
  
    initializeSetClimbs();
  }, [userId, currentUser]) 

  useEffect(() => {
    const processTapsAndAscents = async () => {
      if (yourClimbs.length > 0) {
        const {
          totalTaps,
          allTaps,
          peakTimeString,
          latestAscentsCount,
          mostCompletedClimb,
          leastCompletedClimb
        } = await fetchTapsAndCalculateAscents(yourClimbs);
  
        setAscents(allTaps);
        setTotalAscents(totalTaps.toString());
        setLatestAscents(latestAscentsCount.toString());
        setPeakTime(peakTimeString);
        setMostCompleted(mostCompletedClimb || { name: '', id: '', grade: '' });
        setLeastCompleted(leastCompletedClimb || { name: '', id: '', grade: '' });
      }
    };
  
    processTapsAndAscents();
  }, [yourClimbs]);


  useEffect(() => {
    const { getClimb } = ClimbsApi();
    const { getCommentsBySomeField } = CommentsApi();
    const fetchCommentsAndCalculateFeedback = async () => {
      try {
        const commentsPromises = yourClimbs.map(climb =>
          getCommentsBySomeField('climb', climb.id)
        );
        const commentsSnapshots = await Promise.all(commentsPromises);
        let comments = [];
        commentsSnapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => comments.push({ ...doc.data(), timestamp: doc.data().timestamp.toDate() }));
        });

        setYourComments(comments);
 
        if (comments.length > 0) {
          const latestComment = comments.reduce((latest, current) =>
            latest.timestamp > current.timestamp ? latest : current
          );

          const climbDetails = await getClimb(latestComment.climb);
          const climbData = climbDetails.data();
          setLatestFeedback({
            explanation: latestComment.explanation,
            climb: latestComment.climb,
            rating: latestComment.rating,
            climbName: climbData.name,
            climbGrade: climbData.grade,
          });
        }

        let climbRatings = {};
        comments.forEach(comment => {
          if (!climbRatings[comment.climb]) {
            climbRatings[comment.climb] = { totalRating: 0, count: 0 };
          }
          climbRatings[comment.climb].totalRating += comment.rating;
          climbRatings[comment.climb].count++;
        });

        let highestRatedClimbId = Object.keys(climbRatings).reduce((a, b) =>
          (climbRatings[a].totalRating / climbRatings[a].count) > (climbRatings[b].totalRating / climbRatings[b].count) ? a : b
        );

        const highestRatedClimbDetails = await getClimb(highestRatedClimbId);
        const climbData = highestRatedClimbDetails.data();
        setHighestRated({
          name: climbData.name,
          grade: climbData.grade,
          type: climbData.type,
          climb: highestRatedClimbId,
        });


      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    if (yourClimbs.length > 0) {
      fetchCommentsAndCalculateFeedback();
    }
  }, [yourClimbs]);

  const getStars = (rating) => {
    let starRating = '';
    for (let i = 0; i < rating; i++) {
      starRating += '⭐️';
    }
    return starRating;
  };


  return (
    <ScrollView>
      <SafeAreaView>
        <View>
          <View style={styles.header}>
            <Text style={styles.title}>Lead Cave</Text>
          </View>
          <View style={styles.boxCollection}>

            <View style={styles.row}>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.activeBigNumber}>{totalClimbs}</Text>
                <Text>Active Climbs</Text>
                </View>
              </View>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.bigNumber}>{totalAscents}</Text>
                <Text>Total ascents</Text>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.routeTitle}>{mostCompleted.name}</Text>
                <Text style={styles.routeGrade}>{mostCompleted.grade}</Text>
                </View>
                <Text style={styles.textBottom}>Most completed route</Text>
              </View>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.routeTitle}>{highestRated.name}</Text>
                <Text style={styles.routeGrade}>{highestRated.grade}</Text>
                </View>
                <Text style={styles.textBottom}>Highest rated climb</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.routeTitle}>{leastCompleted.name}</Text>
                <Text style={styles.routeGrade}>{leastCompleted.grade}</Text>
                </View>
                <Text style={styles.textBottom}>Least completed route</Text>
              </View>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.feedback}>{latestFeedback.explanation}</Text>
                <Text style={styles.rating}>{getStars(latestFeedback.rating)}</Text>
                <Text style={styles.climbName}>{latestFeedback.climbName} - {latestFeedback.climbGrade}</Text>
                </View>
                <Text style={styles.textBottom}>Latest feedback</Text>

              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.time}>{peakTime}</Text>
                <Text>Most active time</Text>
                </View>
              </View>
              <View style={styles.box}>
              <View style={styles.centeredContent}>
                <Text style={styles.bigNumber}>{latestAscents}</Text>
                <Text>Ascents since yesterday</Text>
                </View>
              </View>
            </View>

          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  )
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  boxCollection: {
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  box: {
    width: '45%',
    aspectRatio: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    margin: 5,
    borderRadius: 12,
    backgroundColor: '#E6E6E6'
    
  },
  time: {
    fontWeight: 'bold',
    fontSize: 25,
    marginBottom: 20,
    // color: '#3498db',
    color: 'black',
  },
  activeBigNumber: {
    fontWeight: 'bold',
    fontSize: 35,
    marginBottom: 13,
    // color: 'green',
    color: 'black',
  },
  bigNumber: {
    fontWeight: 'bold',
    fontSize: 35,
    marginBottom: 13,
    color: 'black',
    // color: '#ff8100',
  },
  routeTitle: {
    fontSize: 20,
    color: 'black',
  },
  routeGrade: {
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
  },
  feedback: {
    fontStyle: 'italic',
    paddingRight: 10,
    paddingLeft: 10,
    color: 'black',
    fontSize: 18,
  },
  rating: {
    marginBottom: 4,
  },
  climbName: {
    marginBottom: 10,
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // This will make the content use the available space
  },
  textBottom: {
    textAlign: 'center',
    marginBottom: 10,
  },
  
});

export default GymDaily;
