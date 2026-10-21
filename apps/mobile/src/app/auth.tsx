import { View, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
export default function Auth() {
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>登录已返回，请回到食光 App。</Text>
    </View>
  );
}
