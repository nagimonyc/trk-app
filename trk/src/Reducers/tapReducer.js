const initialState = {
    climbIDs: [],
    currentUsers: [],
    currentRoles: [],
    // other state properties if needed.
    // need to build this out if more data is stored on the NFC tag.
  };

 


function tapReducer(state = initialState, action) {
switch (action.type) {
    case 'ADD_CLIMB_COMMIT':
    // Climb successfully processed.
    //console.log('Climb Processed: ', action.meta.climbId);
    //console.log('User Processed: ', action.meta.currentUser);
    //console.log('Role Processed: ', action.meta.role);
    return {
        ...state,
        climbIDs: state.climbIDs.filter(id => id !== action.meta.climbId),
        currentUsers: state.currentUsers.filter(id => id !== action.meta.currentUser),
        currentRoles: state.currentRoles.filter(id => id !== action.meta.role),
    };
    case 'ADD_CLIMB':
    // Climb read from NFC tag.
    //console.log('Added Climb: ', action.payload.climbId); // Log the added climb ID
    //console.log('Added User: ', action.payload.currentUser); // Log the added currentUser
    //console.log('Added Role: ', action.payload.role); // Log the added role
    return {
        ...state,
        climbIDs: [...state.climbIDs, action.payload.climbId],
        currentUsers: [...state.currentUsers, action.payload.currentUser],
        currentRoles: [...state.currentRoles, action.payload.role],
    };
    case 'ADD_CLIMB_ROLLBACK':
    // Failed to process climb ID.
    //console.log('Failed to process climb ID:', action.meta.climbId);
    //console.log('Failed to process current User:', action.meta.currentUser);
    //console.log('Failed to process current role:', action.meta.role);
    return state;
    default:
    return state;
}
}

export default tapReducer;  