import { Tabs, router } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { Icon, type IconName } from "../../components/Common";
const items: [string, string, IconName][] = [
  ["index", "发现", "compass-outline"],
  ["following", "关注", "people-outline"],
  ["saved", "收藏", "bookmark-outline"],
  ["mine", "我的", "person-outline"],
];
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab }) => (
        <View
          style={{
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderColor: colors.line,
            paddingBottom: Math.max(insets.bottom, 10),
            paddingTop: 10,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {items.map(([key, label, icon], i) => (
            <View
              key={key}
              style={{
                flex: i === 1 ? 2 : 1,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{
                  selected: state.routes[state.index]?.name === key,
                }}
                onPress={() => {
                  const target = state.routes.find((r) => r.name === key);
                  if (target) navigateToTab(target.key);
                }}
                style={{ flex: 1, alignItems: "center", gap: 4, minHeight: 42 }}
              >
                <Icon
                  name={icon}
                  size={23}
                  color={
                    state.routes[state.index]?.name === key
                      ? colors.orange
                      : colors.muted
                  }
                />
                <Text
                  style={{
                    fontSize: 10,
                    color:
                      state.routes[state.index]?.name === key
                        ? colors.orange
                        : colors.muted,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
              {i === 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="发布分享"
                  onPress={() => router.push("/compose")}
                  style={{ flex: 1, alignItems: "center" }}
                >
                  <View
                    style={{
                      backgroundColor: colors.orange,
                      width: 47,
                      height: 47,
                      borderRadius: 17,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: -6,
                    }}
                  >
                    <Icon name="add" size={28} color="white" />
                  </View>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="following" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="mine" />
    </Tabs>
  );
}
