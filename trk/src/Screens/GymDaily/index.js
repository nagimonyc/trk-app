import React, { useEffect, useState, useContext } from 'react';
import { Text, View, ScrollView, SafeAreaView, StyleSheet } from "react-native";
import { AuthContext } from '../../Utils/AuthContext';
import ClimbsApi from '../../api/ClimbsApi';
import TapsApi from '../../api/TapsApi';
import CommentsApi from '../../api/CommentsApi';


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
  const { getClimbsBySomeField } = ClimbsApi();
  const { getTapsBySomeField } = TapsApi();
  const { getCommentsBySomeField } = CommentsApi();
  const { getClimb } = ClimbsApi();

  const userId = currentUser.uid;


  useEffect(() => {
    const fetchClimbs = async () => {
      try {
        const querySnapshot = await getClimbsBySomeField('setter', userId);
        if (querySnapshot && querySnapshot.docs) {
          const climbs = querySnapshot.docs.map(doc => {
            return {
              id: doc.id,
              ...doc.data()
            };
          }).filter(climb => !climb.archived); // Filter out archived climbs

          setYourClimbs(climbs);
          setTotalClimbs(climbs.length.toString()); // Now reflects the count of non-archived climbs
        } else {
          console.error("No data found in Firestore query");
        }
      } catch (error) {
        console.error("Error fetching climbs:", error);
      }
    };

    fetchClimbs();
    console.log(`Your climbs are: ${JSON.stringify(yourClimbs, null, 2)}`);

  }, [userId]);


  useEffect(() => {
    const fetchTapsAndCalculateAscents = async () => {
      let totalTaps = 0;
      let allTaps = [];
      let latestAscentsCount = 0;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let climbFrequencyMap = {};
      let timeFrequencyMap = {};



      for (const climb of yourClimbs) {
        const tapsSnapshot = await getTapsBySomeField('climb', climb.id);
        if (tapsSnapshot && tapsSnapshot.docs) {
          const taps = tapsSnapshot.docs.map(doc => {
            const tap = doc.data();
            tap.timestamp = tap.timestamp.toDate();
            console.log(`Tap Timestamp: ${tap.timestamp}`);
            return tap;
          }).filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false));
          totalTaps += taps.length;
          allTaps = [...allTaps, ...taps];

          latestAscentsCount += taps.filter(tap => tap.timestamp > oneDayAgo).length;

          taps.forEach(tap => {
            if (!climbFrequencyMap[tap.climb]) {
              climbFrequencyMap[tap.climb] = { count: 0, name: climb.name, id: climb.id, grade: climb.grade };
            }
            climbFrequencyMap[tap.climb].count++;
          });
        }
      }

      for (const tap of allTaps) {
        if (tap.timestamp) {
          const hour = tap.timestamp.getHours(); 
          timeFrequencyMap[hour] = (timeFrequencyMap[hour] || 0) + 1;
        }
      }


      let peakHour = Object.keys(timeFrequencyMap).reduce((a, b) => timeFrequencyMap[a] > timeFrequencyMap[b] ? a : b, null);
      setPeakTime(peakHour ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : '');
      console.log(`peakHour is: ${peakHour}`)

      setAscents(allTaps);
      setTotalAscents(totalTaps.toString());
      setLatestAscents(latestAscentsCount.toString());

      let mostCompletedClimb = Object.values(climbFrequencyMap).reduce((a, b) => (a && b && a.count > b.count) ? a : b, null);
      let leastCompletedClimb = Object.values(climbFrequencyMap).reduce((a, b) => (a && b && a.count < b.count) ? a : b, null);

      if (mostCompletedClimb) {
        setMostCompleted({ name: mostCompletedClimb.name, id: mostCompletedClimb.id, grade: mostCompletedClimb.grade });
      } else {
        setMostCompleted({ name: '', id: '', grade: '' });
      }

      if (leastCompletedClimb) {
        setLeastCompleted({ name: leastCompletedClimb.name, id: leastCompletedClimb.id, grade: leastCompletedClimb.grade });
      } else {
        setLeastCompleted({ name: '', id: '', grade: '' });
      }

    };


    if (yourClimbs.length > 0) {
      fetchTapsAndCalculateAscents();
    }
  }, [yourClimbs]);


  useEffect(() => {
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
