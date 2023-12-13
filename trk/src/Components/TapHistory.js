import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';

const TapHistory = (props) => {
    console.log('[TEST] TapHistory called');
    return (
        <ListHistory
            data={props.climbsHistory}
            renderItem={(climb) => <ClimbItem climb={climb} tapId={climb.tapId} tapTimestamp={climb.timestamp} fromHome={props.fromHome} />}
            keyExtractor={(climb, index) => index.toString()}
        />
    );
}

export default TapHistory;
