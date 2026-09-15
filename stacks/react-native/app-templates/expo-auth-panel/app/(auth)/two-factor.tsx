import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api/axios';
import { setSession } from '../../lib/session';

export default function TwoFactorScreen() {
  const router = useRouter();
  const { pre } = useLocalSearchParams<{ pre?: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (busy || !pre) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<{
        data?: {
          access_token?: { token?: string };
          refresh_token?: { token?: string };
        };
      }>('/auth/two-factor/verify', {
        pre_access_token: pre,
        code,
        recovery: false,
      });
      const access = data.data?.access_token?.token;
      const refresh = data.data?.refresh_token?.token;
      if (!access || !refresh) {
        setError('Verify did not return tokens');
        return;
      }
      await setSession({ accessToken: access, refreshToken: refresh });
      router.replace('/(app)');
    } catch {
      setError('Invalid code');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Two-factor</Text>
      <TextInput
        keyboardType="number-pad"
        onChangeText={setCode}
        placeholder="Code"
        style={styles.input}
        value={code}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={() => void onSubmit()} style={styles.btn}>
        <Text style={styles.btnText}>{busy ? '…' : 'Verify'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  btn: { backgroundColor: '#111', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600' },
  err: { color: '#b00020' },
});
