import React from 'react';
import ListHistory from './ListHistory';
import RankItem from './RankItem';

const RankHistory = (props) => {
    return (
        <ListHistory
            data={props.rankingHistory}
            renderItem={(user) => <RankItem user={user} />}
            keyExtractor={(user, index) => index.toString()}
        />
    );
}

export default RankHistory;
