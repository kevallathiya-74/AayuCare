import React from 'react';
import { View, Text, StyleSheet, AppRegistry } from 'react-native';

function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AayuCare App Loading...</Text>
      <Text style={styles.subtitle}>Minimal Test Build</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00ACC1',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
  },
});

// Register the app
AppRegistry.registerComponent('main', () => App);

export default App;
