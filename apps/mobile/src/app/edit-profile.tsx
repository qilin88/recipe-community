import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { useApp } from "../AppProvider";
import { Page, Field, Button, Avatar, LoginPrompt } from "../components/Common";
import { ui } from "../theme";
export default function EditProfile() {
  const app = useApp(),
    [name, setName] = useState(app.me?.name || ""),
    [bio, setBio] = useState(app.me?.bio || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!app.me)
    return (
      <Page title="编辑厨房资料">
        <LoginPrompt />
      </Page>
    );
  return (
    <Page title="编辑厨房资料" scroll>
      <View style={{ alignItems: "center", margin: 20 }}>
        <Avatar name={name || "食"} size={75} />
        <Text style={[ui.muted, { marginTop: 13 }]}>头像随昵称自动生成</Text>
      </View>
      <Field label="昵称" value={name} onChangeText={setName} maxLength={40} />
      <Field
        label="个人简介"
        value={bio}
        onChangeText={setBio}
        maxLength={200}
        multiline
        placeholder="你的烹饪风格，或关于美味的小信念"
      />
      {error ? (
        <Text style={[ui.error, { marginBottom: 18 }]}>{error}</Text>
      ) : null}
      <Button
        title="保存资料"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setError("");
          try {
            await app.mutate({ action: "profile", name, bio });
            app.notify("厨房资料已更新");
            router.back();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </Page>
  );
}
