import { useState, useEffect, useRef } from "react";
import ClimbsApi from "../../api/ClimbsApi";
import TapsApi from "../../api/TapsApi";
import GymsApi from "../../api/GymsApi";
import { title } from "process";
import moment from "moment-timezone";
import { Alert } from "react-native";

function usePopularTimesData(selectedGymId, selectedClimbId, reloadFlag, selectedDate) {
    const [defaultSelected, setdefaultSelected] = useState(null);

    const [gyms, setGyms] = useState([]);
    const [climbs, setClimbs] = useState([]);
    const [taps, setTaps] = useState([]);
    const [formattedTaps, setFormattedTaps]= useState({labels: ["6a", "", "", "9a", "", 
    "", "12p", "", "", "3p", 
    "", "", "6p", "", "", 
    "9p", ""], datasets: [{data: new Array(17).fill(1)}]});
    const [loading, setLoading] = useState(false);

    //To fetch gym data for the dropdown
    useEffect(() => {
        async function fetchGymData() {
            const gymsData = await GymsApi().fetchGyms();
            const formattedGyms = gymsData.map(doc => ({ label: doc.data().Name, value: doc.id, location: doc.data().Location})).filter(gym => gym !== null && gym.label === 'Movement LIC');
            setGyms(formattedGyms);
            if (formattedGyms && formattedGyms.length > 0) {
                setdefaultSelected(formattedGyms[0].value);
            }
        }
        fetchGymData();
    }, []);


    //To fetch all climbs specific to the gym (OR ON RELOAD)
    useEffect(() => {
        if (selectedGymId) {
            setLoading(true);
            //console.log('Climbs Fetched');
            async function fetchClimbs() { 
                try {
                    const climbsData = await ClimbsApi().getClimbsBySomeField('gym', selectedGymId);
                    const formattedClimbs = climbsData.docs.map(doc => {return doc.exists ? { value: doc.id, label: doc.data().name, ...doc.data() } : null;}).filter(climb => climb !== null && (climb.archived === undefined || climb.archived === false));
                    setClimbs(formattedClimbs);
                } catch (error) {
                    //console.log("Error: ", error);
                    Alert.alert("Error", "Data could not be fetched!");
                }
            }
            fetchClimbs();
        }
    }, [selectedGymId, reloadFlag]);


    //To fetch day-specific taps, building the graph points (RELATIVE SCALE)
    useEffect(() => {
        setLoading(true);
        async function fetchTapsForClimbs() {
            let allTaps = [];
            //console.log('Reloading taps...');
            for (const climb of climbs) {
                const tapsData = await TapsApi().getTapsByClimbAndDate(climb.value, selectedDate); //Selecing data with timestamp (Firebase query makes it faster)
                //const tapsData = await getTapsBySomeField('climb', climb.value);
                const formatted = tapsData.docs.map(doc => {
                    return doc.exists ? {timestamp: doc.data().timestamp, ...doc.data() } : null;
                }).filter(tap => tap !== null && (tap.archived === undefined || tap.archived === false));
                allTaps = allTaps.concat(formatted);
            }
            setTaps(allTaps);
            // Processing for selected date
            //console.log('Filtering taps.');
            const hours = new Array(17).fill(1);
            if (allTaps.length > 0) {
                allTaps.forEach(tap => {
                    if (tap.timestamp) {
                        let dateInEST = moment(tap.timestamp.toDate()).tz('America/New_York');
                        const hour = dateInEST.hours();
                        if (hour >= 6 && hour <= 22) {
                            hours[hour - 6]++;
                        }
                    }
                });
            }
            setFormattedTaps({
                labels: ["6a", "", "", "9a", "", "", "12p", "", "", "3p", "", "", "6p", "", "", "9p", ""],
                datasets: [{ data: hours }]
            });
            //console.log('Filtering completed.');
            setLoading(false);
        }
        if (climbs && climbs.length > 0) {
            try {
                fetchTapsForClimbs();
            } catch (error) {
                //console.log("Error: ", error);
                Alert.alert("Error", "Data could not be fetched!");
            }
        } else {
            setFormattedTaps({labels: ["6a", "", "", "9a", "", "", "12p", "", "", "3p", "", "", "6p", "", "", "9p", ""], datasets: [{data: new Array(17).fill(1)}]});
            setTaps([]);
            setLoading(false);
        }
    }, [climbs, reloadFlag, selectedDate]);  //Also run when date changes
    
    return { gyms, climbs, taps, loading, formattedTaps, defaultSelected};
}

export default usePopularTimesData;
