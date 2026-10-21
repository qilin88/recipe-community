import React from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  type TextInputProps,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, ui } from "../theme";
import { useApp } from "../AppProvider";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 21,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
  color = colors.ink,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
export function Button({
  title,
  onPress,
  loading = false,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: loading || disabled }}
      disabled={loading || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: loading || disabled ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.orange : "white"} />
      ) : null}
      <Text
        style={{
          color: secondary ? colors.orange : "white",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.softGreen,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{ fontSize: size * 0.4, color: colors.green, fontWeight: "500" }}
      >
        {name.slice(0, 1)}
      </Text>
    </View>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 19 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#ADB09C"
        {...props}
        style={[
          ui.input,
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Header({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <IconButton
        name="arrow-back"
        label="返回"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.ink,
          flex: 1,
          textAlign: "center",
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={{ minWidth: 40, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
export function Page({
  children,
  title,
  right,
  scroll = false,
}: {
  children: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={ui.screen} edges={["top", "left", "right", "bottom"]}>
      <Header title={title} right={right} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 45 }}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Empty({
  title,
  subtitle,
  button,
  onPress,
}: {
  title: string;
  subtitle: string;
  button?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Icon name="restaurant-outline" size={31} color={colors.green} />
      </View>
      <Text style={[ui.h3, { textAlign: "center" }]}>{title}</Text>
      <Text
        style={[
          ui.muted,
          { textAlign: "center", marginTop: 10, marginBottom: 22 },
        ]}
      >
        {subtitle}
      </Text>
      {button && onPress ? (
        <Button title={button} onPress={onPress} secondary />
      ) : null}
    </View>
  );
}
export function ModeBanner() {
  const { base } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="打开连接设置"
      onPress={() => router.push("/settings")}
      style={styles.mode}
    >
      <View
        style={{
          width: 4,
          height: 4,
          backgroundColor: base ? colors.green : colors.orange,
          borderRadius: 2,
        }}
      />
      <Text style={styles.modeText}>
        {base ? "已连接网站 · 在线模式" : "本机体验 · 数据仅保存在此设备"}
      </Text>
      <Icon name="chevron-forward" size={11} color={colors.muted} />
    </Pressable>
  );
}
export function LoginPrompt() {
  const { base, login, notify } = useApp();
  const [busy, setBusy] = React.useState(false);
  return (
    <Empty
      title={base ? "登录，打开你的美味世界" : "用一个体验身份，开启你的厨房"}
      subtitle={
        base
          ? "使用系统浏览器完成网站登录，即可同步收藏和作品。"
          : "本机体验中的发布与互动不会上传到社区。"
      }
      button={busy ? "正在登录…" : base ? "使用网站账号登录" : "进入本机体验"}
      onPress={() => {
        if (busy) return;
        setBusy(true);
        login()
          .catch((e) => notify(e.message))
          .finally(() => setBusy(false));
      }}
    />
  );
}
const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  button: {
    minHeight: 46,
    borderRadius: 13,
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: colors.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondary: {
    backgroundColor: colors.softOrange,
    borderWidth: 1,
    borderColor: "#EDD6C6",
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 35,
    minHeight: 300,
  },
  emptyIcon: {
    width: 65,
    height: 65,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softGreen,
    marginBottom: 20,
  },
  mode: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: "#F1F1E8",
  },
  modeText: { fontSize: 10, color: colors.muted },
});
