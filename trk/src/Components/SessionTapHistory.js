import React from 'react';
import ListHistory from './ListHistory';
import ClimbItem from './ClimbItem';
import { ScrollView, Text, View } from 'react-native';
import moment from 'moment-timezone';
import { StyleSheet } from 'react-native';
import SessionItem from './SessionItem';

//Removed all session creation code, moving it to ClimberProfile's backend. This allows for calculation of number of sessions, and future session tasks.
//ONLY DISPLAYING IS DONE HERE NOW

const SessionTapHistory = (props) => {
    console.log('[TEST] SessionTapHistory called');
    // Group climbs by timestamp
    console.log(props.climbsHistory);
    console.log(props.currentSession);

    // Helper function to format timestamp
    const formatTimestamp = (timestamp) => {
        const date = moment(timestamp).tz('America/New_York');
        
        // Round down to the nearest half hour
        const minutes = date.minutes();
        const roundedMinutes = minutes < 30 ? 0 : 30;
        date.minutes(roundedMinutes);
        date.seconds(0);
        date.milliseconds(0);
    
        let formatString;
        if (roundedMinutes === 0) {
            // Format without minutes for times on the hour
            formatString = 'Do MMM [starting at] h A';
        } else {
            // Format with minutes for times on the half hour
            formatString = 'Do MMM [starting at] h:mm A';
        }
    
        const formattedDate = date.format(formatString);
        if (formattedDate === 'Invalid date') {
            return 'Unknown Date';
        }
        return formattedDate;
    };

    // Helper function to format timestamp
    const sessionTimestamp = (timestamp) => {
        const date = moment(timestamp).tz('America/New_York');
        
        // Round down to the nearest half hour
        const minutes = date.minutes();
        const roundedMinutes = minutes < 30 ? 0 : 30;
        date.minutes(roundedMinutes);
        date.seconds(0);
        date.milliseconds(0);
    
        let formatString;
        let formatStringHeader;
        formatStringHeader = 'Do MMM';
        if (roundedMinutes === 0) {
            // Format without minutes for times on the hour
            formatString = 'dddd, h A';
        } else {
            // Format with minutes for times on the half hour
            formatString = 'dddd, h:mm A';
        }
        const formattedDate = date.format(formatString);
        const formattedDateSubtext = date.format(formatStringHeader);
        if (formattedDate === 'Invalid date' || formattedDateSubtext === 'Invalid date') {
            return ['Unknown Time', 'Unknown Date'];
        }
        return [formattedDate, formattedDateSubtext];
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

    const styles = StyleSheet.create({
        firstItemShadow: {
            shadowColor: 'blue',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.8,
            shadowRadius: 2,  
            elevation: 5 // for Android
        },
    });
    
    const groupedClimbs = props.currentSession;
    //Changes in display for active session (not empty), active session (empty), and the remaining sessions (Session class created in next PR).
    return (
        <ScrollView>
            {Object.entries(groupedClimbs).reverse().map(([key, climbs]) => (
                <View key={key}>
                    <View style={{paddingVertical: 5, paddingHorizontal: 20}}>
                        {(props.isCurrent && climbs && climbs.length > 0) && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                                <Text style={{color: 'black', fontWeight: 'bold'}}>Climbs in Current Session</Text>
                                <View style={{padding: 5, borderRadius: 5, borderWidth: 1, borderColor: '#fe8100'}}>
                                    <Text style={{color: '#fe8100'}}>LIVE</Text>
                                </View>
                            </View>
                        )}
                        {(props.isCurrent && climbs && climbs.length == 0) && (
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                                <Text style={{color: 'black', fontWeight: 'bold'}}>No active session</Text>
                                <View style={{padding: 5, borderRadius: 5, borderWidth: 1, borderColor: '#fe8100'}}>
                                    <Text style={{color: '#fe8100'}}>LIVE</Text>
                                </View>
                            </View>
                        )}
                    </View>
                    {props.isCurrent && 
                        (<ListHistory
                        data={climbs}
                        renderItem={(item, index, isHighlighted) => <ClimbItem climb={item} tapId={item.tapId} tapTimestamp={timeStampFormatting(item.tapTimestamp)} fromHome={props.fromHome} isHighlighted={(index == 0 && isHighlighted)}/>}
                        //highlighted variable passed for index 0, only if it is an active session
                        keyExtractor={(item, index) => index.toString()}
                        isHighlighted = {props.isCurrent}
                        />)
                    }
                    {!props.isCurrent && 
                        (<SessionItem
                        data={climbs}
                        title={sessionTimestamp(key)}
                        />)
                    }
                </View>
            ))}
        </ScrollView>
    );
}

export default SessionTapHistory;