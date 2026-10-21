import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { requestJSON } from "./api";
WebBrowser.maybeCompleteAuthSession();
export async function signInToServer(base: string) {
  const bytes = await Crypto.getRandomBytesAsync(32),
    verifier = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
  const state = Crypto.randomUUID().replace(/-/g, "");
  const challenge = (
    await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      verifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const redirect =
    Platform.OS === "web"
      ? window.location.origin + "/auth"
      : AuthSession.makeRedirectUri({ scheme: "shiguang", path: "auth" });
  if (Platform.OS !== "web" && redirect !== "shiguang://auth")
    throw new Error("在线登录需要安装食光开发构建；Expo Go可使用本机体验模式");
  const params = new URLSearchParams({
    challenge,
    state,
    redirect_uri: redirect,
  });
  const result = await WebBrowser.openAuthSessionAsync(
    base + "/mobile/auth?" + params,
    redirect,
  );
  if (result.type !== "success") throw new Error("登录已取消，未改变当前账号");
  const callback = new URL(result.url), expected = new URL(redirect);
  if (callback.protocol !== expected.protocol || callback.host !== expected.host || callback.pathname !== expected.pathname) throw new Error("登录回调地址不匹配");
  if (callback.searchParams.get("state") !== state)
    throw new Error("登录校验失败，请重试");
  const code = callback.searchParams.get("code");
  if (!code) throw new Error("未收到登录授权码");
  const response = await requestJSON<{ token: string }>(
    base,
    "/api/mobile/session",
    null,
    { action: "exchange", code, verifier },
  );
  return response.token;
}
