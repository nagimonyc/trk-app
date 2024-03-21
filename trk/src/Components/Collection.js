import React, { useState, useContext, useEffect } from "react";
import { SafeAreaView, View, Text, StyleSheet, Button, Alert, TouchableOpacity, TextInput, Switch, RefreshControl, ScrollView, SectionList, Dimensions, Modal, Pressable, TouchableWithoutFeedback } from "react-native";
import { AuthContext } from "../Utils/AuthContext";
import DropDownPicker from "react-native-dropdown-picker";
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import GymsApi from "../api/GymsApi";

const ClimbTile = ({ climb, onPressFunction }) => {
    // Placeholder image if no image is available or if climb status is 'Unseen'
    const placeholderImage = require('../../assets/question_box.png');
    const imageSource = { uri: climb.climbImage };

    // (climb.status !== 'Unseen')
    //     ? 
    //     : placeholderImage;
    const borderColor = climb.status === 'Video Present' ? 'green' : 'white';

    return (
        <TouchableOpacity style={[styles.climbTile, { width: Dimensions.get('window').width / 4 - 20, backgroundColor: 'white', borderRadius: 10, borderWidth: 3, borderColor: borderColor }]} onPress={() => { onPressFunction(climb, climb.status) }}>
            {/* {climb.status === 'Video Present' && //When Seen, But No Video Posted
                <Text style={{ position: 'absolute', color: '#fe8100', top: -20, right: 5, fontSize: 30, fontWeight: 'bold' }}>!</Text>} */}
            <Image
                source={imageSource}
                style={styles.climbImage}
            />
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
    const [openGymsDropdown, setOpenGymsDropdown] = useState(false);



    const [gyms, setGyms] = useState([]);
    const [selectedGymId, setSelectedGymId] = useState(null);
    useEffect(() => {
        const fetchGyms = async () => {
            try {
                const gymSnapshot = await GymsApi().fetchGyms();
                const gymOptions = gymSnapshot.map(doc => ({
                    label: doc.data().Name, // Assuming the gyms collection documents have a Name field
                    value: doc.id,
                }));
                setGyms(gymOptions);
            } catch (error) {
                console.error('Failed to fetch gyms:', error);
            }
        };

        fetchGyms();
    }, []);



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

    // Get device dimensions
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    // Calculate card width based on the device width, with a maximum limit
    const cardWidth = Math.min(screenWidth * 0.9, 350); // or any other max width you prefer
    console.log('screenWidth:', screenWidth);
    console.log('Card Width:', cardWidth);
    // Calculate card height based on TCG aspect ratio
    const cardHeight = cardWidth * (88 / 63); // TCG cards are typically 88mm x 63mm
    console.log('screenHeight:', screenHeight)
    console.log('Card Height:', cardHeight);
    // Calculate corner radius as a percentage of card height
    const cornerRadius = cardHeight * 0.0357; // Adjust percentage as needed
    console.log('Corner Radius:', cornerRadius);

    // Now use these dimensions in your component's inline styles or pass them to the StyleSheet
    const dynamicStyles = {
        card: {
            width: cardWidth,
            height: cardHeight,
            borderRadius: cornerRadius,
            // overflow: 'hidden',
            // ... other styles
        },
        cardContent: {
            marginHorizontal: cardHeight * 0.0357,
            marginVertical: cardHeight * 0.0357,
            marginImage: cardHeight * 0.0875,
        },

    }

    // Step 3: Load cached data when the component mounts
    useEffect(() => {
        const loadCachedData = async () => {
            const cachedClimbs = await AsyncStorage.getItem('climbs');
            const cachedAllClimbs = await AsyncStorage.getItem('allClimbs');
            const cachedUnseenCounts = await AsyncStorage.getItem('unseenCounts');

            if (cachedClimbs) setClimbs(JSON.parse(cachedClimbs));
            if (cachedAllClimbs) setAllClimbs(JSON.parse(cachedAllClimbs));
            if (cachedUnseenCounts) setUnseenCounts(JSON.parse(cachedUnseenCounts));

            // After loading cached data, refresh the data
            setRefreshing(true);
            handleClimbHistory().then(() => setRefreshing(false));
        };

        loadCachedData();
    }, []);

    useEffect(() => {
        setRefreshing(true);
        handleClimbHistory().then(() => setRefreshing(false));
    }, [selectedGymId]); // Reacts to changes in selectedGymId

    const handleClimbHistory = async () => {
        if (!selectedGymId) {
            // No gym selected yet, so clear the climbs data or handle accordingly
            setClimbs([]);
            setAllClimbs([]);
            setUnseenCounts([]);
            return;
        }
        try {
            const climbSnapShot = await ClimbsApi().getClimbsBySomeField('gym', selectedGymId);
            console.log("climbSnapShot is ", climbSnapShot);
            let groupedClimbs = {}; // Object to hold the grouped climbs
            let allClimbsTemp = [] //For all Climbs
            let unseenCountsTemp = {} //To count the Unseen Values

            if (!climbSnapShot.empty) {
                const climbDocs = climbSnapShot.docs.filter(obj => obj.data().color_name != undefined);
                console.log("climbDocs is ", climbDocs);

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
            await AsyncStorage.setItem('climbs', JSON.stringify(sortedGroupedClimbs));
            await AsyncStorage.setItem('allClimbs', JSON.stringify(allClimbsTemp));
            await AsyncStorage.setItem('unseenCounts', JSON.stringify(unseenCountsTemp));
        } catch (error) {
            console.error("Error fetching climbs for user:", error);
        }
    };

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
        // if (status === 'Unseen') {
        //     return
        // }
        //The Climb Here Must Have a Card
        console.log('Climb: ', climb);
        //Setting Values to Pass To the Card
        setTapIdCopy(climb.sampleTap);
        console.log(climb.sampleTap);
        setClimbCopy(climb);
        setTapObjCopy({ climb: climb.climbId });
        setCurrentBlurredFromChild('Video Present');
        setIsModalVisible(!isModalVisible); //Make it Visible
    };

    const [currentBlurredFromChild, setCurrentBlurredFromChild] = useState('');

    // Callback function to receive the data
    const handleBlurChange = (val) => {
        setCurrentBlurredFromChild('Video Present');
    };

    return (
        <SafeAreaView style={[styles.container, { paddingHorizontal: 0 }]}>
            <View style={{ backgroundColor: 'white', width: '100%', height: 55, justifyContent: 'center' }}>
                <View style={styles.inputContainer}>
                    <Image
                        source={require('../../assets/search.png')} // Replace './path-to-your-image.png' with the path to your image
                        style={styles.icon}
                        resizeMode="contain"
                    />
                    <TextInput
                        placeholder={`Try "Green V4"`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.textInput}
                        placeholderTextColor={'gray'}
                    />
                </View>
            </View>
            <View style={{ paddingHorizontal: 10 }}>
            <DropDownPicker
                open={openGymsDropdown}
                value={selectedGymId}
                items={gyms}
                setOpen={setOpenGymsDropdown}
                setValue={setSelectedGymId}
                setItems={setGyms}
                zIndex={3000}
                zIndexInverse={1000}
                containerStyle={{ height: 40, paddingTop: 5}}
                style={{ backgroundColor: '#fafafa'}}
                dropDownContainerStyle={{ backgroundColor: '#fafafa'}}
            />
            </View>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#fe8100']} />}
                style={{ marginHorizontal: 15 }}
            >
                {Object.keys(filteredClimbs).sort((a, b) => {
                    // Use the same sorting logic as before to ensure consistency
                    const gradeA = parseInt(a.slice(1), 10);
                    const gradeB = parseInt(b.slice(1), 10);
                    return gradeA - gradeB;
                }).map((grade) => ( // Use filteredClimbs here
                    <View key={grade} style={styles.gradeSection}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'flex-end' }}>
                            <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                                <Text style={[styles.gradeTitle]}>{grade}</Text>
                            </View>
                            <View style={[styles.gradeCountContainer, { paddingBottom: 1 }]}>
                                <Text style={styles.gradeCount}>
                                    {Math.max(filteredClimbs[grade].length - (unseenCounts[grade] || 0), 0)}/{filteredClimbs[grade].length}
                                </Text>
                            </View>
                        </View>
                        <ScrollView horizontal={true} contentContainerStyle={{}} scrollEnabled={false}>
                            <FlatList
                                data={filteredClimbs[grade]}
                                renderItem={({ item }) => <ClimbTile climb={item} onPressFunction={handlePressFunction} />}
                                keyExtractor={(item) => item.climbId.toString()} // Use a unique property from the item instead of the index
                                numColumns={4}
                                scrollEnabled={false} // Make sure scrolling is disabled if it's not needed
                                columnWrapperStyle={styles.columnWrapper}
                            />
                        </ScrollView>
                    </View>
                ))
                }
            </ScrollView >
            <View>
                <Modal
                    animationType="none"
                    transparent={true}
                    visible={isModalVisible}
                    onRequestClose={() => {
                        Alert.alert("Modal has been closed.");
                        setIsModalVisible(!isModalVisible);
                    }}
                >
                    <View style={styles.centeredView}>
                        <View style={[styles.modalContent, { width: cardWidth, height: cardHeight, borderRadius: cornerRadius }]}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setIsModalVisible(!isModalVisible)}
                            >
                                <Text style={styles.textStyle}>✕</Text>
                            </TouchableOpacity>
                            {/* Here, you include your modal content */}
                            {climbCopy && tapIdCopy && (
                                <TapCard
                                    climb={climbCopy}
                                    tapId={tapIdCopy}
                                    tapObj={tapObjCopy}
                                    tapTimestamp={null}
                                    blurred={(currentBlurredFromChild === 'Seen')}
                                    call={handleBlurChange}
                                    cardStyle={dynamicStyles.cardContent}
                                />
                            )}
                            {/* marginHorizontal: cardWidth * 0.0357,
            marginVertical: cardHeight * 0.0357, */}
                        </View>
                        {currentBlurredFromChild === 'Video Present' && (
                            <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-around', width: '100%' }}>
                                <TouchableOpacity style={{ paddingVertical: 15, backgroundColor: '#fe8100', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 15 }}
                                    onPress={() => { setIsModalVisible(!isModalVisible); navigation.navigate('Community', { climb: climbCopy, tapId: tapIdCopy, tapObj: tapObjCopy }); }}>
                                    <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Community Posts</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={{ paddingVertical: 15, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 50 }}
                                    onPress={() => { setIsModalVisible(!isModalVisible); navigation.navigate('New_Share', { climb: climbCopy, tapId: tapIdCopy, tapObj: tapObjCopy }); }}>
                                    <Image source={require('../../assets/uil_share.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Modal>

            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginTop: 22,
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        height: '65%',
        backgroundColor: '#EEEEF0', // Match the gray box color
        borderRadius: 10, // Match the border radius from your design
        alignItems: 'center',
        paddingHorizontal: 10,
        marginHorizontal: 15
    },
    icon: {
        width: 16, // Adjust as needed
        height: '100%', // Adjust as needed
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        fontSize: 14, // Adjust as needed
        color: '#000', // Text color
        height: '100%',
        margin: 0,
        padding: 0
        // Remove border if you previously had one
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    communityButton: {
        paddingVertical: 15,
        backgroundColor: '#fe8100',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderRadius: 15
    },
    closeButton: {
        backgroundColor: '#FF6165',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        position: 'relative',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        height: '100%',
        width: '100%',
        textAlignVertical: 'center',
        padding: 10,
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
        zIndex: 5000
    },
    modalContent: {
        backgroundColor: '#E0B33E',
        // alignItems: 'center',
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
        marginBottom: 15,
    },
    gradeTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        width: '100%',
        marginBottom: -2,
        // textAlign: 'center'

    },
    gradeCountContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#C7C7C7',
        width: '81%',
        textAlign: 'right',
        // Add padding or height if needed to ensure the border is visible
        marginBottom: 5,
        justifyContent: 'center'
    },
    gradeCount: {
        fontSize: 16,
        color: 'gray',
        fontWeight: '600',
        textAlign: 'right',
    },
    climbTile: {
        height: 75, // Adjust the height as needed
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Placeholder background color
        // borderRadius: 10,
        // borderColor: 'blue'
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
        marginTop: 15,
    },
    searchInput: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#EEEEF0',
        borderRadius: 10,
        width: '100%',
        fontSize: 16,
        fontWeight: '400',
        color: 'black',
    },
    // ... add other styles that you might need
});

export default Collection;


// <View style={styles.modalContainer}>
//     <View style={styles.modalContent}>
//         <TouchableOpacity
//             style={styles.closeButton}
//             onPress={() => setIsModalVisible(!isModalVisible)}
//         >
//             <Text style={styles.textStyle}>✕</Text>
//         </TouchableOpacity>
//         {/* Modal content goes here */}
//         <TapCard climb={climbCopy} tapId={tapIdCopy} tapObj={tapObjCopy} tapTimestamp={null} blurred={(currentBlurredFromChild === 'Seen')} call={handleBlurChange} />
//     </View>
//     {(currentBlurredFromChild === 'Video Present') && (
//         <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 20, marginTop: 20 }}>
//             <TouchableOpacity style={{ paddingVertical: 15, backgroundColor: '#fe8100', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 15 }}
//                 onPress={() => { navigation.navigate('Community', { climb: climbCopy, tapId: tapIdCopy, tapObj: tapObjCopy }) }}>
//                 <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>Community Posts</Text>
//             </TouchableOpacity>

//             <TouchableOpacity style={{ paddingVertical: 15, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 50 }}
//                 onPress={() => { navigation.navigate('New_Share', { climb: climbCopy, tapId: tapIdCopy, tapObj: tapObjCopy }) }}>
//                 <Image source={require('../../assets/uil_share.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
//             </TouchableOpacity>
//         </View>)}
// </View>