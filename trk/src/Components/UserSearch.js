import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity } from 'react-native';
import UsersApi from '../api/UsersApi';
import { ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import { ActivityIndicator } from 'react-native-paper';
import { useContext } from 'react';
import { AuthContext } from '../Utils/AuthContext';
import { Image } from 'react-native';
import storage from '@react-native-firebase/storage';
//Adding images to the search document and modifying UI
const UserSearch = ({onTag}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const {currentUser, role} = useContext(AuthContext);

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
        let uniqueUsers = Array.from(new Set(combinedUsers.filter(user => user.uid !== currentUser.uid).map(user => user.uid)))
            .map(uid => {
                return combinedUsers.find(user => user.uid === uid);
        });
        //Fetching Images
        const userPromises = uniqueUsers.map(async user => {
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
                onPress={() => { onTag(user.uid); }} 
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
                <Icon name="add" size={20} color="#fe8100"/>
            </TouchableOpacity>                        
            ))}
            {refreshing && (<ActivityIndicator color="#3498db"/>)}
            </ScrollView>
        </View>
    );
};
export default UserSearch;
