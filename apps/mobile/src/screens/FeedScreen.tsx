import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp, useFeed } from "../AppProvider";
import { colors, ui } from "../theme";
import {
  Avatar,
  Icon,
  IconButton,
  Empty,
  ModeBanner,
  LoginPrompt,
  Button,
} from "../components/Common";
import FoodCard from "../components/FoodCard";
import { heroImage } from "../examples";
export default function FeedScreen({
  feed = "discover",
  authorId,
  mine = false,
}: {
  feed?: string;
  authorId?: string;
  mine?: boolean;
}) {
  const app = useApp(),
    [type, setType] = useState("all"),
    [page, setPage] = useState(0),
    [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFeed({
    feed,
    type,
    page,
    author: mine ? app.me?.id : authorId,
  });
  const profile = mine ? app.me : data?.profile,
    posts = data?.posts || [],
    title = mine
      ? "我的厨房"
      : authorId
        ? "作者的厨房"
        : feed === "following"
          ? "关注的厨房"
          : feed === "saved"
            ? "收藏的美味"
            : "发现好味道";
  if (!app.ready)
    return (
      <View style={[ui.screen, { justifyContent: "center" }]}>
        <ActivityIndicator color={colors.orange} />
      </View>
    );
  if (app.bootError)
    return (
      <SafeAreaView style={ui.screen}>
        <Empty title="读取本机数据失败" subtitle={app.bootError} />
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={ui.screen} edges={["top", "left", "right"]}>
      <View style={styles.topbar}>
        {authorId ? (
          <IconButton
            name="arrow-back"
            label="返回"
            onPress={() => router.back()}
          />
        ) : (
          <View style={ui.row}>
            <View style={styles.logo}>
              <Icon name="restaurant-outline" color="white" size={21} />
            </View>
            <Text style={styles.brand}>
              食光
              <Text
                style={{ fontSize: 10, letterSpacing: 1, color: colors.muted }}
              >
                {" "}
                SHIGUANG
              </Text>
            </Text>
          </View>
        )}
        <View style={ui.row}>
          <IconButton
            name="search-outline"
            label="搜索菜名或作者"
            onPress={() => router.push("/search")}
          />
          <IconButton
            name={mine ? "settings-outline" : "options-outline"}
            label="连接与账号设置"
            onPress={() => router.push("/settings")}
          />
        </View>
      </View>
      <ModeBanner />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={() => {
              setPage(0);
              reload();
            }}
            tintColor={colors.orange}
          />
        }
      >
        {feed === "discover" && !mine && !authorId ? (
          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={[ui.eyebrow, { fontSize: 7, letterSpacing: 1.4 }]}>
                A LITTLE TASTE OF THE GOOD LIFE
              </Text>
              <Text style={styles.heroTitle}>
                把热爱，{"\n"}做成一道
                <Text style={{ color: colors.orange }}>好菜。</Text>
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 19,
                  color: "#8E9579",
                  marginTop: 10,
                }}
              >
                在烟火日常里，{"\n"}遇见同样热爱美食的人。
              </Text>
              <View style={[ui.row, { marginTop: 17, gap: 5 }]}>
                <Icon name="leaf-outline" size={13} color={colors.green} />
                <Text style={{ fontSize: 9, color: colors.green }}>
                  好好做饭，好好生活
                </Text>
              </View>
            </View>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              accessibilityLabel="新鲜食材组成的一餐"
            />
            <Text style={styles.flower}>✳</Text>
          </View>
        ) : null}
        {profile ? (
          <View style={styles.profile}>
            <View style={ui.row}>
              <Avatar name={profile.name} size={62} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[ui.eyebrow, { fontSize: 7 }]}>
                  STORIES FROM THE KITCHEN
                </Text>
                <Text style={[ui.h2, { marginTop: 7, fontSize: 22 }]}>
                  {profile.name}
                </Text>
                <Text style={[ui.muted, { marginTop: 5 }]}>{profile.bio}</Text>
              </View>
            </View>
            <View style={[ui.between, { marginTop: 18 }]}>
              <Text style={ui.muted}>
                <Text style={{ color: colors.ink, fontWeight: "600" }}>
                  {profile.followers}
                </Text>{" "}
                粉丝{" "}
                <Text style={{ color: colors.ink, fontWeight: "600" }}>
                  {profile.following}
                </Text>{" "}
                关注
              </Text>
              {profile.id === app.me?.id ? (
                <Button
                  title="编辑资料"
                  secondary
                  onPress={() => router.push("/edit-profile")}
                />
              ) : (
                <Button
                  title={profile.followed ? "已关注" : "关注作者"}
                  secondary
                  loading={busy}
                  onPress={async () => {
                    setBusy(true);
                    try {
                      await app.mutate({
                        action: "follow",
                        authorId: profile.id,
                        active: !profile.followed,
                      });
                    } catch (e) {
                      app.notify((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              )}
            </View>
          </View>
        ) : null}
        <View
          style={{
            paddingHorizontal: 19,
            paddingTop: mine || authorId ? 24 : 25,
          }}
        >
          <Text style={ui.eyebrow}>
            {feed === "saved"
              ? "SAVE A LITTLE INSPIRATION"
              : feed === "following"
                ? "YOUR FAVORITE PEOPLE"
                : "GOOD FOOD, GOOD MOOD"}
          </Text>
          <Text style={[ui.title, { marginTop: 7 }]}>
            {title}
            <Text style={{ color: colors.orange }}>.</Text>
          </Text>
          <View style={styles.filters}>
            {[
              { id: "all", label: "全部灵感" },
              { id: "recipe", label: "完整食谱" },
              { id: "work", label: "美食作品" },
            ].map((t) => (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: type === t.id }}
                key={t.id}
                onPress={() => {
                  setType(t.id);
                  setPage(0);
                }}
                style={[styles.filter, type === t.id && styles.filterActive]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: type === t.id ? colors.orange : colors.muted,
                    fontWeight: type === t.id ? "600" : "400",
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {!app.me && (mine || feed !== "discover") ? (
            <LoginPrompt />
          ) : error ? (
            <Empty
              title="美味暂时没端上桌"
              subtitle={error}
              button="重新加载"
              onPress={reload}
            />
          ) : loading && !data ? (
            <ActivityIndicator color={colors.orange} style={{ margin: 55 }} />
          ) : posts.length ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                {[0, 1].map((column) => (
                  <View style={{ flex: 1, minWidth: 0 }} key={column}>
                    {posts
                      .map((p, i) => ({ p, i }))
                      .filter(({ i }) => i % 2 === column)
                      .map(({ p, i }) => (
                        <FoodCard key={p.id} post={p} index={i} />
                      ))}
                  </View>
                ))}
              </View>
              {data?.hasMore ? (
                <Button
                  title={loading ? "加载中…" : "再来一点灵感"}
                  secondary
                  disabled={loading}
                  onPress={() => setPage((n) => n + 1)}
                />
              ) : (
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.muted,
                    textAlign: "center",
                    marginVertical: 23,
                  }}
                >
                  每一份分享，都让生活多一点滋味
                </Text>
              )}
            </>
          ) : (
            <Empty
              title={
                mine
                  ? "你的厨房，等一道好菜开场"
                  : feed === "saved"
                    ? "把心动的食谱留在这里"
                    : feed === "following"
                      ? "先遇见几位有趣的创作者"
                      : "这间厨房，还在准备第一道菜"
              }
              subtitle={
                feed === "following"
                  ? "关注喜欢的创作者，新的分享会出现在这里。"
                  : "从一道菜开始，记录生活里的小小热爱。"
              }
              button={mine ? "发布第一份美味" : "去发现美味"}
              onPress={() => router.push(mine ? "/compose" : "/")}
            />
          )}
          {feed === "discover" &&
          !mine &&
          !authorId &&
          data?.creators.length ? (
            <View
              style={{
                marginTop: 20,
                paddingTop: 22,
                borderTopWidth: 1,
                borderTopColor: colors.line,
              }}
            >
              <Text style={ui.eyebrow}>MEET THE TASTEMAKERS</Text>
              <Text
                style={[
                  ui.h2,
                  { marginTop: 8, marginBottom: 17, fontSize: 19 },
                ]}
              >
                遇见同样热爱的人<Text style={ui.orange}>.</Text>
              </Text>
              {data.creators.slice(0, 3).map((p) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={"查看作者" + p.name}
                  key={p.id}
                  onPress={() =>
                    router.push({
                      pathname: "/author/[id]",
                      params: { id: p.id },
                    })
                  }
                  style={styles.creator}
                >
                  <Avatar name={p.name} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.ink,
                      }}
                    >
                      {p.name}
                    </Text>
                    <Text
                      style={[ui.muted, { fontSize: 10 }]}
                      numberOfLines={1}
                    >
                      {p.bio}
                    </Text>
                  </View>
                  <Icon name="arrow-forward" size={17} color={colors.green} />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 1,
            color: "#B0B49F",
            textAlign: "center",
            marginTop: 27,
          }}
        >
          食光 · 认真对待每一道美味
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  topbar: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  logo: {
    width: 34,
    height: 36,
    backgroundColor: colors.orange,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-5deg" }],
  },
  brand: {
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 3,
    color: colors.ink,
  },
  hero: {
    margin: 18,
    marginBottom: 0,
    minHeight: 230,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#ECEEE0",
    flexDirection: "row",
    position: "relative",
  },
  heroCopy: { padding: 22, flex: 1.25, zIndex: 2 },
  heroTitle: {
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 42,
    letterSpacing: 1,
    color: colors.ink,
    marginTop: 15,
  },
  heroImage: {
    width: "42%",
    height: "100%",
    position: "absolute",
    right: 0,
    opacity: 0.9,
  },
  flower: {
    position: "absolute",
    right: "38%",
    top: 22,
    fontSize: 30,
    color: colors.orange,
  },
  profile: {
    margin: 18,
    marginBottom: 0,
    padding: 19,
    borderRadius: 18,
    backgroundColor: colors.softGreen,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginTop: 19,
    marginBottom: 19,
    paddingBottom: 17,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  filterActive: { backgroundColor: colors.softOrange },
  creator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.softGreen,
    padding: 14,
    borderRadius: 13,
    marginBottom: 10,
  },
});
