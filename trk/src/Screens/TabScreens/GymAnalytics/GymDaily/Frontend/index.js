import React, { useEffect, useState, useContext } from 'react';
import { Text, View, ScrollView, SafeAreaView, StyleSheet } from "react-native";
import { AuthContext } from '../../../../../Utils/AuthContext';
import {
  fetchSetClimbs,
  fetchTapsAndCalculateAscents,
  fetchCommentsAndCalculateFeedback
} from '../Backend/analyticsCalculations';


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
  const userId = currentUser?.uid;

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

    if (yourClimbs.length > 0) {
      const processCommentsAndFeedback = async () => {
        const {
          comments,
          highestRatedClimbDetails,
          latestFeedbackDetails
        } = await fetchCommentsAndCalculateFeedback(yourClimbs);

        setYourComments(comments);
        if (highestRatedClimbDetails) {
          setHighestRated({
            name: highestRatedClimbDetails.name,
            grade: highestRatedClimbDetails.grade,
            type: highestRatedClimbDetails.type,
            climb: highestRatedClimbDetails.id
          });
        }
        if (latestFeedbackDetails) {
          setLatestFeedback({
            explanation: latestFeedbackDetails.explanation,
            climb: latestFeedbackDetails.climb,
            rating: latestFeedbackDetails.rating,
            climbName: latestFeedbackDetails.climbName,
            climbGrade: latestFeedbackDetails.climbGrade
          });
        }
      };

      processCommentsAndFeedback();
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
    color: 'black',
  },
  activeBigNumber: {
    fontWeight: 'bold',
    fontSize: 35,
    marginBottom: 13,
    color: 'black',
  },
  bigNumber: {
    fontWeight: 'bold',
    fontSize: 35,
    marginBottom: 13,
    color: 'black',
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
    flex: 1,
  },
  textBottom: {
    textAlign: 'center',
    marginBottom: 10,
  },

});

export default GymDaily;
