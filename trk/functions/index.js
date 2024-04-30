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

//Stripe Functions (Server Side)
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

        // Create a new checkout session with the customer ID and no redirection
        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price: 'price_1P9Z16EQO3gNE6xrN2e4Cq4n',  // Replace with your actual price ID
                quantity: 1,
            }],
            mode: 'subscription',
            metadata: metadata,
            customer: customer.id,
            ui_mode: 'embedded',
            redirect_on_completion: 'never',
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

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            expand: ['data.default_payment_method'],
        });

        if (subscriptions.data.length === 0) {
            return res.status(404).send('No subscriptions found for this customer');
        }

        const subscription = subscriptions.data[0];
        res.send({
            status: subscription.status,
            current_period_end: subscription.current_period_end,
        });
    } catch (error) {
        console.error('Failed to retrieve subscription:', error);
        res.status(500).send('Internal Server Error');
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

