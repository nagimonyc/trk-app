import { createStore, applyMiddleware, combineReducers, compose} from 'redux';
import { offline } from '@redux-offline/redux-offline';
import offlineConfig from '@redux-offline/redux-offline/lib/defaults';
import { thunk } from 'redux-thunk'
import tapReducer from './Reducers/tapReducer';
import {processClimbId} from './Actions/tapActions';

const effect = (effect, _action) => {
    return processClimbId(effect.climbId, effect.currentUser, effect.role);
};

const discard = (error, action, retries) => {
    //console.log('In discard');
    if (error.message === 'User cannot log their own climb' || error.message === 'Climb data not found' || error.message === 'Firebase error') {
      // Don't retry these specific errors
      //console.log('Here');
      return true;
    }
    if (retries > 5) {
      return true;
    }
    return false;
};


const rootReducer = combineReducers({
  tap: tapReducer,
  // can add other reducers for other offline features.
  // need to build this out for other actions.
});

const store = createStore(
  rootReducer,
  compose(
  applyMiddleware(thunk),
  offline({
    ...offlineConfig,
    effect,
    discard
})));

export default store;