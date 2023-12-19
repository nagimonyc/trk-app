import ClimbsApi from "../api/ClimbsApi";
import TapsApi from "../api/TapsApi";
import { AuthContext } from "../Utils/AuthContext";
import CommentsApi from "../api/CommentsApi";

export const fetchSetClimbs = async (userId) => {
  const { getClimbsBySomeField } = ClimbsApi();
  try {
    const querySnapshot = await getClimbsBySomeField('setter', userId);
    if (querySnapshot && querySnapshot.docs) {
      const climbs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(climb => !climb.archived);
      return climbs; // Return the processed data
    } else {
      console.error("No data found in Firestore query");
      return []; // Return an empty array if no data is found
    }
  } catch (error) {
    console.error("Error fetching climbs:", error);
    return []; // Return an empty array in case of an error
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
    const tapsSnapshot = await getTapsBySomeField('climb', climb.id);
    if (tapsSnapshot && tapsSnapshot.docs) {
      const taps = tapsSnapshot.docs.map(doc => {
        const tap = doc.data();
        tap.timestamp = tap.timestamp.toDate();
        console.log(`Tap Timestamp: ${tap.timestamp}`);
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
  let peakTimeString = peakHour ? `${peakHour}:00 - ${parseInt(peakHour) + 1}:00` : '';

  // Determine most and least completed climbs
  let mostCompletedClimb = Object.values(climbFrequencyMap).reduce((a, b) => (a && b && a.count > b.count) ? a : b, null);
  let leastCompletedClimb = Object.values(climbFrequencyMap).reduce((a, b) => (a && b && a.count < b.count) ? a : b, null);

  // Return the calculated values
  return {
    totalTaps,
    allTaps,
    peakTimeString,
    latestAscentsCount,
    mostCompletedClimb,
    leastCompletedClimb
  };

};