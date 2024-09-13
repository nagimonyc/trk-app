import React, { useState, useContext } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from "react-native";
import nagimoLogo from '../../../../../assets/nagimo-logo.png';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from "../../../../Utils/AuthContext";
import { formatDateToEasternTime, calculateDaysBetween } from '../../../../Utils/dateHelpers';

const Account = ({ route }) => {
    const navigation = useNavigation();
    const [isCanceling, setIsCanceling] = useState(false);
    const [localIsCancelled, setLocalIsCancelled] = useState(false);  // Local state to track cancellation
    const subscriptionId = route.params.subscriptionId;
    const { currentUser } = useContext(AuthContext);

    const isCancelled = currentUser.subscriptionStatus === "canceled";  // Check if the subscription is already canceled
    const isPaused = currentUser.isPaused;
    const currentPeriodEnd = currentUser.currentPeriodEnd;
    const resumeDate = currentUser.resumeDate;

    // Calculate the days left or handle frozen state
    let daysLeft = null;
    let membershipText = '';
    let renewalText = '';

    if (isPaused && resumeDate && Date.now() / 1000 > currentPeriodEnd) {
        membershipText = 'Membership frozen';
        renewalText = `Freeze ends ${formatDateToEasternTime(resumeDate)}`;
    } else if (isPaused && Date.now() / 1000 <= currentPeriodEnd) {
        daysLeft = calculateDaysBetween(Date.now(), currentPeriodEnd * 1000);
        membershipText = `${daysLeft} days left`;
        renewalText = `Freeze starts ${formatDateToEasternTime(currentPeriodEnd)}`;
    } else if (Date.now() / 1000 <= currentPeriodEnd) {
        daysLeft = calculateDaysBetween(Date.now(), currentPeriodEnd * 1000);
        membershipText = `${daysLeft} days left`;
        renewalText = `Renews ${formatDateToEasternTime(currentPeriodEnd)}`;
    } else {
        membershipText = 'Membership inactive';
        renewalText = '';
    }

    // Function to cancel the scheduled resume task and then cancel the subscription
    const cancelSubscription = async () => {
        try {
            setIsCanceling(true);

            // Step 1: Cancel the scheduled resume task if it exists
            const cancelTaskResponse = await fetch('https://us-central1-trk-app-505a1.cloudfunctions.net/cancelScheduledResumeTask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.uid, subscriptionId: subscriptionId }),
            });

            if (!cancelTaskResponse.ok) {
                throw new Error(`Failed to cancel scheduled task: ${cancelTaskResponse.status}`);
            }

            // Step 2: Cancel the subscription on Stripe
            const cancelSubscriptionResponse = await fetch('https://us-central1-trk-app-505a1.cloudfunctions.net/cancelSubscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: subscriptionId }),
            });

            if (!cancelSubscriptionResponse.ok) {
                throw new Error(`HTTP error! status: ${cancelSubscriptionResponse.status}`);
            }

            // Notify the user about successful cancellation
            Alert.alert('Success', 'Your subscription and any scheduled task have been canceled.');

            // Update the local state to reflect that the subscription is canceled
            setLocalIsCancelled(true);
        } catch (error) {
            console.error('Failed to cancel subscription or task:', error);
            Alert.alert('Error', 'Failed to cancel subscription or task.');
        } finally {
            setIsCanceling(false);
        }
    };

    // Confirmation pop-up before cancellation
    const confirmCancel = () => {
        Alert.alert(
            "Cancel Subscription",
            "Are you sure you want to cancel your subscription?",
            [
                { text: "No", style: "cancel" },
                { text: "Yes", onPress: cancelSubscription }
            ],
            { cancelable: true }
        );
    };

    return (
        <View style={{ marginHorizontal: 15 }}>
            <Text style={styles.title}>Account</Text>
            <View style={{ borderWidth: 1, borderRadius: 5, borderColor: '#D6D6D6', marginTop: 30, backgroundColor: '#FCF7F3' }}>
                <View style={{ flexDirection: 'row', margin: 15 }}>
                    <View style={{ flex: 0.2 }}>
                        <Image source={nagimoLogo} style={{ width: '100%', height: 50 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 0.8 }}>
                        <Text style={styles.daysLeftText}>{membershipText}</Text>
                        <Text style={styles.planAndRenewText}>Unlimited access Plan</Text>
                        <Text style={styles.planAndRenewText}>{renewalText}</Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', margin: 15 }}>
                    <View style={{ width: '50%', paddingRight: 5 }}>
                        <TouchableOpacity
                            style={[
                                styles.freezeButton,
                                isCancelled || localIsCancelled || isCanceling ? styles.disabledButton : null
                            ]}
                            onPress={() => {
                                if (isCancelled || localIsCancelled) {
                                    Alert.alert('Action not allowed', 'Your subscription is cancelled. You cannot freeze your plan.');
                                } else if (isPaused) {
                                    navigation.navigate('Freeze', { subscriptionId: subscriptionId, userId: currentUser.uid });
                                } else {
                                    Alert.alert(
                                        "Freeze Membership",
                                        "You can freeze your membership from the next billing cycle until your chosen end date. Your billing cycle will reset to the end date.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Proceed", onPress: () => navigation.navigate('Freeze', { subscriptionId: subscriptionId, userId: currentUser.uid }) }
                                        ],
                                        { cancelable: true }
                                    );
                                }
                            }}
                            disabled={isCancelled || localIsCancelled || isCanceling} // Disable the button if canceled
                        >
                            <Text style={styles.buttonText}>
                                {isPaused ? 'Manage Freeze' : 'Freeze plan'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: '50%', paddingLeft: 5 }}>
                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                isCancelled || localIsCancelled || isCanceling ? styles.disabledButton : null
                            ]}
                            onPress={confirmCancel}
                            disabled={isCancelled || localIsCancelled || isCanceling}
                        >
                            <Text style={styles.buttonText}>
                                {isCancelled || localIsCancelled ? 'Cancelled' : isCanceling ? 'Canceling...' : 'Cancel plan'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    title: { fontFamily: "DMSans-SemiBold", fontSize: 32, marginTop: 30, color: 'black' },
    daysLeftText: { fontFamily: "DMSans-SemiBold", fontSize: 16, color: 'black' },
    planAndRenewText: { fontFamily: "DMSans-Regular", fontSize: 12, color: '#686868' },
    freezeButton: { height: 32.5, borderRadius: 15, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' },
    cancelButton: { height: 32.5, borderRadius: 15, backgroundColor: '#ff6633', alignItems: 'center', justifyContent: 'center' },
    buttonText: { fontFamily: "DMSans-SemiBold", fontSize: 14, color: 'white' },
    disabledButton: { backgroundColor: '#d3d3d3' }
});

export default Account;