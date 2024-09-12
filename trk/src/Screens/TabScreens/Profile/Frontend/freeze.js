import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Button, StyleSheet, Alert } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { AuthContext } from '../../../../Utils/AuthContext';
import { formatDateToEasternTime } from '../../../../Utils/dateHelpers'; // Assuming both helper functions exist
import admin from '@react-native-firebase/app';

const Freeze = ({ navigation }) => {
    const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
    const [endDate, setEndDate] = useState('');
    const [freezeConfirmed, setFreezeConfirmed] = useState(false);
    const [isFreezing, setIsFreezing] = useState(false);  // New state for "Freeze Membership" button
    const [isCancelingFreeze, setIsCancelingFreeze] = useState(false);  // New state for "Cancel Freeze" button
    const { currentUser } = useContext(AuthContext);
    const today = new Date();
    const oneMonthFromToday = new Date();
    oneMonthFromToday.setMonth(today.getMonth() + 1);
    const oneYearFromToday = new Date();
    oneYearFromToday.setFullYear(today.getFullYear() + 1);

    useEffect(() => {
        if (currentUser?.isPaused && currentUser?.resumeDate) {
            setEndDate(formatDateToEasternTime(currentUser.resumeDate));
            setFreezeConfirmed(true);
        }
    }, [currentUser]);

    const showEndDatePicker = () => {
        setEndDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setEndDatePickerVisibility(false);
    };

    const handleEndDateConfirm = (selectedDate) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = selectedDate.toLocaleDateString('en-US', options);
        setEndDate(formattedDate);
        hideDatePicker();
    };

    const getFormattedBillingCycleEndDate = () => {
        if (currentUser?.currentPeriodEnd) {
            return formatDateToEasternTime(currentUser.currentPeriodEnd);
        } else {
            return 'Unknown';
        }
    };

    const confirmFreeze = () => {
        const freezeStartDate = getFormattedBillingCycleEndDate();

        Alert.alert(
            "Freeze Membership",
            `Your membership will be frozen from ${freezeStartDate} until ${endDate}. Do you wish to proceed?`,
            [
                { text: "No", style: "cancel" },
                { text: "Yes", onPress: freezeMembership }
            ],
            { cancelable: true }
        );
    };

    const freezeMembership = async () => {
        setIsFreezing(true); // Set loading state for freezing button
        try {
            const pauseResponse = await fetch('https://us-central1-trk-app-505a1.cloudfunctions.net/pauseSubscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: currentUser.subscriptionId,
                    endDate
                }),
            });

            if (!pauseResponse.ok) {
                throw new Error(`HTTP error! status: ${pauseResponse.status}`);
            }

            const taskResponse = await fetch('https://us-central1-trk-app-505a1.cloudfunctions.net/scheduleResumeTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: currentUser.subscriptionId,
                    userId: currentUser.uid,
                    resumeDate: endDate
                }),
            });

            if (!taskResponse.ok) {
                throw new Error(`HTTP error! status: ${taskResponse.status}`);
            }

            const userRef = admin.firestore().collection('users').doc(currentUser.uid);
            await userRef.update({
                isPaused: true,
                resumeDate: Math.floor(new Date(endDate).getTime() / 1000)
            });

            setFreezeConfirmed(true);
            Alert.alert('Success', `Your membership will be frozen until ${endDate}.`);
        } catch (error) {
            console.error('Failed to freeze subscription or schedule task:', error);
            Alert.alert('Error', 'Failed to freeze subscription or schedule task.');
        } finally {
            setIsFreezing(false); // Reset loading state for freezing button
        }
    };

    const cancelFreeze = async () => {
        setIsCancelingFreeze(true); // Set loading state for canceling freeze button
        try {
            const cancelResponse = await fetch('https://us-central1-trk-app-505a1.cloudfunctions.net/cancelScheduledResumeTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subscriptionId: currentUser.subscriptionId,
                    userId: currentUser.uid
                }),
            });

            if (!cancelResponse.ok) {
                throw new Error(`HTTP error! status: ${cancelResponse.status}`);
            }

            setFreezeConfirmed(false);
            setEndDate('');
            Alert.alert('Success', 'Your freeze has been canceled.');
        } catch (error) {
            console.error('Failed to cancel freeze:', error);
            Alert.alert('Error', 'Failed to cancel freeze.');
        } finally {
            setIsCancelingFreeze(false); // Reset loading state for canceling freeze button
        }
    };

    const title = freezeConfirmed ? 'Manage Freeze' : 'Freeze Plan';

    return (
        <View style={{ marginHorizontal: 15 }}>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.subtitle}>
                Select an end date for the freeze period. Payment collection will be paused until that date.
            </Text>

            {freezeConfirmed ? (
                <>
                    <Text style={styles.infoText}>
                        Currently, your membership will be frozen from {getFormattedBillingCycleEndDate()} until {endDate}.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.cancelButton, isCancelingFreeze ? styles.disabledButton : null]}
                            onPress={cancelFreeze}
                            disabled={isCancelingFreeze}
                        >
                            <Text style={styles.buttonText}>
                                {isCancelingFreeze ? 'Canceling Freeze...' : 'Cancel Freeze'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <>
                    <TouchableOpacity onPress={showEndDatePicker} style={styles.dateInput}>
                        <Text style={styles.dateText}>{endDate ? endDate : 'Select End Date'}</Text>
                    </TouchableOpacity>

                    <DateTimePickerModal
                        isVisible={isEndDatePickerVisible}
                        mode="date"
                        minimumDate={oneMonthFromToday}
                        maximumDate={oneYearFromToday}
                        onConfirm={handleEndDateConfirm}
                        onCancel={hideDatePicker}
                    />

                    {endDate && (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.freezeButton, isFreezing ? styles.disabledButton : null]}
                                onPress={confirmFreeze}
                                disabled={isFreezing}
                            >
                                <Text style={styles.buttonText}>
                                    {isFreezing ? 'Freezing...' : 'Freeze Membership'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontFamily: "DMSans-SemiBold",
        fontSize: 32,
        marginTop: 30,
        color: 'black'
    },
    subtitle: {
        fontFamily: "DMSans-Regular",
        fontSize: 14,
        marginTop: 15,
        color: '#686868',
    },
    infoText: {
        fontFamily: "DMSans-Regular",
        fontSize: 14,
        marginTop: 10,
        color: '#007AFF',
    },
    dateInput: {
        marginTop: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 5,
    },
    dateText: {
        fontFamily: "DMSans-Regular",
        color: '#686868',
    },
    buttonContainer: {
        marginTop: 20,
    },
    freezeButton: {
        height: 32.5,
        borderRadius: 15,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        height: 32.5,
        borderRadius: 15,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontFamily: "DMSans-SemiBold",
        fontSize: 14,
        color: 'white',
    },
    disabledButton: {
        backgroundColor: '#d3d3d3',
    }
});

export default Freeze;