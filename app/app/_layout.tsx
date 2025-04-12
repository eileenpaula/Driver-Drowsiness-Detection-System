import { Stack } from "expo-router";
/**
 * Specified screen names and added a false tag for the header that kept popping up for the entry page. -nage
 */
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name = "login"
      options={{headerShown: false}}
      />
      <Stack.Screen name ="index"
      options={{headerShown: false}}
      />
      <Stack.Screen name="stats" 
      options={{headerTitle: "Driving Stats"}}
      />
      <Stack.Screen name ="settings"
      options={{headerShown: false}}
      />
      <Stack.Screen name ="profile"
      options={{headerShown: false}}
      />
      <Stack.Screen name ="camera"
      options={{headerShown: false}}
      />
    </Stack>
  ) ;
}