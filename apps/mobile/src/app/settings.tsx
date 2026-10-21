import { useState } from "react";
import { View, Text } from "react-native";
import { Page, Field, Button, Icon, Avatar } from "../components/Common";
import { useApp } from "../AppProvider";
import { validateApiUrl } from "../domain";
import { colors, ui } from "../theme";
export default function Settings() {
  const app = useApp(),
    [base, setBase] = useState(app.base),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function configure(value: string) {
    setError("");
    setBusy(true);
    try {
      const b = value ? validateApiUrl(value, __DEV__) : "";
      await app.configure(b);
      app.notify(
        b
          ? "已切换在线模式，请登录同步网站内容"
          : "已切换本机体验，在线数据未做修改",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title="连接与账号" scroll>
      <Text style={ui.eyebrow}>YOUR LITTLE KITCHEN</Text>
      <Text style={[ui.title, { marginTop: 10, marginBottom: 22 }]}>
        让好味道，随身同行<Text style={ui.orange}>.</Text>
      </Text>
      <View
        style={[
          ui.card,
          { marginBottom: 24, backgroundColor: colors.softGreen },
        ]}
      >
        <View style={ui.row}>
          <Avatar name={app.me?.name || "食"} size={45} />
          <View style={{ flex: 1 }}>
            <Text style={ui.h3}>{app.me?.name || "尚未登录"}</Text>
            <Text style={ui.muted}>
              {app.base
                ? "在线模式 · 与网站共享内容"
                : "本机体验 · 数据不会上传到社区"}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 20 }}>
          {app.me ? (
            <Button
              title="退出当前账号"
              secondary
              loading={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  await app.logout();
                  app.notify("已退出当前账号");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : (
            <Button
              title={app.base ? "使用网站账号登录" : "进入本机体验身份"}
              loading={busy}
              onPress={async () => {
                setBusy(true);
                try {
                  await app.login();
                  app.notify("欢迎回到食光");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
        </View>
      </View>
      <Text style={[ui.h3, { marginBottom: 13 }]}>连接网站后端</Text>
      <Text style={[ui.muted, { marginBottom: 19 }]}>
        填写已经运行的食光服务地址。在线模式使用真实社区数据；网络失败时会提示错误，不会自动切回体验数据。
      </Text>
      <Field
        label="API 服务地址"
        value={base}
        onChangeText={setBase}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="https://你的食光网站域名"
      />
      <Button
        title="保存并连接网站"
        disabled={!base.trim()}
        loading={busy}
        onPress={() => void configure(base.trim())}
      />
      <View style={{ height: 12 }} />
      <Button
        title="使用本机体验模式"
        secondary
        disabled={!app.base}
        onPress={() => {
          setBase("");
          void configure("");
        }}
      />
      {error ? (
        <Text style={[ui.error, { marginTop: 18 }]} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      <View style={[ui.card, { marginTop: 26 }]}>
        <View style={ui.row}>
          <Icon name="information-circle-outline" color={colors.green} />
          <Text style={ui.h3}>开发连接提示</Text>
        </View>
        <Text style={[ui.muted, { marginTop: 12 }]}>
          iOS 模拟器：本机 127.0.0.1。Android
          模拟器：10.0.2.2。真机需要同一网络中的电脑局域网
          IP，服务需允许局域网访问。仅开发构建允许本地 HTTP。
        </Text>
        <Text style={[ui.muted, { marginTop: 12 }]}>
          网站登录使用系统浏览器。Expo Go
          里可以体验本机功能；原生在线登录需要安装带 shiguang
          回调的开发构建。私有 Sites 网关未开放给 App
          时，原生请求无法访问，需配置可供 App 使用的后端。
        </Text>
      </View>
    </Page>
  );
}
