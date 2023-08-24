import { firebase } from "@react-native-firebase/firestore";
import React from "react";
import { useState, useEffect } from "react";

function ClimbsApi() {
    const [climbs, setClimbs] = useState([]);
    const [loading, setLoading] = useState(false);

    const ref = firebase.firestore().collection("climbs");

    // Realtime subscription
    useEffect(() => {
        setLoading(true);
        return ref.onSnapshot((querySnapshot) => {
            const climbsList = [];
            if (querySnapshot) {
                querySnapshot.forEach((doc) => {
                    const { name, grade, location, image } = doc.data();
                    climbsList.push({
                        id: doc.id,
                        name,
                        grade,
                        location,
                        image,
                    });
                });
            }
            setClimbs(climbsList);
            setLoading(false);
        });
    }, []);

    function addClimb(climb) {
        return ref.add(climb);
    }

    function getClimb(id) {
        return ref.doc(id).get();
    }

    return {
        climbs,
        loading,
        addClimb,
        getClimb,
    };
}

export default ClimbsApi;