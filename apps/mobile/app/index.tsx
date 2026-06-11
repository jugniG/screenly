import { View, ActivityIndicator } from 'react-native';

// _layout.tsx handles all routing — this is just a splash until fonts/session load
export default function Index() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA' }}>
    <ActivityIndicator size="large" color="#5C6EFF" />
  </View>;
}
