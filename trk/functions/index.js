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
admin.initializeApp();

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
    