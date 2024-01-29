import React, { useState } from 'react';
import { TextInput, View, Text, TouchableOpacity } from 'react-native';
import UsersApi from '../api/UsersApi';
import { ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import { ActivityIndicator } from 'react-native-paper';
import { useContext } from 'react';
import { AuthContext } from '../Utils/AuthContext';

//Removed currentuser from search results, and added text when there are no results
const UserSearch = ({onTag}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const {currentUser, role} = useContext(AuthContext);

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
        //console.log('Results: ', uniqueUsers);
        setSearchResults(uniqueUsers);
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
                color="black"
                placeholderTextColor="black"
                style={{backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 20, borderColor:'black', borderWidth: 1.5}}
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
                    padding: 15, 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', // This will push children to both ends
                    alignItems: 'center', // Align items vertically in the center,
                    //borderWidth: 1,
                    //borderColor:'#fe8100',
                }}
            >
                <Text 
                    style={{color: 'black', marginRight: 'auto'}} // Ensure text stays at the start
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                >
                    {user.username ? user.username : user.email.split('@')[0]}
                </Text>
                <Icon name="add" size={20} color="#fe8100"/>
            </TouchableOpacity>                        
            ))}
            {refreshing && (<ActivityIndicator color="#3498db"/>)}
            </ScrollView>
        </View>
    );
};
export default UserSearch;
