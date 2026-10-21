import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
export const storeKeys = {
  demo: "shiguang.demo.v1",
  config: "shiguang.config.v1",
};
const tokenKey = "shiguang.device.token";
export async function readToken(base: string) {
  if (Platform.OS === "web")
    return typeof sessionStorage === "undefined"
      ? null
      : sessionStorage.getItem(tokenKey + "." + base);
  return SecureStore.getItemAsync(
    tokenKey + "." + encodeURIComponent(base).replace(/[^\w.-]/g, "_"),
  );
}
export async function saveToken(base: string, token: string | null) {
  const key =
    tokenKey + "." + encodeURIComponent(base).replace(/[^\w.-]/g, "_");
  if (Platform.OS === "web") {
    if (token) sessionStorage.setItem(tokenKey + "." + base, token);
    else sessionStorage.removeItem(tokenKey + "." + base);
    return;
  }
  if (token) await SecureStore.setItemAsync(key, token);
  else await SecureStore.deleteItemAsync(key);
}
export { AsyncStorage };
