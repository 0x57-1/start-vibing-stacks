import { Stack } from 'expo-router';

export default function SessionLayout() {
  return <Stack screenOptions={{ title: '{{PROJECT_NAME}}' }} />;
}
