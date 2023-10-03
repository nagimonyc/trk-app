import React, { useState, useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import AppNavigator from './Navigation/AppNavigator';
import AuthNavigator from './Navigation/AuthNavigator';

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

  return (
    <PaperProvider>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </PaperProvider>
  );
}

export default App;
