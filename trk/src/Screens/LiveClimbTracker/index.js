import React, { useState, useContext, useEffect } from "react";
import { View, Text, Button, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, SafeAreaView } from "react-native";
import firestore from '@react-native-firebase/firestore';
import { AuthContext } from "../../Utils/AuthContext";
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DropDownPicker from "react-native-dropdown-picker";
import usePopularTimesData from "../LiveClimbTracker_Backend/LiveClimbTrackerLogic";
import CalendarStrip from 'react-native-calendar-strip';
import { ActivityIndicator } from 'react-native';
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import moment from "moment-timezone";

const LiveClimbTracker = () => {
    const navigation = useNavigation(); 
    const { currentUser } = useContext(AuthContext);

    const [openGymPicker, setOpenGymPicker] = useState(false);
    const [openClimbPicker, setOpenClimbPicker] = useState(false);
    const currentDate = moment.tz({ year: 2023, month: 11, day: 12 }, 'America/New_York');
    const [activeDate, setActiveDate] = useState(currentDate);
    
    const [reloadTrigger, setReloadTrigger] = useState(false);
    const handleReload = () => {
        setReloadTrigger(prev => !prev); // Toggle the state to trigger a reload
    };

    const [selectedGymId, setSelectedGymId] = useState(null);
    const [selectedClimbId, setSelectedClimbId] = useState(null);
    const { gyms, climbs, taps, loading, formattedTaps } = usePopularTimesData(selectedGymId, selectedClimbId, reloadTrigger, activeDate);

    // Logic for the live line position
    const chartWidth = Dimensions.get('window').width - 60;
    const chartStartTime = moment().tz('America/New_York').set({ hour: 6, minute: 0, second: 0 });
    const chartEndTime = moment().tz('America/New_York').set({ hour: 22, minute: 0, second: 0 });
    const [liveLinePosition, setLiveLinePosition] = useState(null);
    const [liveLineText, setLiveLineText] = useState("Not too busy");
    const [currentTime, setCurrentTime] = useState(moment().tz('America/New_York'));

    //Calculation of quartiles to fix the Text shown (based on how busy). Text logic is implemented below.
    const calculateQuartiles = (data) => {
        const sortedData = [...data].sort((a, b) => a - b);
        const quartile = (q) => {
            const pos = (sortedData.length - 1) * q;
            const base = Math.floor(pos);
            const rest = pos - base;
    
            if (sortedData[base + 1] !== undefined) {
                return sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]);
            } else {
                return sortedData[base];
            }
        };
        
        return {
            q1: quartile(0.25),
            q2: quartile(0.50), // Median
            q3: quartile(0.75)
        };
    };

    //Logic for the live line position and text. The quartiles are calculated, and the taps are fetched for the previous hour. Based on quartile value, the taps are assigned a text block. Updates every minute, with pre-existing data.
    const updateLiveLinePosition = () => {
        console.log('Live Line Updated!');
        const currentTime = moment().tz('America/New_York');
        setCurrentTime(currentTime);
        if (currentTime.isBetween(chartStartTime, chartEndTime)) {
            const currentHour = currentTime.hour();
            const startHour = chartStartTime.hour();
            const index = currentHour - startHour - 1; // -1 for the previous hour
    
            if (index >= 0 && index < formattedTaps.datasets[0].data.length) {
                const taps = formattedTaps.datasets[0].data[index];
                const quartiles = calculateQuartiles(formattedTaps.datasets[0].data);
    
                if (taps <= quartiles.q1) {
                    setLiveLineText("Not too busy");
                } else if (taps <= quartiles.q3) {
                    setLiveLineText("Busy");
                } else {
                    setLiveLineText("Very Busy");
                }
            }
    
            const percentOfDayPassed = (currentTime.diff(chartStartTime) / chartEndTime.diff(chartStartTime));
            setLiveLinePosition(percentOfDayPassed * chartWidth);
        } else {
            setLiveLinePosition(null);
        }
    };

    //Updates the live line position based on time.
    useEffect(() => {
        updateLiveLinePosition(); // Update on mount and dependencies change

        const intervalId = setInterval(updateLiveLinePosition, 60000); // Update every minute

        return () => clearInterval(intervalId); // Clean up the interval
    }, [selectedGymId, reloadTrigger]);

    //To change based on calendar strip date.
    const fetchGraph = (date) => {
        console.log('Fetching: ', date);
        setActiveDate(moment(date)); // Set the new date
        handleReload(); // Trigger a reload
    };
    
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 20, paddingHorizontal: 20}}>
            <Text style={{ fontSize: 20, marginBottom: 20, color: 'black'}}>Popular Times</Text>
            <View style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, width: '100%', marginBottom: 40}}>
            <DropDownPicker
                open={openGymPicker}
                value={selectedGymId}
                items={gyms}
                setOpen={setOpenGymPicker}
                setValue={setSelectedGymId}
                placeholder="Select a Gym"
                style={{ height: 40}}
                containerStyle={{width: '80%', marginRight: 30}}
            />
            <TouchableOpacity onPress={handleReload} style={{height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#3498db', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50}}>
                <Text style={{color: 'white', textAlign: 'center'}}>Reload</Text>
            </TouchableOpacity>
            </View>
            {/* Visualization of taps data goes here */}
            <View style={{width: '100%', height: '100%'}}>
            <CalendarStrip
                style={{height: 50, paddingTop: 20, paddingBottom: 20, color:'black'}}
                calendarColor={'transparent'}
                dateNumberStyle={{color: 'black'}}
                dateNameStyle={{color: 'black'}}
                highlightDateNameStyle={{color: '#fe8100'}}
                highlightDateNumberStyle={{color: '#fe8100'}}
                highlightDateContainerStyle={{ borderBottomColor: '#fe8100', borderBottomWidth: 5, borderRadius: 0}}
                iconContainer={{flex: 0.1, display: 'none'}}
                showMonth={false}
                startingDate={currentDate}
                selectedDate={currentDate}
                onDateSelected={fetchGraph}
            />
            <View style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    {loading ? (
                        <ActivityIndicator size='large' color="#fe8100" style={{marginTop: 100}}/>
                    ) : (
                        <>
                        <View style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative'}}>
                            <BarChart
                                data={formattedTaps}
                                width={Dimensions.get('window').width - 40} // Window width minus some margin
                                height={250}
                                withHorizontalLabels={false}
                                fromZero={true}
                                style={{borderRadius: 10, paddingLeft: 0, paddingRight: 0, paddingTop: 20, paddingBottom: 0, marginLeft: 0}}
                                showBarTops={false}
                                fromNumber={15}
                                chartConfig={{
                                    decimalPlaces: 0,
                                    backgroundColor: "rgb(211, 211, 211)",
                                    backgroundGradientFrom: "rgb(211, 211, 211)",
                                    backgroundGradientTo: "rgb(211, 211, 211)",
                                    backgroundGradientFromOpacity: 0,
                                    backgroundGradientToOpacity: 0,
                                    color: () => `rgba(0, 0, 0, ${0.5})`, // Text color
                                    labelColor: () => `rgba(0, 0, 0, ${0.5})`, // Axis and labels color
                                    barPercentage: 0.3, // Depending on library, adjust bar width
                                    barRadius: 5,
                                    useShadowColorFromDataset: false, // Ensure that bar colors are not affected by dataset shadow color
                                    fillShadowGradient: '#fe8100', // Gradient fill for bars, if supported
                                    fillShadowGradientOpacity: 0.5, // Full color opacity
                                    propsForBackgroundLines: {
                                        strokeDasharray: "", // Solid line for grid lines
                                        stroke: "grey", // Grid line color
                                        strokeWidth: 1, // Grid line width
                                        strokeOpacity: 0.1, // Grid line opacity
                                    },
                                    propsForHorizontalLabels: {
                                        marginBottom: 3
                                    }
                                }}                                
                            />
                    {liveLinePosition !== null && (
                            <View style={{
                                position: 'absolute',
                                bottom: 0, // Adjust according to where the bottom of the bar chart is
                                left: liveLinePosition+8,
                                height: '100%',
                                borderLeftColor: 'rgba(254, 129, 0, 0.5)',
                                borderStyle: 'dashed',
                                borderLeftWidth: 2,
                                alignItems: 'center',
                                top: 40
                            }}>
                                <View style={{
                                position: 'absolute',
                                bottom: 0, // Adjust to place the label correctly
                                borderRadius: 10,
                                padding: 5
                                }}>
                                <Text style={{ color: 'white', backgroundColor: 'rgb(254, 129, 0)', padding: 5, borderRadius: 10}}>Live</Text>
                                </View>
                            </View>)}
                        </View>
                        <View style={{
                            marginTop: 50,
                            padding: 10,
                            borderRadius: 10,
                            alignItems: 'center',
                        }}>
                            <Text style={{
                                color: 'black',
                                fontSize: 16,
                                fontWeight: 'bold',
                            }}>
                                {currentTime.format('h:mm A')}
                            </Text>
                            {selectedGymId && (<Text style={{
                                color: 'black',
                                fontSize: 14,
                                marginTop: 5,
                            }}>
                                {liveLineText}
                            </Text>)}
                        </View>
                    </>
                    )}
            </View>
            </View>
        </View>
    );
};

export default LiveClimbTracker;