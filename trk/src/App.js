import React, { useContext } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './Navigation/AppNavigator';
import AuthNavigator from './Navigation/AuthNavigator';
import { AuthProvider, AuthContext } from './Utils/AuthContext';


function AppWrapper() {
  console.log('[TEST] AppWrapper called');
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}


function App(props) {
  console.log('[TEST] App called');

  const { currentUser } = useContext(AuthContext);

  return (
    <PaperProvider>
      {currentUser ? <AppNavigator /> : <AuthNavigator />}
    </PaperProvider>
  );
}

export default AppWrapper;