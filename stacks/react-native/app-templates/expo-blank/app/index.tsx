import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{{PROJECT_NAME}}</Text>
      <Text style={styles.sub}>Expo Router blank. Replace this screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600' },
  sub: { marginTop: 8, opacity: 0.7 },
});
