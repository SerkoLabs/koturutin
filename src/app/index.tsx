import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAppState } from '@/state/AppState';

export default function Index() {
  const { loading, canEnterLoop } = useAppState();
  if (loading) return <View />;
  return <Redirect href={canEnterLoop ? '/home' : '/welcome'} />;
}
