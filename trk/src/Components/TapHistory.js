import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';

const TapHistory = (props) => {
    console.log('[TEST] TapHistory called');
    return (
        <ListHistory
            data={props.climbsHistory}
            renderItem={(item) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={item.tapTimestamp} fromHome={props.fromHome} />}
            keyExtractor={(item, index) => index.toString()}
        />
    );
}

export default TapHistory;
