import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../../lib/api/axios';
import { setSession } from '../../lib/session';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<{
        data?: {
          access_token?: { token?: string };
          refresh_token?: { token?: string };
          pre_access_token?: { token?: string };
        };
      }>('/auth/login', { email, password, remember: true });
      const d = data.data ?? {};
      if (d.pre_access_token?.token) {
        router.push({
          pathname: '/(auth)/two-factor',
          params: { pre: d.pre_access_token.token },
        });
        return;
      }
      const access = d.access_token?.token;
      const refresh = d.refresh_token?.token;
      if (!access || !refresh) {
        setError('Login did not return tokens');
        return;
      }
      await setSession({ accessToken: access, refreshToken: refresh });
      router.replace('/(app)');
    } catch {
      setError('Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        style={styles.input}
        value={email}
      />
      <TextInput
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
      />
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={() => void onSubmit()} style={styles.btn}>
        <Text style={styles.btnText}>{busy ? '…' : 'Continue'}</Text>
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
