import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';
import { ScrollView, Text, View } from 'react-native';
import moment from 'moment-timezone';

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
    //console.log(timestamp);
    const formattedDate = moment(timestamp, 'YYYY-MM-DD HH:mm').tz('America/New_York').format('Do MMM [starting at] hA');
    if (formattedDate === 'Invalid date') {
        //console.error('Invalid date detected:', timestamp);
        return 'Unknown Date';
    }
    return formattedDate;
};


const convertTimestampToDate = (timestamp) => {
    console.log("Received timestamp:", timestamp);
    if (!timestamp || typeof timestamp.seconds !== 'number' || typeof timestamp.nanoseconds !== 'number') {
        console.error('Invalid or missing timestamp:', timestamp);
        return null; // Return null or a default date, as per your logic
    }
    // Convert to milliseconds and create a new Date object
    return new Date(timestamp.seconds * 1000 + Math.round(timestamp.nanoseconds / 1000000));
};


const groupClimbsByTimestamp = (climbs) => {
    const grouped = {};
    climbs.forEach(climb => {
        const dateObject = convertTimestampToDate(climb.tapTimestamp);
        console.log('Date Object:', dateObject);
        if (!dateObject) {
            // Handle the error or skip this climb
            console.error('Skipping climb due to invalid date:', climb);
            return;
        }
        // Convert the timestamp to a standard JavaScript Date object
        const date = moment(dateObject).tz('America/New_York');
        
        // Round down the timestamp to the nearest 4 hours
        const hours = date.hours();
        const roundedHours = hours - (hours % 4);
        const roundedDate = date.clone().hours(roundedHours).minutes(0).seconds(0).milliseconds(0);

        const key = roundedDate.format('YYYY-MM-DD HH:mm'); // Formatted key
        console.log(key); // Debugging
        //console.log(climb.tapId);
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
    console.log(props.climbsHistory);
    const groupedClimbs = groupClimbsByTimestamp(props.climbsHistory);
    return (
        <ScrollView>
            {Object.entries(groupedClimbs).map(([key, climbs]) => (
                <View key={key}>
                    <Text style={{color: 'black', padding: 10, fontWeight: 'bold'}}>
                        {`Session on ${formatTimestamp(key)}`}
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