import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { clearSession } from '../../lib/session';

export default function PanelHome() {
  const router = useRouter();

  async function onLogout() {
    await clearSession();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Panel</Text>
      <Text style={styles.sub}>Call GET /me and /extracts/summary next.</Text>
      <Pressable onPress={() => void onLogout()} style={styles.btn}>
        <Text style={styles.btnText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  sub: { opacity: 0.7 },
  btn: { backgroundColor: '#111', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
});
