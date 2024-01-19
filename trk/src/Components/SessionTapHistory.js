import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';
import { ScrollView, Text, View } from 'react-native';
import moment from 'moment-timezone';

//Removed all session creation code, moving it to ClimberProfile's backend. This allows for calculation of number of sessions, and future session tasks.
//ONLY DISPLAYING IS DONE HERE NOW

const SessionTapHistory = (props) => {
    console.log('[TEST] SessionTapHistory called');
    // Group climbs by timestamp
    console.log(props.climbsHistory);
    console.log(props.sessions);

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
    
    //Time stamp formatting like Home Page for clarity (Altered ClimbItem to match)
    const timeStampFormatting = (timestamp) => {
        let tempTimestamp = null;
        if (timestamp.toDate) { // Convert Firebase Timestamp to JavaScript Date
            tempTimestamp = timestamp.toDate().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York' // NEW YORK TIME
            });
        }
        return tempTimestamp;
    };
    const groupedClimbs = props.sessions;
    return (
        <ScrollView>
            {Object.entries(groupedClimbs).map(([key, climbs]) => (
                <View key={key}>
                    <Text style={{color: 'black', paddingVertical: 10, fontWeight: 'bold', paddingHorizontal: 20}}>
                        {`Session on ${formatTimestamp(key)}`}
                    </Text>
                    <ListHistory
                        data={climbs}
                        renderItem={(item) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={timeStampFormatting(item.tapTimestamp)} fromHome={props.fromHome} />}
                        keyExtractor={(item, index) => index.toString()}
                    />
                </View>
            ))}
        </ScrollView>
    );
}

export default SessionTapHistory;