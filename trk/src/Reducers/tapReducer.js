const initialState = {
    climbIDs: [],
    currentUsers: [],
    // other state properties if needed.
    // need to build this out if more data is stored on the NFC tag.
  };

 


function tapReducer(state = initialState, action) {
switch (action.type) {
    case 'ADD_CLIMB_COMMIT':
    // Climb successfully processed.
    console.log('Climb Processed: ', action.meta.climbId);
    console.log('User Processed: ', action.meta.currentUser);
    return {
        ...state,
        climbIDs: state.climbIDs.filter(id => id !== action.meta.climbId),
        currentUsers: state.currentUsers.filter(id => id !== action.meta.currentUser),
    };
    case 'ADD_CLIMB':
    // Climb read from NFC tag.
    console.log('Added Climb: ', action.payload.climbId); // Log the added climb ID
    console.log('Added User: ', action.payload.currentUser); // Log the added currentUser
    return {
        ...state,
        climbIDs: [...state.climbIDs, action.payload.climbId],
        currentUsers: [...state.currentUsers, action.payload.currentUser],
    };
    case 'ADD_CLIMB_ROLLBACK':
    // Failed to process climb ID.
    console.error('Failed to process climb ID:', action.meta.climbId);
    console.error('Failed to process current User:', action.meta.currentUser);
    return state;
    default:
    return state;
}
}

export default tapReducer;  