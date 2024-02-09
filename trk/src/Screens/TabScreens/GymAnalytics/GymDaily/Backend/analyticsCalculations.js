import ClimbsApi from "../../../../../api/ClimbsApi";
import TapsApi from "../../../../../api/TapsApi";
import CommentsApi from "../../../../../api/CommentsApi";

export const fetchSetClimbs = async (userId, setName = 'Commercial') => { //You are selecting by Set already!
  const { getClimbsBySomeField } = ClimbsApi();
  try {
    const querySnapshot = await getClimbsBySomeField('set', setName);
    if (querySnapshot && querySnapshot.docs) {
      const climbs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(climb => !climb.archived);
      //const uniqueSets = Array.from(new Set(climbs.map(climb => climb.set))).filter(set => set !== null && set !== undefined).map((doc, index) => ({label: doc, value: index}));
      //console.log(uniqueSets);
      //return {
      //  climbs: climbs,
      //  uniqueSets: uniqueSets,
      //  defaultSelected: (uniqueSets.length > 0? uniqueSets[uniqueSets.length - 1].value: null)
      //}; // Return the processed data, unique sets for dropdown, and default selected set
      return climbs;
    } else {
      console.error("No data found in Firestore query");
      return []; // Return an empty array if no data is found
    }
  } catch (error) {
    console.error("Error fetching climbs:", error);
    return [];// Return an empty array in case of an error
  }
};

export const fetchSets = async () => { //You are selecting by Set already!
  //const { getClimbsBySomeField } = ClimbsApi();
  try {
    const querySnapshot = await ClimbsApi().getClimbsBySomeField('gym', 'dSlDcmXq4WHD5iyvYXFi');
    if (querySnapshot && querySnapshot.docs) {
      const climbs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      //console.log('Climbs: ', climbs);
      const uniqueSets = Array.from(new Set(climbs.map(climb => climb.set))).filter(set => set !== null && set !== undefined).map((doc, index) => ({label: doc, value: index}));
      //console.log(uniqueSets);
      return {
        uniqueSets: uniqueSets,
        defaultSelected: (uniqueSets.length > 0? uniqueSets[uniqueSets.length - 1].value: null)
      }; // Return the processed data, unique sets for dropdown, and default selected set
    } else {
      console.error("No data found in Firestore query");
      return {uniqueSets: null, defaultSelected: null}; // Return an empty array if no data is found
    }
  } catch (error) {
    console.error("Error fetching climbs:", error);
    return {uniqueSets: null, defaultSelected: null};// Return an empty array in case of an error
  }
};




export const fetchTapsAndCalculateAscents = async (yourClimbs) => {
  const { getTapsBySomeField } = TapsApi();

  let totalTaps = 0;
  let allTaps = [];
  let latestAscentsCount = 0;
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let climbFrequencyMap = {};
  let timeFrequencyMap = {};

  for (const climb of yourClimbs) {
    climbFrequencyMap[climb.id] = { count: 0, name: climb.name, id: climb.id, grade: climb.grade };
  }

  for (const climb of yourClimbs) {
    const tapsSnapshot = await getTapsBySomeField('climb', climb.id);
    if (tapsSnapshot && tapsSnapshot.docs) {
      const taps = tapsSnapshot.docs.map(doc => {
        const tap = doc.data();
        tap.timestamp = tap.timestamp.toDate();
        //console.log(`Tap Timestamp: ${tap.timestamp}`);
        return tap;
      });
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
  //console.log('Time Frequency Map: ', timeFrequencyMap);
  let peakTimeString = peakHour ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : '';

  // Determine most and least completed climbs
  let mostCompletedClimbs = [];
  let leastCompletedClimbs = [];
  let maxCount = 0;
  let minCount = Infinity;
  
  Object.values(climbFrequencyMap).forEach(climb => {
    if (climb.count > maxCount) {
      mostCompletedClimbs = [climb];
      maxCount = climb.count;
    } else if (climb.count === maxCount) {
      mostCompletedClimbs.push(climb);
    }
  
    if (climb.count < minCount) {
      leastCompletedClimbs = [climb];
      minCount = climb.count;
    } else if (climb.count === minCount) {
      leastCompletedClimbs.push(climb);
    }
  });
  // Return the calculated values
  return {
    totalTaps,
    allTaps,
    peakTimeString,
    latestAscentsCount,
    mostCompletedClimbs,
    leastCompletedClimbs
  };

};

export const fetchCommentsAndCalculateFeedback = async (yourClimbs) => {
  let comments = [];
  let highestRatedClimbDetails = null;
  let latestFeedbackDetails = null;

  try {
    const { getClimb } = ClimbsApi();
    const { getCommentsBySomeField } = CommentsApi(); 
    const commentsPromises = yourClimbs.map(climb =>
      getCommentsBySomeField('climb', climb.id)
    );
    const commentsSnapshots = await Promise.all(commentsPromises);

    commentsSnapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => comments.push({ ...doc.data(), timestamp: doc.data().timestamp.toDate() }));
    });

    if (comments.length > 0) {
      const latestComment = comments.reduce((latest, current) =>
        latest.timestamp > current.timestamp ? latest : current
      );

      const climbDetails = await getClimb(latestComment.climb);
      latestFeedbackDetails = {
        explanation: latestComment.explanation,
        climb: latestComment.climb,
        rating: latestComment.rating,
        climbName: climbDetails.data().name,
        climbGrade: climbDetails.data().grade
      };
    }

    let climbRatings = {};
    comments.forEach(comment => {
      if (!climbRatings[comment.climb]) {
        climbRatings[comment.climb] = { totalRating: 0, count: 0 };
      }
      climbRatings[comment.climb].totalRating += comment.rating;
      climbRatings[comment.climb].count++;
    });

    if (Object.keys(climbRatings).length > 0) {
      const highestRatedClimbId = Object.keys(climbRatings).reduce((a, b) =>
        (climbRatings[a].totalRating / climbRatings[a].count) > (climbRatings[b].totalRating / climbRatings[b].count) ? a : b
      );

      const highestRatedClimb = await getClimb(highestRatedClimbId);
      highestRatedClimbDetails = {
        name: highestRatedClimb.data().name,
        grade: highestRatedClimb.data().grade,
        type: highestRatedClimb.data().type,
        climb: highestRatedClimbId
      };
    }

    return {
      comments,
      highestRatedClimbDetails,
      latestFeedbackDetails
    };
  } catch (error) {
    console.error("Error fetching comments:", error);
    return {
      comments: [],
      highestRatedClimbDetails: null,
      latestFeedbackDetails: null
    };
  }
};