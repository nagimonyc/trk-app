/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { CloudTasksClient } = require('@google-cloud/tasks');
const client = new CloudTasksClient();
admin.initializeApp();
admin.firestore().settings({ ignoreUndefinedProperties: true });
const stripe = require('stripe')(functions.config().stripe.secret);

exports.incrementUserTapCounter = functions.firestore
    .document('taps/{tapId}')
    .onCreate(async (snap, context) => {
        // Get the 'user' field from the newly added tap document
        const userId = snap.data().user;

        // Reference to the user's document in the 'users' collection
        const userRef = admin.firestore().collection('users').doc(userId);

        // Use a transaction to ensure atomicity
        return admin.firestore().runTransaction(async transaction => {
            const userSnap = await transaction.get(userRef);

            // If user document exists and has a 'tapCount' field, increment it
            if (userSnap.exists) {
                const currentCount = userSnap.data().taps;
                transaction.update(userRef, { taps: currentCount + 1 });
            }
        });
    });



exports.decrementUserTapCounter = functions.firestore
    .document('taps/{tapId}')
    .onDelete(async (snap, context) => {
        // Get the 'user' field from the deleted tap document
        const userId = snap.data().user;

        // Reference to the user's document in the 'users' collection
        const userRef = admin.firestore().collection('users').doc(userId);

        // Use a transaction to ensure atomicity
        return admin.firestore().runTransaction(async transaction => {
            const userSnap = await transaction.get(userRef);

            // If user document exists and has a 'tapCount' field, decrement it
            if (userSnap.exists) {
                const currentCount = userSnap.data().taps;
                // Ensure the tap count never goes below zero
                const newCount = Math.max(0, currentCount - 1);
                transaction.update(userRef, { taps: newCount });
            }
        });
    });

//New function to send FMC notifications to the user's last accessed device
exports.sessionNotificationFunction = functions.https.onRequest(async (req, res) => {
    const tapId = req.body.tapId;
    try {
        const tapRef = admin.firestore().collection('taps').doc(tapId);
        const tapDoc = await tapRef.get();

        if (!tapDoc.exists) {
            return res.status(404).send('Tap not found');
        }

        const tapData = tapDoc.data();
        if (tapData.archived === undefined || tapData.archived === false) {
            // Retrieve user's FCM token
            const userRef = admin.firestore().collection('users').doc(tapData.user);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                return res.status(404).send('User not found');
            }
            const userData = userDoc.data();
            if (userData.fcmToken) {
                // Send a notification
                await sendNotificationToUser(userData.fcmToken, tapId, tapData.user);
                res.send(`Notification sent for tapId: ${tapId}`);
            } else {
                res.status(500).send('FCM token not found for user');
            }
        } else {
            res.send(`No notification sent for archived tapId: ${tapId}`);
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing request');
    }
});


exports.notifySetterOnVideoUpload = functions.firestore
    .document('taps/{tapId}')
    .onUpdate(async (change, context) => {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        console.log('DOING IT');
        // Check if the 'video' field was added or changed
        if (afterData.videos && beforeData.videos !== afterData.videos) {
            // Proceed to notify the climb's setter
            // First, get the climb associated with this tap
            console.log('New video uploaded for climb:', afterData.climb)
            const climbRef = admin.firestore().collection('climbs').doc(afterData.climb);
            console.log('Climb ref:', climbRef);
            const climbSnap = await climbRef.get();

            if (!climbSnap.exists) {
                console.log('Climb does not exist');
                return null;
            }

            const climbData = climbSnap.data();
            // Assuming the climb data has a 'setter' field with the user ID
            const setterId = climbData.setter;
            console.log('Setter ID:', setterId);


            // Then, get the setter's FCM token
            const setterRef = admin.firestore().collection('users').doc(setterId);
            const setterSnap = await setterRef.get();

            const climberRef = admin.firestore().collection('users').doc(afterData.user);
            const climberSnap = await climberRef.get();

            if (!climberSnap.exists) {
                console.log('Climber not found');
                return null;
            }

            const climberData = climberSnap.data();

            if (!setterSnap.exists || !setterSnap.data().fcmToken) {
                console.log('Setter not found or no FCM token available');
                return null;
            }

            const fcmToken = setterSnap.data().fcmToken;

            const notification = {
                userId: setterId,
                title: `Check out ${climbData.name} ${climbData.grade}`,
                body: `New beta video uploaded by`,
                username: climberData.username,
                climbId: afterData.climb,
                seen: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                image: climbData.images[climbData.images.length - 1].path,
                video: climbData.videos[climbData.videos.length - 1],
            };

            await admin.firestore().collection('notifications').add(notification);

            // Send notification to the setter
            const message = {
                token: fcmToken,
                notification: {
                    title: 'New Video Upload',
                    body: 'A new video has been uploaded for your climb.',
                },
                // You can include additional data to navigate the user to the specific climb or tap in your app
                data: {
                    climbId: afterData.climb,
                    tapId: context.params.tapId,
                },
            };

            try {
                await admin.messaging().send(message);
                console.log('Notification sent successfully');
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        } else {
            console.log('No new video or video unchanged');
        }
    });

// GCP Job (Queued), to call the notification function after 6 hours (when a session is started ONLY), on deletion of the starting tap of the session, we shift to the next most recent tap (scheduled for the same time as original with difference)
exports.scheduleFunction = functions.https.onCall(async (data, context) => {
    //console.log('Function called.....');
    const projectId = 'trk-app-505a1';
    const queue = 'sessionNotifications';
    const location = 'us-central1'; // e.g., 'us-central1'
    const url = 'https://us-central1-trk-app-505a1.cloudfunctions.net/sessionNotificationFunction';
    const payload = { tapId: data.tapId };
    // Construct the fully qualified queue name.
    const parent = client.queuePath(projectId, location, queue);

    // Convert payload to base64 encoded string.
    const convertedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');

    const expiryTime = data.expiryTime ? new Date(data.expiryTime) : null;
    const convertedDate = new Date(expiryTime);
    const currentDate = new Date();
    const date_diff_in_seconds = (convertedDate - currentDate) / 1000;
    //console.log('Time diff: ', date_diff_in_seconds);
    if (date_diff_in_seconds > 0) {
        const task = {
            httpRequest: {
                httpMethod: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: convertedPayload,
            },
            scheduleTime: {
                seconds: expiryTime !== null
                    ? Math.floor(Date.now() / 1000) + date_diff_in_seconds  // Convert Date object to seconds
                    : Math.floor(Date.now() / 1000) + 6 * 60 * 60  // 6 hours from now in seconds
            },
        };
        await client.createTask({ parent, task });
        //console.log(`Task created: ${task.name}`);
    } else {
        //console.log(`Task skipped`);
    }

});

//Stripe Functions (Server Side)
exports.createPaymentSheet = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    } else if (req.method !== "POST") {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        // Assuming the request body includes amount and optionally currency
        const { amount, currency = 'usd', email = 'nagimo.nyc@nagimo.org' } = req.body;

        const customer = await stripe.customers.create({ email: email });
        const ephemeralKey = await stripe.ephemeralKeys.create(
            { customer: customer.id },
            { apiVersion: '2023-10-16' }
        );
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            customer: customer.id,
            automatic_payment_methods: { enabled: true },
        });

        res.json({
            paymentIntent: paymentIntent.client_secret,
            ephemeralKey: ephemeralKey.secret,
            customer: customer.id,
            publishableKey: 'pk_live_51OaSWnEQO3gNE6xrKK1pHZXzWux71xpxXpA3nQNtNK30Vz43sCQeJzO7QuMk708tOGvGstsLbBS1jtMCIWZ14UCR00j1Bt80cF' // Live Key
        });
    } catch (error) {
        console.error("Error creating payment sheet:", error);
        res.status(500).send("Internal Server Error");
    }
});

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    } else if (req.method !== "POST") {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const { email, metadata } = req.body;
    const userId = metadata.userId; // Assuming userId is passed in metadata for linking

    try {
        let customer;
        // Check if user already has a Stripe customer ID
        const userRef = admin.firestore().collection('users').doc(userId);
        const doc = await userRef.get();

        if (doc.exists && doc.data().stripeCustomerId) {
            // Use existing customer ID
            customer = { id: doc.data().stripeCustomerId };
        } else {
            // Create a new customer in Stripe
            customer = await stripe.customers.create({ email });
            // Store the customer ID in Firestore
            await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
        }

        // Create a new checkout session with the customer ID and promotion code support
        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price: 'price_1PuFeREQO3gNE6xru74cWpgX',  // Replace with your actual price ID
                quantity: 1,
            }],
            phone_number_collection: {
                enabled: true,
            },
            mode: 'subscription',
            metadata: metadata,
            customer: customer.id,
            ui_mode: 'embedded',
            redirect_on_completion: 'never',
            allow_promotion_codes: true, // Enable promotion codes
        });

        // Return session details to the client
        res.json({ sessionId: session.id, clientSecret: session.client_secret, stripeCustomerId: customer.id });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).send("Internal Server Error");
    }
});

exports.getMembershipDetails = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const { customerId } = req.body;
        if (!customerId) {
            return res.status(400).send('No customer ID provided');
        }

        console.log(`Fetching subscription schedules for customer ID: ${customerId}`);

        // Fetch planned (not_started) subscriptions first
        let schedules;
        try {
            schedules = await stripe.subscriptionSchedules.list({
                customer: customerId,
            });
        } catch (err) {
            console.error('Error fetching subscription schedules:', err);
            return res.status(500).send('Error fetching subscription schedules');
        }

        if (schedules && schedules.data.length > 0) {
            console.log(`Found ${schedules.data.length} subscription schedules for customer ID: ${customerId}`);
            const upcomingSchedule = schedules.data.find(schedule => schedule.status === 'not_started');

            if (upcomingSchedule) {
                // Extract the details of the planned subscription phase
                const scheduledPhase = upcomingSchedule.phases[0];
                console.log('Scheduled Subscription Phase:', JSON.stringify(scheduledPhase, null, 2));

                const membershipType = scheduledPhase.metadata && scheduledPhase.metadata.membership_type
                    ? scheduledPhase.metadata.membership_type
                    : 'scheduled';  // Default to 'scheduled' if no metadata is found

                console.log('Found upcoming schedule with ID:', upcomingSchedule.id);
                return res.send({
                    subscriptionId: upcomingSchedule.id,
                    status: membershipType,
                    current_period_start: scheduledPhase.start_date,
                    current_period_end: scheduledPhase.end_date,
                    subscription: null
                });
            }
        }

        console.log(`No upcoming subscription schedules for customer ID: ${customerId}`);

        // If no planned subscription, check active or canceled subscriptions
        let subscriptions;
        try {
            subscriptions = await stripe.subscriptions.list({
                customer: customerId,
                status: 'all', // Includes canceled subscriptions
                expand: ['data.default_payment_method', 'data.pending_update'],
            });
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
            return res.status(500).send('Error fetching subscriptions');
        }

        let activeSubscription = null;
        let canceledSubscription = null;

        if (subscriptions.data.length > 0) {
            // Find an active subscription
            activeSubscription = subscriptions.data.find(sub => sub.status === 'active' || sub.status === 'trialing');
            canceledSubscription = subscriptions.data.find(sub => sub.status === 'canceled');
        }

        if (activeSubscription) {
            console.log('Found active subscription with ID:', activeSubscription.id);

            // Check if the subscription is paused
            const isPaused = activeSubscription.pause_collection ? true : false;
            const resumeDate = activeSubscription.pause_collection ? activeSubscription.pause_collection.resumes_at : null;

            return res.send({
                subscriptionId: activeSubscription.id,
                status: activeSubscription.status,
                current_period_start: activeSubscription.current_period_start,
                current_period_end: activeSubscription.current_period_end,
                isPaused: isPaused,
                resumeDate: resumeDate
            });
        }

        if (canceledSubscription) {
            console.log('Found canceled subscription with ID:', canceledSubscription.id);
            return res.send({
                subscriptionId: canceledSubscription.id,
                status: canceledSubscription.status,
                current_period_start: canceledSubscription.current_period_start,
                current_period_end: canceledSubscription.current_period_end,
            });
        }

        console.log('No active, canceled, or scheduled subscriptions found for this customer.');
        return res.status(404).send('No active, canceled, or scheduled subscriptions found for this customer.');

    } catch (error) {
        console.error('Failed to retrieve subscription or schedule:', error);
        res.status(500).send('Internal Server Error');
    }
});

exports.pauseSubscription = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { subscriptionId, endDate } = req.body;

    if (!subscriptionId || !endDate) {
        return res.status(400).send('Subscription ID and End Date are required');
    }

    console.log('END DATE IS:', endDate);

    try {
        // Manually parse the date as UTC by splitting the date string and constructing the UTC date.
        const [month, day, year] = endDate.split(' ');

        const endDateObj = new Date(Date.UTC(
            parseInt(year),                      // Year (e.g., 2024)
            new Date(`${month} 1, ${year}`).getMonth(),  // Convert month name to number (0-based)
            parseInt(day)                        // Day of the month
        ));

        // Add one day to the parsed end date
        endDateObj.setUTCDate(endDateObj.getUTCDate() + 1);

        // Validate if the date is correctly parsed
        if (isNaN(endDateObj.getTime())) {
            return res.status(400).send({
                success: false,
                error: 'Invalid date format for endDate. Please provide a valid date in a recognizable format.'
            });
        }

        const endDateTimestamp = Math.floor(endDateObj.getTime() / 1000); // Convert to Unix timestamp

        // Check if endDate is in the past
        if (endDateTimestamp <= Math.floor(Date.now() / 1000)) {
            return res.status(400).send({
                success: false,
                error: 'End date must be in the future.'
            });
        }

        console.log('END DATE TIMESTAMP IS:', endDateTimestamp);

        // Pause subscription until the provided endDate
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            pause_collection: {
                behavior: 'void', // Options: 'void', 'mark_uncollectible', or 'keep_as_draft'
                resumes_at: endDateTimestamp
            }
        });

        return res.status(200).send({
            success: true,
            message: `Subscription paused until ${endDate}`,
            subscription
        });
    } catch (error) {
        console.error('Error pausing subscription:', error);
        return res.status(500).send({
            success: false,
            error: 'Failed to pause subscription',
            details: error.message // Include detailed error for easier debugging
        });
    }
});

exports.cancelSubscription = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { subscriptionId } = req.body;

    if (!subscriptionId) {
        return res.status(400).send('No subscription ID provided');
    }

    try {
        // Cancel the subscription on Stripe
        const subscription = await stripe.subscriptions.cancel(subscriptionId);

        // Return the canceled subscription details
        return res.status(200).send({
            success: true,
            message: "Subscription canceled successfully",
            subscription
        });
    } catch (error) {
        console.error('Error canceling subscription:', error);
        return res.status(500).send({
            success: false,
            error: 'Failed to cancel subscription'
        });
    }
});


exports.scheduleResumeTask = functions.https.onRequest(async (req, res) => {
    const { subscriptionId, userId, resumeDate } = req.body;

    // Ensure required parameters are present
    if (!subscriptionId || !userId || !resumeDate) {
        return res.status(400).send('Missing required parameters');
    }

    const projectId = 'trk-app-505a1';
    const queue = 'resumeQueue';
    const location = 'us-central1'; // Update if different
    const url = 'https://us-central1-trk-app-505a1.cloudfunctions.net/resumeSubscription';

    const parent = client.queuePath(projectId, location, queue);

    const targetResumeTime = new Date(resumeDate);
    const currentTime = new Date();
    const timeDiffInHours = (targetResumeTime - currentTime) / (1000 * 60 * 60); // Calculate time difference in hours

    // If the task is less than or equal to 720 hours (30 days) in the future
    if (timeDiffInHours <= 720) {
        try {
            await scheduleTask(parent, url, subscriptionId, targetResumeTime, userId);
            return res.status(200).send({
                success: true,
                message: `Task scheduled for ${resumeDate}`
            });
        } catch (error) {
            console.error('Error scheduling task:', error);
            return res.status(500).send({ success: false, error: 'Failed to schedule task' });
        }
    } else {
        // If the task is more than 30 days in the future, break it into 30-day chunks
        let intermediateDate = new Date(currentTime.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        try {
            await scheduleIntermediateTask(parent, url, subscriptionId, intermediateDate, targetResumeTime, userId);
            return res.status(200).send({
                success: true,
                message: `Intermediate task scheduled to break into chunks until ${resumeDate}`
            });
        } catch (error) {
            console.error('Error scheduling intermediate task:', error);
            return res.status(500).send({ success: false, error: 'Failed to schedule intermediate task' });
        }
    }
});

// Helper function to schedule the task
async function scheduleTask(parent, url, subscriptionId, targetDate, userId) {
    const payload = { subscriptionId };
    const convertedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const resumeTime = Math.floor(targetDate.getTime() / 1000);

    const task = {
        httpRequest: {
            httpMethod: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json',
            },
            body: convertedPayload,
        },
        scheduleTime: { seconds: resumeTime },
    };

    const [response] = await client.createTask({ parent, task });
    const taskId = response.name.split('/').pop();

    // Store the task ID in Firestore under the user's document
    await admin.firestore().collection('users').doc(userId).update({ taskId });
}

// Helper function to schedule an intermediate task
async function scheduleIntermediateTask(parent, url, subscriptionId, intermediateDate, finalResumeDate, userId) {
    const intermediatePayload = {
        subscriptionId,
        nextResumeDate: finalResumeDate // Carry forward the final resume date
    };

    const convertedPayload = Buffer.from(JSON.stringify(intermediatePayload)).toString('base64');
    const intermediateTime = Math.floor(intermediateDate.getTime() / 1000);

    const task = {
        httpRequest: {
            httpMethod: 'POST',
            url: 'https://us-central1-trk-app-505a1.cloudfunctions.net/scheduleResumeTask', // Recursive call to create next task
            headers: {
                'Content-Type': 'application/json',
            },
            body: convertedPayload,
        },
        scheduleTime: { seconds: intermediateTime },
    };

    const [response] = await client.createTask({ parent, task });
    const taskId = response.name.split('/').pop();

    // Store the task ID in Firestore
    await admin.firestore().collection('users').doc(userId).update({ taskId });
}

exports.resumeSubscription = functions.https.onRequest(async (req, res) => {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
        return res.status(400).send('No subscription ID provided');
    }

    try {
        // Resume subscription by clearing the pause collection
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            pause_collection: null, // This resumes the subscription
        });

        res.status(200).send({
            success: true,
            message: 'Subscription resumed successfully',
            subscription,
        });
    } catch (error) {
        console.error('Error resuming subscription:', error);
        res.status(500).send({
            success: false,
            error: 'Failed to resume subscription',
        });
    }
});


exports.cancelScheduledResumeTask = functions.https.onRequest(async (req, res) => {
    const { userId, subscriptionId } = req.body;

    if (!userId || !subscriptionId) {
        return res.status(400).send('User ID and Subscription ID are required');
    }

    try {
        // Retrieve Task ID from Firestore
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const taskId = userDoc.data().taskId;

        // Step 1: Cancel the task in Google Cloud Tasks
        if (taskId) {
            const projectId = 'trk-app-505a1';
            const queue = 'resumeQueue';
            const location = 'us-central1';

            const taskPath = client.taskPath(projectId, location, queue, taskId);
            await client.deleteTask({ name: taskPath }); // Cancel the task

            // Remove Task ID from Firestore after deletion
            await admin.firestore().collection('users').doc(userId).update({
                taskId: admin.firestore.FieldValue.delete()
            });

            console.log('Task canceled and Task ID removed from Firestore.');
        } else {
            console.log('No task found to cancel.');
        }

        // Step 2: Update Stripe to remove the pause collection
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            pause_collection: null, // This resumes the subscription by removing the pause
        });

        console.log('Pause collection removed from subscription in Stripe.');

        // Step 3: Update Firestore to reflect that the membership is no longer paused
        await admin.firestore().collection('users').doc(userId).update({
            isPaused: false,
            resumeDate: null
        });

        console.log('User subscription updated in Firestore.');

        res.status(200).send({
            success: true,
            message: 'Scheduled task canceled, Stripe subscription updated, and Firestore data cleared.'
        });
    } catch (error) {
        console.error('Error canceling task or updating subscription:', error);
        res.status(500).send({
            success: false,
            error: 'Failed to cancel scheduled task or update subscription.'
        });
    }
});

//Notification styling and packaging
async function sendNotificationToUser(fcmToken, tapId, userId) {
    const message = {
        token: fcmToken,
        notification: {
            title: 'Check out your Session',
            body: `View your recent session in Profile!`,
        },
        data: {
            tapId: tapId,
            targetScreen: 'ProfileTab',
            userId: userId,
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: "nagimo",
            },
        },
        apns: {
            headers: {
                'apns-priority': '10', // High priority
            },
            payload: {
                aps: {
                    sound: 'default',
                },
            },
        },
    };

    await admin.messaging().send(message);
}
