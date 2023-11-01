import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';

const TapHistory = (props) => {
    return (
        <ListHistory
            data={props.climbsHistory}
            renderItem={(climb) => <ClimbItem climb={climb} tapId={climb.tapId} />}
            keyExtractor={(climb, index) => index.toString()}
        />
    );
}

export default TapHistory;
