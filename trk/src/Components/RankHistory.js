import React from 'react';
import { View, ScrollView } from 'react-native';
import RankItem from './RankItem'; // Make sure the path is correct

const RankHistory = (props) => {
    return (
        <ScrollView contentContainerStyle={{ padding: 10 }}>
            {props.rankingHistory.map((user, index) => (
                <RankItem key={index} user={user} />
            ))}
        </ScrollView>
    );
}

export default RankHistory;