import React, { useEffect, useState, useContext } from 'react';
import { Text, View, ScrollView, SafeAreaView, StyleSheet, TouchableOpacity } from "react-native";
import { AuthContext } from '../../../../../Utils/AuthContext';
import DropDownPicker from 'react-native-dropdown-picker';
import {
  fetchSetClimbs,
  fetchTapsAndCalculateAscents,
  fetchCommentsAndCalculateFeedback,
  fetchSets
} from '../Backend/analyticsCalculations';


const GymDaily = ({navigation}) => {

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
      const climbs = await fetchSetClimbs(userId, 'Commercial');
      if (climbs && climbs.length > 0) {
        setYourClimbs(prev => climbs);
        setTotalClimbs(climbs? climbs.length.toString(): '');
      }
      const {uniqueSets, defaultSelected} = await fetchSets();
      if (uniqueSets && uniqueSets.length > 0) {
        setSets(uniqueSets);
      }
      if (defaultSelected) {
        setSelectedSetId(defaultSelected);
      }
    };
    initializeSetClimbs();
  }, [userId, currentUser]);

  useEffect(() => {

    const processTapsAndAscents = async () => {
      if (yourClimbs && yourClimbs.length > 0) {
        const {
          totalTaps,
          allTaps,
          peakTimeString,
          latestAscentsCount,
          mostCompletedClimbs,
          leastCompletedClimbs
        } = await fetchTapsAndCalculateAscents(yourClimbs);

        setAscents(allTaps);
        setTotalAscents(totalTaps.toString());
        setLatestAscents(latestAscentsCount.toString());
        setPeakTime(peakTimeString);
        setMostCompleted(mostCompletedClimbs[0] || { name: '', id: '', grade: '' });
        setLeastCompleted(leastCompletedClimbs[0] || { name: '', id: '', grade: '' });
      }
    };

    processTapsAndAscents();
  }, [yourClimbs]);


  useEffect(() => {

    if (yourClimbs && yourClimbs.length > 0) {
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

  const onClick = (title) => {
    navigation.navigate('Data Detail', title)
  }

  //On selectedsetId changed

  //For the DropDown
  const [openSetPicker, setOpenSetPicker] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [sets, setSets] = useState([]);

  return (
    <ScrollView>
      <SafeAreaView>
          <View style={{width: '100%', display: 'flex',flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10}}>
            {sets && sets.length > 0 && <DropDownPicker
                  open={openSetPicker}
                  value={selectedSetId}
                  items={sets}
                  setOpen={setOpenSetPicker}
                  setValue={setSelectedSetId}
                  placeholder="Commercial"
                  style={{height: 40}}
                  containerStyle={{marginTop: 30}}
                  zIndex={100}
                  listMode="SCROLLVIEW"
            />}
          </View>
          <View style={styles.boxCollection}>

            <View style={styles.row}>
            <TouchableOpacity style={styles.box} onPress={() => onClick('Active Climbs')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.activeBigNumber}>{totalClimbs}</Text>
                  <Text style={{color: 'black'}}>Active Climbs</Text>
                </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.box} onPress={() => onClick('Total Ascents')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.bigNumber}>{totalAscents}</Text>
                  <Text style={{color: 'black'}}>Total ascents</Text>
                </View>
              </TouchableOpacity>
              </View>
              

            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.box} onPress={() => onClick('Highest Completion')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.routeTitle}>{mostCompleted.name}</Text>
                  <Text style={styles.routeGrade}>{mostCompleted.grade}</Text>
                </View>
                <Text style={styles.textBottom}>Most completed route</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.box} onPress={() => onClick('Highest Rated')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.routeTitle}>{highestRated.name}</Text>
                  <Text style={styles.routeGrade}>{highestRated.grade}</Text>
                </View>
                <Text style={styles.textBottom}>Highest rated climb</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.box} onPress={() => onClick('Lowest Completion')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.routeTitle}>{leastCompleted.name}</Text>
                  <Text style={styles.routeGrade}>{leastCompleted.grade}</Text>
                </View>
                <Text style={styles.textBottom}>Least completed route</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.box} onPress={() => onClick('Latest Feedback')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.feedback}>{latestFeedback.explanation}</Text>
                  <Text style={styles.rating}>{getStars(latestFeedback.rating)}</Text>
                  <Text style={styles.climbName}>{latestFeedback.climbName} - {latestFeedback.climbGrade}</Text>
                </View>
                <Text style={styles.textBottom}>Latest feedback</Text>

              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <TouchableOpacity style={styles.box} onPress={() => onClick('Heatmap')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.time}>{peakTime}</Text>
                  <Text style={{color: 'black'}}>Most active time</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.box} onPress={() => onClick('Latest Ascents')}>
                <View style={styles.centeredContent}>
                  <Text style={styles.bigNumber}>{latestAscents}</Text>
                  <Text style={{color: 'black'}}>Ascents since yesterday</Text>
                </View>
              </TouchableOpacity>
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
    color: 'black',
  },
  climbName: {
    marginBottom: 10,
    color: 'black',
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  textBottom: {
    textAlign: 'center',
    marginBottom: 10,
    color: 'black'
  },

});

export default GymDaily;
