import React, { useState, useContext, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, Button, Alert, TouchableOpacity, TextInput, Switch, RefreshControl, ScrollView, SectionList, Dimensions } from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
import SignOut from "./SignOut";
import { useFocusEffect } from "@react-navigation/native";
import ClimbsApi from "../api/ClimbsApi";
import TapsApi from "../api/TapsApi";
import { FlatList, Image } from "react-native";
import storage from '@react-native-firebase/storage';
import TapCard from "./TapCard";
import { useNavigation } from '@react-navigation/native';

const ClimbTile = ({ climb, onPressFunction }) => {
    // Placeholder image if no image is available or if climb status is 'Unseen'
    const placeholderImage = require('../../assets/question_box.png');
    const imageSource = (climb.status !== 'Unseen')
        ? { uri: climb.climbImage }
        : placeholderImage;

    return (
        <TouchableOpacity style={[styles.climbTile, { width: Dimensions.get('window').width / 4 - 20, backgroundColor: 'white', borderRadius: 10 }]} onPress={() => { onPressFunction(climb, climb.status) }}>
            <Image
                source={imageSource}
                style={styles.climbImage}
            />
            {climb.status === 'Seen' && //When Seen, But No Video Posted
                <Text style={{ position: 'absolute', color: '#fe8100', top: -20, right: 5, fontSize: 30, fontWeight: 'bold' }}>!</Text>}
        </TouchableOpacity>
    );
};



const Collection = () => {
    const { currentUser, role } = useContext(AuthContext);

    const [climbs, setClimbs] = useState([]); //Map for Grade: All climbs in that grade
    const [unseenCounts, setUnseenCounts] = useState([]); //Same length as climbs above (stores the number of Unseen)
    const [allClimbs, setAllClimbs] = useState([]); //List of Climb Objects for Searching
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredClimbs, setFilteredClimbs] = useState({});

    const navigation = useNavigation();

    const [refreshing, setRefreshing] = useState(false); // Add this line for pull-to-refresh

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        handleClimbHistory().then(() => setRefreshing(false)); // Reset refreshing to false when data is fetched
    }, []);

    const [isModalVisible, setIsModalVisible] = useState(false); //To toggle modal state, only closes when the X button is clicked

    const [tapIdCopy, setTapIdCopy] = useState(null);
    const [climbCopy, setClimbCopy] = useState(null);
    const [tapObjCopy, setTapObjCopy] = useState(null);

    const handleClimbHistory = async () => {
        try {
            const climbSnapShot = await ClimbsApi().getClimbsBySomeField('gym', 'TDrC1lRRjbMuMI06pONY');
            let groupedClimbs = {}; // Object to hold the grouped climbs
            let allClimbsTemp = [] //For all Climbs
            let unseenCountsTemp = {} //To count the Unseen Values

            if (!climbSnapShot.empty) {
                const climbDocs = climbSnapShot.docs.filter(obj => obj.data().color_name != undefined);

                for (let i = 0; i < climbDocs.length; i++) {
                    const climbData = climbDocs[i].data();
                    const tapSnapShot = await TapsApi().getClimbsByIdUser(climbDocs[i].id, currentUser.uid);
                    let status = 'Unseen';
                    let sampleTap = null;

                    if (!tapSnapShot.empty) {
                        status = 'Seen';
                        const tapDocs = tapSnapShot.docs;
                        sampleTap = tapDocs[0].id;
                        if (tapDocs.some(tapDoc => tapDoc.data().videos && tapDoc.data().videos.length > 0)) {
                            status = 'Video Present';
                        }
                    }
                    let climbImage = '';
                    if (climbData.images && climbData.images.length > 0) {
                        //console.log(String(climbData.images[climbData.images.length-1].path));
                        climbImage = await storage().ref(climbData.images[climbData.images.length - 1].path).getDownloadURL();
                    }
                    // Add status and sampleTap to the climb data
                    const extendedClimbData = { ...climbData, status, sampleTap, climbImage, climbId: climbDocs[i].id };

                    // Group the climb data by grade
                    const gradeGroup = extendedClimbData.grade;
                    if (!groupedClimbs[gradeGroup]) {
                        groupedClimbs[gradeGroup] = [];
                        unseenCountsTemp[gradeGroup] = 0;
                    }
                    groupedClimbs[gradeGroup].push(extendedClimbData);
                    allClimbsTemp.push(extendedClimbData);
                    if (extendedClimbData.status === 'Unseen') {
                        unseenCountsTemp[gradeGroup] += 1;
                    }
                }
            }
            let sortedGroupedClimbs = {};
            const sortedGrades = Object.keys(groupedClimbs).sort((a, b) => {
                // Extract the numerical part of the grade by removing the first character and parse it as an integer
                const gradeA = parseInt(a.slice(1), 10);
                const gradeB = parseInt(b.slice(1), 10);
                return gradeA - gradeB;
            });

            sortedGrades.forEach(grade => {
                sortedGroupedClimbs[grade] = groupedClimbs[grade];
            });

            // Set the sorted climbs in the state
            setClimbs(sortedGroupedClimbs);

            // Now you have an object with grades as keys and arrays of climb data as values
            // If you want to sort the climbs within each grade, you can do so here

            // Set the grouped climbs in the state
            setAllClimbs(allClimbsTemp);
            setUnseenCounts(unseenCountsTemp);
        } catch (error) {
            console.error("Error fetching climbs for user:", error);
        }
    };

    useEffect(() => {
        setRefreshing(true);
        handleClimbHistory().then(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredClimbs(climbs); // If search query is empty, show all climbs
        } else {
            // Split the search query into individual terms
            const searchTerms = searchQuery.toLowerCase().split(' ');

            // Filter the climbs that match all of the search terms
            const filtered = allClimbs.filter(climb =>
                searchTerms.every(term =>
                    climb.name.toLowerCase().includes(term) ||
                    climb.color_name.toLowerCase().includes(term) ||
                    climb.grade.toLowerCase().includes(term)
                )
            );

            // Regroup the filtered climbs by grade
            const groupedByGrade = filtered.reduce((acc, climb) => {
                const { grade } = climb;
                if (!acc[grade]) {
                    acc[grade] = [];
                }
                acc[grade].push(climb);
                return acc;
            }, {});

            // Sort the grouped climbs by grade
            let sortedFilteredClimbs = {};
            const sortedFilteredGrades = Object.keys(groupedByGrade).sort((a, b) => {
                const gradeA = parseInt(a.slice(1), 10);
                const gradeB = parseInt(b.slice(1), 10);
                return gradeA - gradeB;
            });

            sortedFilteredGrades.forEach(grade => {
                sortedFilteredClimbs[grade] = groupedByGrade[grade];
            });

            setFilteredClimbs(sortedFilteredClimbs); // Update the filtered climbs
        }
    }, [searchQuery, allClimbs]);

    const sections = Object.keys(climbs).sort().map(grade => ({
        title: grade,
        data: climbs[grade],
        count: climbs[grade].length - unseenCounts[grade],
        totalCount: climbs[grade].length
    }));


    const handlePressFunction = (climb, status) => {
        if (status === 'Unseen') {
            return
        }
        //The Climb Here Must Have a Card
        console.log('Climb: ', climb);
        //Setting Values to Pass To the Card
        setTapIdCopy(climb.sampleTap);
        setClimbCopy(climb);
        setTapObjCopy({ climb: climb.climbId });
        setCurrentBlurredFromChild(climb.status);
        setIsModalVisible(!isModalVisible); //Make it Visible
    };

    const [currentBlurredFromChild, setCurrentBlurredFromChild] = useState('');

    // Callback function to receive the data
    const handleBlurChange = (val) => {
        setCurrentBlurredFromChild('Video Present');
    };

    return (
        <SafeAreaView style={styles.container}>
            <TextInput
                placeholder="Search climbs..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor={'gray'}
            />
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#fe8100']} />}
            >
                {Object.keys(filteredClimbs).sort((a, b) => {
                    // Use the same sorting logic as before to ensure consistency
                    const gradeA = parseInt(a.slice(1), 10);
                    const gradeB = parseInt(b.slice(1), 10);
                    return gradeA - gradeB;
                }).map((grade) => ( // Use filteredClimbs here
                    <View key={grade} style={styles.gradeSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                            <Text style={styles.gradeTitle}>{grade}</Text>
                            <Text style={styles.gradeCount}>
                                {filteredClimbs[grade].length - (unseenCounts[grade] || 0)}/{filteredClimbs[grade].length}
                            </Text>
                        </View>
                        <ScrollView horizontal={true} contentContainerStyle={{ flex: 1 }}>
                            <FlatList
                                data={filteredClimbs[grade]}
                                renderItem={({ item, index }) => <ClimbTile climb={item} onPressFunction={handlePressFunction} />}
                                keyExtractor={(item, index) => index.toString()}
                                numColumns={4}
                                columnWrapperStyle={styles.columnWrapper}
                            />
                        </ScrollView>
                    </View>
                ))}
            </ScrollView>
            {isModalVisible && (
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsModalVisible(!isModalVisible)}
                        >
                            <Text style={styles.textStyle}>✕</Text>
                        </TouchableOpacity>
                        {/* Modal content goes here */}
                        <TapCard climb={climbCopy} tapId={tapIdCopy} tapObj={tapObjCopy} tapTimestamp={null} blurred={(currentBlurredFromChild === 'Seen')} call={handleBlurChange}/>
                    </View>
                    {(currentBlurredFromChild === 'Video Present') && (
                        <View style={{flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 20, marginTop: 20}}>
                            <TouchableOpacity style={{paddingVertical: 15, backgroundColor:'#fe8100', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 15}}
                            onPress={() => {navigation.navigate('Community', {climb: climbCopy, tapId: tapIdCopy, tapObj: tapObjCopy})}}>
                            <Text style={{color: 'white', fontSize: 15, fontWeight: '600'}}>Community Posts</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={{paddingVertical: 15, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 50}}
                            onPress={() => {navigation.navigate('New_Share', {climb: climbCopy, tapId: tapIdCopy, tapObj: tapObjCopy})}}>
                            <Image source={require('../../assets/uil_share.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                            </TouchableOpacity>
                        </View>)}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    closeButton: {
        backgroundColor: '#FF6165',
        width: 30,
        height: 30,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: -5,
        right: -5,
        zIndex: 2000,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        height: '100%',
        width: '100%',
        textAlignVertical: 'top',
        paddingTop: 3,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    modalContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        paddingTop: 20, // Adjust as needed
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 0,
        alignItems: 'center',
        width: '90%', // Adjust as needed
        height: '85%', // Adjust as needed, less than 100% to not cover full screen
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    scrollViewContent: {
        paddingBottom: 10, // Add padding at the bottom for scrollable content
        marginTop: 20,
    },
    gradeSection: {
        marginBottom: 20,
    },
    gradeTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
        width: '20%'
    },
    gradeCount: {
        fontSize: 16,
        color: 'gray',
        marginBottom: 10,
        width: '80%',
        textAlign: 'right',
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        fontWeight: '600',
    },
    climbTile: {
        height: 75, // Adjust the height as needed
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Placeholder background color
    },
    selectedClimb: {
        borderColor: '#007BFF', // Color for the selected tile
        borderWidth: 2,
    },
    climbImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    columnWrapper: {
        justifyContent: 'flex-start',
    },
    searchInput: {
        marginVertical: 10,
        padding: 8,
        backgroundColor: '#D9D9D9',
        borderRadius: 10,
        width: '100%'
    },
    // ... add other styles that you might need
});

export default Collection;