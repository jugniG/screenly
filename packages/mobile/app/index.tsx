import { Redirect } from 'expo-router';

// Root redirects to (auth)/sign-in; _layout.tsx handles the actual auth gate
export default function Index() {
  return <Redirect href="/(auth)/sign-in" />;
}
