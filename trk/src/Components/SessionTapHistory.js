import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';
import { ScrollView, Text, View } from 'react-native';
import moment from 'moment-timezone';

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
    return moment(timestamp).format("Do MMM [starting at] h A");
};


// Helper function to group climbs by 4-hour ranges using Moment.js
const groupClimbsByTimestamp = (climbs) => {
    const grouped = {};
    climbs.forEach(climb => {
        // Use Moment.js for date manipulation
        const date = moment(climb.tapTimestamp).tz('America/New_York');
        //console.log(date);
        // Round down the timestamp to the nearest 4 hours
        const roundedDate = date.subtract(date.hour() % 4, 'hours').startOf('hour');
        //console.log(roundedDate);
        const key = roundedDate.valueOf(); // Use the adjusted timestamp as a key
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(climb);
    });
    return grouped;
};


const SessionTapHistory = (props) => {
    console.log('[TEST] SessionTapHistory called');
    // Group climbs by timestamp
    const groupedClimbs = groupClimbsByTimestamp(props.climbsHistory);
    return (
        <ScrollView>
            {Object.entries(groupedClimbs).map(([key, climbs]) => (
                <View key={key}>
                    <Text style={{color: 'black', padding: 10, fontWeight: 'bold'}}>
                        {`Session on ${formatTimestamp(Number(key))}`}
                    </Text>
                    <ListHistory
                        data={climbs}
                        renderItem={(item) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={item.tapTimestamp} fromHome={props.fromHome} />}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>
            ))}
        </ScrollView>
    );
}

export default SessionTapHistory;