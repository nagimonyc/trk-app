import ClimbsApi from '../api/ClimbsApi';
import TapsApi from '../api/TapsApi';
import Toast from 'react-native-toast-message';

export const processClimbId = (climbId, currentUser, role) => {
    return new Promise(async(resolve, reject) => {
      // To process the climbId
      console.log('Processing climbId:', climbId);
      console.log('Current User: ', currentUser);
      console.log('Current Role: ', role);
      try {
        const climbDataResult = await ClimbsApi().getClimb(climbId);
        if (climbDataResult && climbDataResult._data) {
          if (currentUser.uid !== climbDataResult._data.setter && role !== "setter") { //case for climbers (tap should log), else should not
            const { addTap } = TapsApi();
            const tap = {
              climb: climbId,
              user: currentUser.uid,
              timestamp: new Date(),
              completion: 0,
              attempts: '',
              witness1: '',
              witness2: '',
            };
  
            await addTap(tap);
            resolve('Success'); 
            //Show an alert Here
            console.log('Climb was processed!');
            Toast.show({
                type: 'success',
                text1: 'Offline Tap Processed!',
            });
          } else {
            // Handle the case where currentUser.uid === climbDataResult._data.setter
            console.log('The Setter is the user or this a Setter Account. Tap was not added');
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
