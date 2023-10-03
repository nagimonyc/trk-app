import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './AppNavigator';
import auth from '@react-native-firebase/auth';
import { AuthNavigator } from './AppNavigator';
import SignIn from './Components/SignIn';
import SignUp from './Components/SignUp';

function App(props) {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) return null;

  if (!user) {
    return (
      <PaperProvider>
        {/* You can put SignIn and SignUp in a stack navigator, or render as separate components */}
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <AppNavigator />
    </PaperProvider>
  );
}

export default App;