import React from 'react';
import AppLayout from './components/Layout/AppLayout';
import { AuthProvider } from './components/Auth/AuthProvider';

function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

export default App;
