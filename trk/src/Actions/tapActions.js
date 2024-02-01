import ClimbsApi from '../api/ClimbsApi';
import TapsApi from '../api/TapsApi';
import Toast from 'react-native-toast-message';
import { firebase } from '@react-native-firebase/functions';
import SessionsApi from '../api/SessionsApi';
//To create new sessions

//Updated Processing to add Push Notifications (Session marks (separations), are now stored in tap objects (isSession, expiryTime))- PUSH NOTIFICATION SCHEDULED WHEN SESSION IS CREATED
export const processClimbId = (climbId, currentUser, role) => {
    
    //To format the tiemstamp for the session title
    const formatTimestamp = (timestamp) => {
      const date = moment(timestamp).tz('America/New_York');
      
      // Round down to the nearest half hour
      const minutes = date.minutes();
      const roundedMinutes = minutes < 30 ? 0 : 30;
      date.minutes(roundedMinutes);
      date.seconds(0);
      date.milliseconds(0);

      let formatString;
      formatString = 'Do MMM';

      const formattedDate = date.format(formatString);
      if (formattedDate === 'Invalid date') {
          return 'Unknown Date';
      }
      return formattedDate;
  };

    return new Promise(async(resolve, reject) => {
      // To process the climbId
      //console.log('Processing climbId:', climbId);
      //console.log('Current User: ', currentUser);
      //console.log('Current Role: ', role);
      try {
        const climbDataResult = await ClimbsApi().getClimb(climbId);
        if (climbDataResult && climbDataResult._data) {
          if (currentUser.uid !== climbDataResult._data.setter && role !== "setter") { //case for climbers (tap should log), else should not
            const { addTap, getLastUserTap} = TapsApi();
            
              let isSessionStart = false;
              const lastTapSnapshot = await getLastUserTap(currentUser.uid);
              let lastUserTap = null;
              //console.log('Snapshot: ', lastTapSnapshot.docs);
              if (!lastTapSnapshot.empty) {
                lastUserTap = lastTapSnapshot.docs[0].data();
                //console.log('Last Tap Data:', lastUserTap);
              }
              const currentTime = new Date();
              const sixHoursLater = new Date(currentTime.getTime() + (6 * 60 * 60 * 1000)); // Add 6 hours in milliseconds
            if (!lastUserTap || !lastUserTap.expiryTime) {
                // No last tap or no data in last tap, start a new session
                isSessionStart = true;
            } else {
                const lastExpiryTime = lastUserTap.expiryTime ? lastUserTap.expiryTime.toDate() : null;
                if (!lastExpiryTime || currentTime > lastExpiryTime) {
                    // If expiry time is not set or current time is past the expiry time
                    isSessionStart = true;
                } else {
                    // Current time is within the expiry time of the last session
                    isSessionStart = false;
                }
            }            

              const tap = {
                archived: false,
                climb: climbId,
                user: currentUser.uid,
                timestamp: currentTime,
                completion: 0,
                attempts: '',
                witness1: '',
                witness2: '',
                isSessionStart: isSessionStart,
                expiryTime: isSessionStart ? sixHoursLater : (lastUserTap?.expiryTime || null),
            };

            const documentReference =  await addTap(tap);
            const tapDataResult = await TapsApi().getTap(documentReference.id);
            if (isSessionStart) {
                  //Make a session object with climbs, featured_climb, name, images, tagged_users, expiryTime, archived
                  const session = {
                    archived: false,
                    climbs: [documentReference.id],
                    featuredClimb: documentReference.id,
                    user: currentUser.uid,
                    name: 'Session on '+formatTimestamp(currentTime),
                    sessionImages: [],
                    taggedUsers: [],
                    expiryTime: sixHoursLater,
                    timestamp: currentTime,                    
                  }
                  await SessionsApi().addSession(session);
                  const scheduleFunction = firebase.functions().httpsCallable('scheduleFunction');
                  const expiryTimeForFunction = tap.expiryTime instanceof Date ? tap.expiryTime.toISOString() : tap.expiryTime;
                  scheduleFunction({tapId: documentReference.id, expiryTime: expiryTimeForFunction})
                    .then((result) => {
                        // Read result of the Cloud Function.
                        //console.log('Function result:', result.data);
                    }).catch((error) => {
                        // Getting the Error details.
                        console.error('Error calling function:', error);
                    });
            } else {
              //If the tap is not the start of a session, place it in climbs of that session (fetch by expiryTime)
              const lastSessionSnapshot = await SessionsApi().getLastUserSession(currentUser.uid);
              if (lastSessionSnapshot.empty) {
                  //Error, if it is not the start of a session, there should be data here
                  console.error("Session doesn't exist, but current tap is not the start of the session.");
              } else {
                  const lastSession = lastSessionSnapshot.docs[0];
                  const updatedSession = {
                      climbs: [documentReference.id].concat(lastSession.data().climbs),
                      featuredClimb: documentReference.id,                    
                  }
                  console.log('Last Session Fetched: ', lastSession.data());
                  await SessionsApi().updateSession(lastSession.id, updatedSession);
              }
            }
            resolve('Success'); 
            //Show an alert Here
            //console.log('Climb was processed!');
            Toast.show({
                type: 'success',
                text1: 'Offline Tap Processed!',
            });
          } else {
            // Handle the case where currentUser.uid === climbDataResult._data.setter
            //console.log('The Setter is the user or this a Setter Account. Tap was not added');
            reject(new Error('User cannot log their own climb')); 
            Toast.show({
                type: 'success',
                text1: 'Offline Tap Processed!',
            });
          }
        } else {
          reject(new Error('Climb data not found'));
          Toast.show({
                type: 'error',
                text1: 'Offline Tap Processed. No climb data.',
            });
        }
      } catch (error) {
        //console.error('Error processing climbId:', error);
        reject(new Error('Firebase error'));
        Toast.show({
            type: 'error',
            text1: 'Offline Tap Processed. Error.',
        });
      }
    });
};

export const addClimb = (climbId, currentUser, role) => {
    return {
      type: 'ADD_CLIMB',
      payload: {climbId, currentUser, role},
      meta: {
        offline: {
          effect: { climbId: climbId, currentUser: currentUser, role: role},
          commit: { type: 'ADD_CLIMB_COMMIT', meta: {climbId, currentUser, role} },
          rollback: { type: 'ADD_CLIMB_ROLLBACK', meta: {climbId, currentUser, role} }
        }
      }
    };
};
