import React, { useState, useEffect } from 'react';
import { TextInput, View, Text, TouchableOpacity } from 'react-native';
import UsersApi from '../../../../api/UsersApi';
import { ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import { Image } from 'react-native';
import storage from '@react-native-firebase/storage';
import { ActivityIndicator } from 'react-native-paper'
import { useContext } from 'react';
import { AuthContext } from '../../../../Utils/AuthContext';

//Added following functionality (similar to user search), retains local log too. Stored as an array under the user in firebase.
//Indicator changes when tapped (Following/Unfollowed)
//Adding images to the search document and modifying UI
const FollowPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const {currentUser, role} = useContext(AuthContext);
    const [userObj, setUserObj] = useState(null);
    const [followedUsers, setFollowedUsers] = useState(new Set());

    const handleFollow = (userId) => {
        setFollowedUsers(prevFollowedUsers => {
            const newFollowedUsers = new Set(prevFollowedUsers);
            if (newFollowedUsers.has(userId)) {
                newFollowedUsers.delete(userId); // Unfollow the user
            } else {
                newFollowedUsers.add(userId); // Follow the user
            }
            return newFollowedUsers;
        });
    };

    useEffect(() => {
        const updateFollowStatus = async () => {
            try {
                await UsersApi().updateUser(currentUser.uid, {following: Array.from(followedUsers)});
                //console.log("Updated follow status for users:", Array.from(followedUsers));
            } catch (error) {
                console.error("Failed to update follow status:", error);
            }
        };
        updateFollowStatus();
    }, [followedUsers]);

    useEffect(() => {
        const getUserData = async () => {
            setRefreshing(true);
            try {
                const userFetched = await UsersApi().getUsersBySomeField('uid', currentUser.uid);
                if (userFetched.docs.length > 0) {
                    setUserObj(userFetched.docs[0].data());
                    setFollowedUsers(new Set(userFetched.docs[0].data().following))
                    //console.log('User data fetched: ', currentUser.uid);
                }
            } catch (error) {
                console.error("Failed to fetch User Data:", error);
            }
            setRefreshing(false);
        };
        getUserData();
    }, [currentUser]);

    //To fetch the climb image of the latest climb
    const loadImageUrl = async (imagePath) => {
        try {
          const url = await storage().ref(imagePath).getDownloadURL();
          //console.log('Image Path: ', url);
          return url;
        } catch (error) {
          console.error("Error getting image URL: ", error);
          throw error;
        }
    };
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const querySnapshot = await UsersApi().getUsersByForSearch(searchQuery);
        const users = querySnapshot.docs.map(doc => doc.data());
        const querySnapshotEmail = await UsersApi().getUsersByForSearchEmail(searchQuery);
        const usersEmail = querySnapshotEmail.docs.map(doc => doc.data());
        //console.log('By email: ', usersEmail);
        let combinedUsers = [...users, ...usersEmail];
        let uniqueUsers = Array.from(new Set(combinedUsers.map(user => user.uid)))
            .map(uid => {
                return combinedUsers.find(user => user.uid === uid);
        });
        //Fetching Images
        const userPromises = uniqueUsers.filter(user => user.uid !== currentUser.uid).map(async user => {
            // Assuming user.image[0].path exists and loadImageUrl is the function to get the URL
            if (user.image && user.image.length > 0 && loadImageUrl) {
                try {
                    const imageUrl = await loadImageUrl(user.image[0].path);
                    return { ...user, imageUrl }; // Add imageUrl to the user object
                } catch (error) {
                    console.error("Error fetching image URL for user:", user, error);
                    // If there's an error, set imageUrl to null
                    return { ...user, imageUrl: null };
                }
            } else {
                // If no image is available, set imageUrl to null
                return { ...user, imageUrl: null };
            }
        });
        const usersWithImages = await Promise.all(userPromises);
        setSearchResults(usersWithImages);
    };

    return (
        <View style={{width: '100%', padding: 10, display:'flex', flexDirection: 'column', height:'100%'}}>
            <TextInput
                placeholder="Search for users..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                    setRefreshing(true);
                    handleSearch().then(setRefreshing(false));
                }}
                color="#767676"
                placeholderTextColor="#767676"
                style={{backgroundColor: '#D9D9D9', borderRadius: 10, padding: 8, marginBottom: 20}}
                autoFocus={true}
            />
            <ScrollView contentContainerStyle={{width: '100%', display:'flex', flexDirection:'column', justifyContent: 'flex-start', alignItems:'center'}}>
            {!refreshing && searchResults.length === 0 && (<View style={{display:'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'center'}}><Text style={{color:'black', padding: 10}}>No users found!</Text><Text style={{color:'black', padding: 10}}>Try another username ✍️</Text></View>)}
            {!refreshing && searchResults.length > 0 && searchResults.map((user, index) => (
                <TouchableOpacity 
                key={index} 
                onPress={() => {handleFollow(user.uid);}} 
                style={{
                    backgroundColor: 'white', 
                    marginBottom: 10, 
                    width: '100%', 
                    borderRadius: 10, 
                    padding: 8, 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', // This will push children to both ends
                    alignItems: 'center', // Align items vertically in the center,
                    //borderWidth: 1,
                    //borderColor:'#fe8100',
                }}
            >
                <View style={{display:'flex', flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
                <View style={{backgroundColor: '#D9D9D9', width: 30, height: 30, borderRadius: 30, alignItems: 'center', justifyContent: 'center', display: 'flex'}}>
                {user.imageUrl && (<Image source={{ uri: user.imageUrl}} style={{borderRadius: 50, height: '100%', width: '100%', display:'flex'}} />)}
                {!user.imageUrl && (<Text style={{color: 'black', fontSize: 10, display: 'flex'}}>{user.email.charAt(0).toUpperCase()}</Text>)}
                </View>
                <Text 
                    style={{color: 'black', marginRight: 'auto', display:'flex', paddingHorizontal: 10, justifyContent:'center', alignItems:'center'}} // Ensure text stays at the start
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                >
                    {user.username ? user.username : user.email.split('@')[0]}
                </Text>
                </View>
                <Text 
                    style={{
                        color: followedUsers.has(user.uid) ? 'white' : '#767676', // Change color if followed
                        paddingHorizontal: 15, 
                        backgroundColor: followedUsers.has(user.uid) ? '#fe8100' : '#D9D9D9', 
                        height: '80%', 
                        textAlign:'center', 
                        textAlignVertical: 'center', 
                        fontSize: 12, 
                        borderRadius: 10
                    }}
                >      
                {followedUsers.has(user.uid) ? 'Following' : 'Follow'}
                </Text>
             </TouchableOpacity>                        
            ))}
            {refreshing && (<ActivityIndicator color="#3498db"/>)}
            </ScrollView>
        </View>
    );
};
export default FollowPage;
