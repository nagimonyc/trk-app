import React, { useState, useContext, useEffect } from "react";
import { Linking, Platform, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Button, Alert, Image, FlatList, Dimensions } from "react-native";
import { AuthContext } from "../../../../Utils/AuthContext";
import TapHistory from "../../../../Components/TapHistory";
import TapsApi from "../../../../api/TapsApi";
import ClimbsApi from "../../../../api/ClimbsApi";
import CommentsApi from "../../../../api/CommentsApi";
import firestore from '@react-native-firebase/firestore';
import { firebase } from "@react-native-firebase/auth";
// import Icon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/FontAwesome'; // Make sure to import Icon
import { useFocusEffect } from '@react-navigation/native';
import SessionTapHistory from "../../../../Components/SessionTapHistory";
import moment from 'moment-timezone';
import { RefreshControl, ScrollView } from 'react-native';
import UsersApi from "../../../../api/UsersApi";
import storage from '@react-native-firebase/storage';
import SessionsApi from "../../../../api/SessionsApi";
import LineGraphComponent from "../../../../Components/LineGraphComponent";


//Climb Tile
const ClimbTile = ({climb}) => {
    // Placeholder image if no image is available or if climb status is 'Unseen'
    const placeholderImage = require('../../../../../assets/question_box.png');
    const imageSource = climb.climbImage
        ? { uri: climb.climbImage }
        : placeholderImage;

    //No Card Modal as of now!
    return (
        <TouchableOpacity style={[styles.climbTile, { width: Dimensions.get('window').width / 4 - 20, backgroundColor: 'white', borderRadius: 10 }]}> 
            <Image
                source={imageSource}
                style={styles.climbImage}
            />
        </TouchableOpacity>
    );
};


const SetterProfile = ({ navigation }) => {

    const {tapCount, currentUser } = React.useContext(AuthContext);

    const [setHistory, setSetHistory] = React.useState([]);
    const [style, setStyle] = React.useState("Crimpy");
    const [lastWeekCount, setLastWeekCount] = React.useState(0);
    const [user, setUser] = useState(null);

    const enhanceClimbDataWithImages = async (climbDataArray) => {
        const climbDataWithImages = await Promise.all(climbDataArray.map(async climb => {
            let climbImage = '';
            if (climb.images && climb.images.length > 0) {
                try {
                    climbImage = await storage().ref(climb.images[climb.images.length - 1].path).getDownloadURL();
                } catch (error) {
                    console.error("Error fetching climb image:", error);
                    // Handle the error or continue with default/climbImage as an empty string
                }
            }
            return { ...climb, climbImage };
        }));
    
        return climbDataWithImages;
    };

    const handleSetHistory = async () => {
        try {
            //To get User information, retained as is
            const { getUsersBySomeField } = UsersApi();
            let user = (await getUsersBySomeField('uid', currentUser.uid));
            if (user) {
                setUser(user.docs[0].data());
            }
            console.log('CurrentUser: ', currentUser);
            const setSnapshot = await ClimbsApi().getClimbsForSetter(currentUser.uid);
            //console.log('Climbs:', setSnapshot.docs); // Log the snapshot here
            const newSetHistory = setSnapshot.docs.map(doc => {
                return doc.exists ? { id: doc.id, ...doc.data() } : null;
            }).filter(set => set !== null && set.archived !== true);

            let propertiesCount = {}; // To store the count of each property

            newSetHistory.forEach(climb => {
                if (climb.properties && Array.isArray(climb.properties)) {
                    climb.properties.forEach(property => {
                        if (propertiesCount[property]) {
                            propertiesCount[property] += 1;
                        } else {
                            propertiesCount[property] = 1;
                        }
                    });
                }
            });
            let style = 'Crimpy'; // Default to 'Crimpy' if no other style is more frequent
            let maxCount = propertiesCount['Crimpy'] || 0; // Start with the count of 'Crimpy', if present

            for (const property in propertiesCount) {
                if (propertiesCount[property] > maxCount) {
                    maxCount = propertiesCount[property];
                    style = property;
                }
            }
            //console.log('Most Frequent Style:', style); // Log the most frequent style

            //Calculate Climbs set in the past week
            const lastWeekSetSnapshot = await ClimbsApi().getClimbsInLastWeek(currentUser.uid);
            //console.log('Climbs:', setSnapshot.docs); // Log the snapshot here
            const lastWeekSetHistory = setSnapshot.docs.map(doc => {
                return doc.exists ? { id: doc.id, ...doc.data() } : null;
            }).filter(set => set !== null && set.archived !== true);
            
            const enhancedSetHistory = await enhanceClimbDataWithImages(newSetHistory);

            setLastWeekCount(lastWeekSetHistory.length);
            setStyle(style); //Setting the style
            setSetHistory(enhancedSetHistory);
        } catch (error) {
            console.error("Error fetching sets for user:", error);
        }
    };
    const [climbImageUrl, setClimbImageUrl] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const MoreSection = () => {
        const [showProgress, setShowProgress] = useState(false);

        // Helper function to toggle the progress graph
        const toggleProgress = () => {
            setShowProgress(!showProgress);
        };

        return (
            <View style={{ marginTop: 20 }}>
                <Text style={{ paddingHorizontal: 15, color: 'black', fontSize: 16, fontWeight: '700' }}>More</Text>
                <TouchableOpacity
                    style={{
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        backgroundColor: 'white',
                        alignItems: 'center',
                        justifyContent: 'space-between', // Use space-between to align Text and Icon
                        flexDirection: 'row', // Set direction of children to row
                        marginTop: 10,
                    }}
                    onPress={toggleProgress}
                >
                    <View></View>
                    <Text style={{ color: 'black', fontWeight: '500', fontSize: 14 }}>Current Climbs</Text>
                    <Icon name={showProgress ? 'chevron-up' : 'chevron-down'} size={14} color="#525252" />
                </TouchableOpacity>
                <ScrollView style={{paddingHorizontal: 20, backgroundColor: 'white'}}>
                {showProgress && <ProgressContent />}
                </ScrollView>
            </View>
        );
    };

    //Display for the Progress Tab
    const ProgressContent = () => (
        <FlatList
            data={setHistory}
            renderItem={({ item }) => <ClimbTile climb={item}/>}
            keyExtractor={(item) => item.timestamp.toString()} // Use a unique property from the item instead of the index
            numColumns={4}
            scrollEnabled={false} // Make sure scrolling is disabled if it's not needed
            columnWrapperStyle={styles.columnWrapper}
            style={{marginBottom: 20}}
            ListEmptyComponent={() => {
                <View style={{width: Dimensions.get('window').width, display: 'flex', flexDirection: 'row', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', paddingVertical: 40}}><Text style={{color: '#8E8E90', fontWeight: 'bold', fontSize: 15}}>Keep tapping to see the graph 🧗🏼</Text></View>
            }}
        />
    );

    useFocusEffect(
        React.useCallback(() => {
            //console.log('Loading Profile...'); //Loading icon on initial loads (was confusing, and seemed like data was missing otherwise)
            setRefreshing(true);
            handleSetHistory().then(() => setRefreshing(false));
        }, [])
    );
    useEffect(() => {
        const loadImages = async () => {
            try {
                // Default image path
                let climbImageURL = 'climb photos/the_crag.png';
                if (user && user.image && user.image.length > 0) {
                    //Implement image fetch logic
                    climbImageURL = user.image[0].path;
                }
                const loadedClimbImageUrl = await loadImageUrl(climbImageURL);
                setClimbImageUrl(loadedClimbImageUrl);
            } catch (error) {
                console.error("Error loading images: ", error);
            }
        };
        loadImages();
    }, [user]);


    //To fetch the climb image of the latest climb
    const loadImageUrl = async (imagePath) => {
        try {
            const url = await storage().ref(imagePath).getDownloadURL();
            return url;
        } catch (error) {
            console.error("Error getting image URL: ", error);
            throw error;
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}>
                <SafeAreaView style={[styles.container]}>
                    {/* profile section */}
                    <View style={{ height: 115, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'white', paddingHorizontal: 15 }}>
                        {/* Left Container for photo and text */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {/* photo */}
                            <TouchableOpacity style={[styles.initialCircle]} onPress={() => { navigation.navigate('Edit_User', { user: user }) }}>
                                {climbImageUrl && (<Image source={{ uri: climbImageUrl }} style={{ height: '100%', width: '100%', borderRadius: 10 }} resizeMode="contain" />)}
                                {!climbImageUrl && (<Text style={styles.any_text}>{currentUser.email.charAt(0).toUpperCase()}</Text>)}
                                <View style={{ position: 'absolute', bottom: -5, right: -10, backgroundColor: 'white', borderRadius: 50, padding: 5, borderWidth: 0.5, borderColor: 'black' }}>
                                    <Image source={require('./../../../../../assets/editPen.png')} style={{ width: 10, height: 10 }} resizeMode="contain" />
                                </View>
                            </TouchableOpacity>
                            {/* text */}
                            <View style={{ marginLeft: 15 }}>
                                <Text style={{ color: 'black', fontSize: 18, fontWeight: '700' }}>
                                    {user && user.username ? user.username : currentUser.email.split('@')[0]}
                                </Text>
                            </View>
                        </View>

                        {/* Right Container for settings icon */}
                        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ paddingVertical: 20 }}>
                            <Image source={require('../../../../../assets/settings.png')} style={{ width: 30, height: 30 }} />
                        </TouchableOpacity>
                    </View>
                    {/* Fun Stats */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ paddingHorizontal: 15, color: 'black', fontSize: 16, fontWeight: '700' }}>Bio</Text>
                        <View style={{ width: '100%', marginTop: 10, paddingHorizontal: 15}}>
                            <Text style={{color: 'black'}}>{user && user.bio && user.bio.trim() !== ''? user.bio: "I\'m a routesetter!"}</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 20 }}>
                        <Text style={{ paddingHorizontal: 15, color: 'black', fontSize: 16, fontWeight: '700' }}>Fun Stats</Text>
                        <View style={{ width: '100%', backgroundColor: 'white', marginTop: 10 }}>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Climbs Set</Text>
                                    <Text style={{ color: 'black' }}>{setHistory.length}</Text>
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Your Style</Text>
                                    <Text style={{ color: 'black' }}>{style}</Text>
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Set this week</Text>
                                    <Text style={{ color: 'black' }}>{lastWeekCount}</Text>
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{ paddingHorizontal: 15 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Your hold color</Text>
                                    <Text style={{ color: 'black' }}>Pink</Text> 
                                </View>
                                {/* Divider */}
                                <View style={{ height: 1, backgroundColor: '#e0e0e0' }} />
                            </View>
                            <View style={{
                                paddingHorizontal: 15,
                                backgroundColor: 'white', // Ensure there's a background color
                                shadowColor: "#000",
                                shadowOffset: {
                                    width: 0,
                                    height: 2,
                                },
                                shadowOpacity: 0.25,
                                shadowRadius: 2,
                                elevation: 5, // for Android
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 7 }}>
                                    <Text style={{ color: 'black' }}>Climbers watching</Text>
                                    <Text style={{ color: 'black' }}>∞</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                    {/* More (graph) */}
                    <MoreSection />

                </SafeAreaView >
                {/* call me 🤙 */}
                <View style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    marginBottom: 25
                }}>
                    <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, marginBottom: 5 }}>More & more features coming soon ♥</Text>
                    <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, marginBottom: 5 }}>Contact me if you have feature ideas or feedback :)</Text>
                    <TouchableOpacity onPress={() => Linking.openURL('sms:+13474534258')}>
                        <Text style={{ textAlign: 'center', color: '#525252', fontSize: 12, textDecorationLine: 'underline' }}>(347) 453-4258</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView >
        </View>
    );
}
//Sessions are now passed to SessionTapHistory (displaying logic only now)
//Two session histories for active session, and older sessions.

const styles = StyleSheet.create({
    climbImage: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },
    climbTile: {
        height: 75, // Adjust the height as needed
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Placeholder background color
    },
    columnWrapper: {
        // justifyContent: 'flex-start',
        // alignSelf: 'flex-end'
        marginTop: 15,
    },
    container: {
        flex: 1,
        width: '100%',
        margin: 0,
    },
    innerContainer: {
        flex: 1,
        paddingTop: 5,
        width: '100%',
        margin: 0,
    },
    header: {
        flex: 0.75,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    any_text: {
        color: 'black',
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        paddingTop: 10,
        paddingBottom: 0,
    },
    effortRecapGraph: {
        flex: 3,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    effortRecapImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        paddingHorizontal: 20,
    },
    effortHistory: {
        flex: 4,
        padding: 0,
        color: 'black',
        width: '100%',
        margin: 0,
    },
    effortHistoryList: {
        flex: 1,
        width: '100%',
        color: 'black',
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingTop: 0,
        paddingBottom: 20,
    },
    pillButton: {
        backgroundColor: '#3498db', // or any color of your choice
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 50,  // This will give it a pill shape
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 16
    },
    greeting: {
        display: 'flex',
        paddingTop: 10,

    },
    greeting_text: {
        color: 'black',
        fontSize: 18,
        fontWeight: '700'
    },
    initialCircle: {
        backgroundColor: '#D9D9D9',
        width: 75,
        height: 75,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileTop: {
        marginLeft: 20,
        marginTop: 10,
    },
    topLine: {
        flexDirection: 'row', // Align children in a row
        alignItems: 'center', // Center children vertically
        justifyContent: 'space-between', // Changed from 'space-around' to 'space-between'
        paddingHorizontal: 10,

    },
    recapNumber: {
        color: 'black',
        fontWeight: 'bold',
    },
    settings: {
        marginRight: 15,
        alignSelf: 'center',
    },
    recapData: {
        marginTop: 10,
        alignItems: 'center',
        flexDirection: 'column',
    },
    tabButton: {
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
        paddingHorizontal: 20,
        paddingVertical: 15,
        width: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabActive: {
        borderBottomColor: '#3498db',
        color: 'black',
    },
    tabText: {
        fontSize: 15,
        color: 'lightgray',
        fontWeight: '500',
    },
    activeTabText: {
        fontSize: 15,
        color: 'black',
        fontWeight: '500',
    },
});

export default SetterProfile;