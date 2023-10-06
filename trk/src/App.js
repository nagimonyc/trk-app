import React, { useState, useEffect, useContext } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import AppNavigator from './Navigation/AppNavigator';
import AuthNavigator from './Navigation/AuthNavigator';
import { AuthProvider, AuthContext } from './Utils/AuthContext';


function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}


function App(props) {

  const { currentUser } = useContext(AuthContext);

  return (
    <PaperProvider>
      {currentUser ? <AppNavigator /> : <AuthNavigator />}
    </PaperProvider>
  );
}

export default AppWrapper;