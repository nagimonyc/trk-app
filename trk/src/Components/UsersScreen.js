import {
COLORS,
getUserAvatarNameColor,
getUserName,
} from '@flyerhq/react-native-chat-ui'
import {
User,
useRooms,
useUsers,
} from '@flyerhq/react-native-firebase-chat-core'
import {
CommonActions,
CompositeNavigationProp,
useFocusEffect,
} from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react'
import {
Button,
    Dimensions,
FlatList,
ImageBackground,
Platform,
StyleSheet,
Text,
TouchableOpacity,
View,
} from 'react-native'
import { TextInput} from 'react-native';
import UsersApi from '../api/UsersApi';
import { ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon family you prefer
import { ActivityIndicator } from 'react-native-paper';
import { useContext } from 'react';
import { AuthContext } from '../Utils/AuthContext';
import { Image } from 'react-native';
import storage from '@react-native-firebase/storage';
  
const UsersScreen = ({ navigation }) => {
    const { createRoom, createGroupRoom} = useRooms()
    const [users, setUsers] = useState([])
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { currentUser } = useContext(AuthContext);

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
        const querySnapshot = await UsersApi().getUsersBySomeField('role', 'setter');
        const users = querySnapshot.docs.map(doc => doc.data());
        let combinedUsers = users; //No email check required!
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
                    return { ...user, imageUrl, id: user.uid}; // Add imageUrl to the user object
                } catch (error) {
                    console.error("Error fetching image URL for user:", user, error);
                    // If there's an error, set imageUrl to null
                    return { ...user, imageUrl: null, id: user.uid};
                }
            } else {
                // If no image is available, set imageUrl to null
                return { ...user, imageUrl: null, id: user.uid};
            }
        });
        const usersWithImages = await Promise.all(userPromises);
        setUsers(usersWithImages);
        console.log(usersWithImages[0]);
    };

    const handleSearchWithQuery = async () => {
        if (!searchQuery.trim()) {
            setUsers([]);
            return;
        }
        const querySnapshot = await UsersApi().getUsersByForSearchSetter(searchQuery); //Make Setter Only
        const users = querySnapshot.docs.map(doc => doc.data());
        const querySnapshotEmail = await UsersApi().getUsersByForSearchEmailSetter(searchQuery); //Make Setter Only
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
                    return { ...user, imageUrl, id: user.uid}; // Add imageUrl to the user object
                } catch (error) {
                    console.error("Error fetching image URL for user:", user, error);
                    // If there's an error, set imageUrl to null
                    return { ...user, imageUrl: null, id: user.uid};
                }
            } else {
                // If no image is available, set imageUrl to null
                return { ...user, imageUrl: null, id: user.uid};
            }
        });
        const usersWithImages = await Promise.all(userPromises);
        setUsers(usersWithImages);
    };

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                setRefreshing(true);
                await handleSearch();
                setRefreshing(false);
            };
            fetchData();
        }, [])
    );

    useLayoutEffect(() => {
        Platform.OS === 'ios' &&
        navigation.setOptions({
            headerLeft: () => <Button onPress={navigation.goBack} title='Cancel' />,
        })
    })

    const handlePress = async (otherUser) => {
        const dummyUser = {
            id: "2gLtrzrdHXYTJlJi1kNtAfmARBI3", // Ensure this is unique or suitable for your testing scenario
        };
        console.log('Pressed!: ', [dummyUser]);
        const room = await createGroupRoom({imageUrl: '', metadata: '', name: 'Chat', users: [dummyUser]});
        console.log('Here!');
        if (room) {
        navigation.dispatch(
            CommonActions.navigate({
            name: 'Chat',
            params: { room },
            })
        )
        }
    }

    const renderItem = ({item}) => (
        <TouchableOpacity 
        key={item.uid} 
        onPress={() => { handlePress(item) }} 
        style={{
            backgroundColor: 'white', 
            marginBottom: 10,
            width: Dimensions.get('window').width -20, 
            borderRadius: 10, 
            padding: 8, 
            flexDirection: 'row', 
            justifyContent: 'space-between', // This will push children to both ends
            alignItems: 'center', // Align items vertically in the center,
            alignSelf: 'center'
            //borderWidth: 1,
            //borderColor:'#fe8100',
        }}
    >
        <View style={{display:'flex', flexDirection:'row', justifyContent:'center', alignItems:'center'}}>
        <View style={{backgroundColor: '#D9D9D9', width: 30, height: 30, borderRadius: 30, alignItems: 'center', justifyContent: 'center', display: 'flex'}}>
        {item.imageUrl && (<Image source={{ uri: item.imageUrl}} style={{borderRadius: 50, height: '100%', width: '100%', display:'flex'}} />)}
        {!item.imageUrl && (<Text style={{color: 'black', fontSize: 10, display: 'flex'}}>{item.email.charAt(0).toUpperCase()}</Text>)}
        </View>
        <Text 
            style={{color: 'black', marginRight: 'auto', display:'flex', paddingHorizontal: 10, justifyContent:'center', alignItems:'center'}} // Ensure text stays at the start
            numberOfLines={1} 
            ellipsizeMode="tail"
        >
            {item.username ? item.username : item.email.split('@')[0]}
        </Text>
        </View>
        <Image source={require('../../assets/plus.png')} style={{ width: 18, height: 18 }}   resizeMode="contain" />
    </TouchableOpacity> 
    )

    return (
        <View style={styles.wrapperStyle}>
            <TextInput
                placeholder="Search for users..."
                value={searchQuery}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    setRefreshing(true);
                    handleSearchWithQuery(text).then(setRefreshing(false));
                }}
                color="#767676"
                placeholderTextColor="#767676"
                style={{backgroundColor: '#D9D9D9', borderRadius: 10, padding: 8, marginBottom: 10, marginTop: 10, width: Dimensions.get('window').width - 20}}
                autoFocus={true}
            />
            {!refreshing && (
                <FlatList
                    contentContainerStyle={styles.contentContainer}
                    data={users}
                    keyExtractor={(item) => item.uid}
                    ListEmptyComponent={() => (
                        <View style={styles.listEmptyComponent}>
                            <Text style={{color: 'black'}}>No Users Found!</Text>
                        </View>
                    )}
                    renderItem={renderItem}
                    style={{marginTop: 10}}
                />
            )}
            {refreshing && (<ActivityIndicator color="#fe8100" size={'large'}/>)}
        </View>
    );    
}

const styles = StyleSheet.create({
    wrapperStyle: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        flex: 1,
    },
contentContainer: {
    flexGrow: 1,
},
listEmptyComponent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 200,
},
userContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
},
userImage: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
    width: 40,
},
userInitial: {
    color: 'black',
},
})

export default UsersScreen