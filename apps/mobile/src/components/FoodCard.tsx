import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import type { Post } from "../types";
import { useApp } from "../AppProvider";
import { colors } from "../theme";
import { Avatar, Icon } from "./Common";
export default function FoodCard({
  post,
  index,
}: {
  post: Post;
  index: number;
}) {
  const { mutate, notify, me } = useApp(),
    [busy, setBusy] = useState(false);
  const open = () =>
    router.push({ pathname: "/post/[id]", params: { id: post.id } });
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={"查看" + post.title}
        onPress={open}
      >
        <Image
          source={{ uri: post.images[0] }}
          accessibilityLabel={post.title}
          style={{
            width: "100%",
            aspectRatio: index % 3 === 0 ? 0.84 : index % 3 === 1 ? 1.06 : 0.95,
            backgroundColor: colors.softGreen,
          }}
        />
        <View style={styles.badge}>
          <Icon
            name={
              post.type === "recipe" ? "restaurant-outline" : "camera-outline"
            }
            size={10}
            color={colors.green}
          />
          <Text style={{ fontSize: 9, color: colors.green }}>
            {post.type === "recipe" ? "食谱" : "作品"}
          </Text>
        </View>
        {post.images.length > 1 ? (
          <View style={styles.count}>
            <Icon name="copy-outline" size={11} color="white" />
            <Text style={{ color: "white", fontSize: 9 }}>
              {post.images.length}
            </Text>
          </View>
        ) : null}
      </Pressable>
      <View style={{ padding: 11 }}>
        {post.tag ? <Text style={styles.tag}># {post.tag}</Text> : null}
        <Pressable accessibilityRole="button" onPress={open}>
          <Text numberOfLines={2} style={styles.title}>
            {post.title}
          </Text>
        </Pressable>
        <View style={styles.meta}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"查看作者" + post.name}
            style={styles.author}
            onPress={() =>
              router.push({
                pathname: "/author/[id]",
                params: { id: post.authorId },
              })
            }
          >
            <Avatar name={post.name} size={22} />
            <Text
              numberOfLines={1}
              style={{ fontSize: 9, color: colors.muted, flexShrink: 1 }}
            >
              {post.name}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={post.liked ? "取消点赞" : "点赞"}
            disabled={busy}
            onPress={async () => {
              if (!me) {
                notify("请先在我的页面登录");
                return;
              }
              setBusy(true);
              try {
                await mutate({
                  action: "like",
                  postId: post.id,
                  active: !post.liked,
                });
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              paddingVertical: 7,
              paddingLeft: 5,
            }}
          >
            <Icon
              name={post.liked ? "heart" : "heart-outline"}
              size={15}
              color={post.liked ? colors.orange : colors.muted}
            />
            <Text
              style={{
                fontSize: 10,
                color: post.liked ? colors.orange : colors.muted,
              }}
            >
              {post.likes || ""}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 13,
  },
  badge: {
    position: "absolute",
    left: 9,
    top: 9,
    backgroundColor: "#FAFCF0F0",
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 5,
  },
  count: {
    position: "absolute",
    bottom: 9,
    right: 9,
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#0006",
    padding: 5,
    borderRadius: 5,
  },
  tag: { fontSize: 9, color: "#9BA184", marginBottom: 5 },
  title: { fontSize: 13, lineHeight: 21, fontWeight: "600", color: colors.ink },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 3,
    marginTop: 10,
  },
  author: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
});
