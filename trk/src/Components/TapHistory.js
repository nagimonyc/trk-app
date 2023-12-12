import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';

const TapHistory = (props) => {
    console.log('[TEST] TapHistory called');
    console.log("props.isLatest is " + props.latestTapId);
    return (
        <ListHistory
            data={props.climbsHistory}
            renderItem={(climb) => <ClimbItem climb={climb} tapId={climb.tapId} isLatest={climb.tapId === props.latestTapId} />}
            keyExtractor={(climb, index) => index.toString()}
        />
    );
}

export default TapHistory;
