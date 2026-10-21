import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Share,
  useWindowDimensions,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp, useFeed } from "../../AppProvider";
import {
  Page,
  Icon,
  IconButton,
  Avatar,
  Button,
  Empty,
} from "../../components/Common";
import { colors, ui } from "../../theme";
import type { Comment } from "../../types";
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    app = useApp(),
    { data, loading, error, reload } = useFeed({ detail: id });
  const post = data?.posts[0],
    width = Math.min(useWindowDimensions().width, 600),
    [image, setImage] = useState(0),
    [busy, setBusy] = useState(false),
    [text, setText] = useState(""),
    [reply, setReply] = useState<Comment | null>(null),
    [comments, setComments] = useState<Comment[]>([]),
    [commentPage, setCommentPage] = useState(0),
    [hasMore, setHasMore] = useState(false),
    [commentError, setCommentError] = useState(""),
    [commentLoading, setCommentLoading] = useState(true),
    [remove, setRemove] = useState<string | null>(null);
  const { comments: fetchComments, revision, ready } = app;
  useEffect(() => {
    if (!ready) return;
    let active = true;
    fetchComments(id, 0)
      .then((d) => {
        if (!active) return;
        setComments(d.comments);
        setHasMore(d.hasMore);
        setCommentPage(0);
        setCommentError("");
      })
      .catch((e) => {
        if (active) setCommentError(e.message);
      })
      .finally(() => {
        if (active) setCommentLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, fetchComments, revision, ready]);
  async function act(action: string, values: Record<string, unknown> = {}) {
    if (!app.me) {
      app.notify("请先登录后参与交流");
      router.push("/settings");
      return false;
    }
    setBusy(true);
    try {
      await app.mutate({ action, postId: id, ...values });
      return true;
    } catch (e) {
      app.notify((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (error)
    return (
      <Page title="美味详情">
        <Empty
          title="这道美味暂时无法打开"
          subtitle={error}
          button="重试"
          onPress={reload}
        />
      </Page>
    );
  if (!post)
    return (
      <Page title="美味详情">
        {loading ? (
          <ActivityIndicator style={{ margin: 50 }} color={colors.orange} />
        ) : (
          <Empty
            title="内容不存在或已删除"
            subtitle="回到发现页看看其他好味道。"
          />
        )}
      </Page>
    );
  return (
    <Page
      title={post.type === "recipe" ? "一份完整食谱" : "一份美食灵感"}
      right={
        <IconButton
          name="share-outline"
          label="分享内容"
          onPress={() =>
            void Share.share({ message: post.title + "\n" + post.body }).catch(
              (e) => app.notify(e.message),
            )
          }
        />
      }
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setImage(
                Math.round(
                  e.nativeEvent.contentOffset.x /
                    e.nativeEvent.layoutMeasurement.width,
                ),
              )
            }
          >
            {post.images.map((uri, i) => (
              <Image
                key={uri + i}
                source={{ uri }}
                accessibilityLabel={`${post.title}，图片${i + 1}`}
                style={{
                  width,
                  height: width * 0.92,
                  backgroundColor: colors.softGreen,
                }}
              />
            ))}
          </ScrollView>
          {post.images.length > 1 ? (
            <View style={styles.counter}>
              <Text style={{ fontSize: 11, color: "white" }}>
                {image + 1} / {post.images.length}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={{ padding: 21 }}>
          <View style={ui.between}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={"查看作者" + post.name}
              style={ui.row}
              onPress={() =>
                router.push({
                  pathname: "/author/[id]",
                  params: { id: post.authorId },
                })
              }
            >
              <Avatar name={post.name} />
              <View>
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}
                >
                  {post.name}
                </Text>
                <Text style={[ui.muted, { fontSize: 10 }]}>
                  {app.base
                    ? new Date(post.createdAt).toLocaleDateString("zh-CN")
                    : "本机体验内容"}
                </Text>
              </View>
            </Pressable>
            {post.authorId !== app.me?.id ? (
              <Button
                title={post.followed ? "已关注" : "+ 关注"}
                secondary
                loading={busy}
                disabled={loading}
                onPress={() =>
                  void act("follow", {
                    authorId: post.authorId,
                    active: !post.followed,
                  })
                }
              />
            ) : null}
          </View>
          <View style={[ui.row, { marginTop: 23 }]}>
            <View style={ui.pill}>
              <Text style={ui.pillText}>
                {post.type === "recipe" ? "完整食谱" : "美食作品"}
              </Text>
            </View>
            {post.tag ? (
              <Text style={{ fontSize: 11, color: colors.green }}>
                #{post.tag}
              </Text>
            ) : null}
          </View>
          <Text
            style={[ui.title, { fontSize: 25, lineHeight: 37, marginTop: 15 }]}
          >
            {post.title}
          </Text>
          <Text
            style={[
              ui.text,
              { color: "#828B72", marginTop: 15, lineHeight: 26 },
            ]}
          >
            {post.body}
          </Text>
          {post.type === "recipe" ? (
            <>
              <View style={[ui.between, ui.section]}>
                <Text style={ui.h3}>准备食材</Text>
                <Text style={ui.muted}>{post.servings}</Text>
              </View>
              <View style={styles.ingredients}>
                {post.ingredients.map((item, i) => (
                  <View
                    key={i}
                    style={[
                      ui.between,
                      {
                        paddingVertical: 12,
                        borderBottomWidth:
                          i < post.ingredients.length - 1 ? 1 : 0,
                        borderColor: "#DDE2D1",
                      },
                    ]}
                  >
                    <Text style={[ui.text, { fontSize: 13, flex: 1 }]}>
                      {item.name}
                    </Text>
                    <Text style={[ui.muted, { maxWidth: "50%" }]}>
                      {item.amount}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={[ui.between, ui.section]}>
                <Text style={ui.h3}>一起动手做</Text>
                <Text style={ui.muted}>{post.steps.length} 个步骤</Text>
              </View>
              {post.steps.map((step, i) => (
                <View
                  style={{ flexDirection: "row", gap: 13, marginTop: 20 }}
                  key={i}
                >
                  <View style={styles.stepNumber}>
                    <Text style={{ fontSize: 11, color: colors.green }}>
                      {String(i + 1).padStart(2, "0")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[ui.text, { fontSize: 13, color: "#7E886F" }]}>
                      {step.text}
                    </Text>
                    {step.image ? (
                      <Image
                        source={{ uri: step.image }}
                        accessibilityLabel={`步骤${i + 1}配图`}
                        style={{
                          width: "100%",
                          height: 190,
                          borderRadius: 13,
                          marginTop: 12,
                        }}
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              disabled={busy || loading}
              accessibilityRole="button"
              accessibilityLabel={post.liked ? "取消点赞" : "点赞"}
              style={ui.row}
              onPress={() => void act("like", { active: !post.liked })}
            >
              <Icon
                name={post.liked ? "heart" : "heart-outline"}
                color={post.liked ? colors.orange : colors.muted}
              />
              <Text style={[ui.muted, post.liked && ui.orange]}>
                {post.likes || "喜欢"}
              </Text>
            </Pressable>
            <Pressable
              disabled={busy || loading}
              accessibilityRole="button"
              accessibilityLabel={post.saved ? "取消收藏" : "收藏"}
              style={ui.row}
              onPress={() => void act("save", { active: !post.saved })}
            >
              <Icon
                name={post.saved ? "bookmark" : "bookmark-outline"}
                color={post.saved ? colors.orange : colors.muted}
              />
              <Text style={[ui.muted, post.saved && ui.orange]}>
                {post.saved ? "已收藏" : "收藏灵感"}
              </Text>
            </Pressable>
            <View style={[ui.row, { marginLeft: "auto" }]}>
              <Icon name="chatbubble-outline" color={colors.muted} size={19} />
              <Text style={ui.muted}>{post.commentCount}</Text>
            </View>
          </View>
          <View style={ui.between}>
            <Text style={ui.h3}>
              聊聊这道美味 <Text style={ui.muted}>{post.commentCount}</Text>
            </Text>
            {post.authorId === app.me?.id ? (
              <IconButton
                name="trash-outline"
                label="删除自己的内容"
                color={colors.muted}
                onPress={() => setRemove("post")}
              />
            ) : null}
          </View>
          {hasMore ? (
            <Pressable
              accessibilityRole="button"
              disabled={commentLoading}
              onPress={async () => {
                setCommentLoading(true);
                try {
                  const d = await app.comments(id, commentPage + 1);
                  setComments((prev) => [
                    ...new Map(
                      [...d.comments, ...prev].map((c) => [c.id, c]),
                    ).values(),
                  ]);
                  setCommentPage((n) => n + 1);
                  setHasMore(d.hasMore);
                  setCommentError("");
                } catch (e) {
                  app.notify((e as Error).message);
                } finally {
                  setCommentLoading(false);
                }
              }}
            >
              <Text
                style={{
                  color: colors.orange,
                  fontSize: 12,
                  marginVertical: 15,
                }}
              >
                加载更早的评论
              </Text>
            </Pressable>
          ) : null}
          {commentError ? <Text style={ui.error}>{commentError}</Text> : null}
          {commentLoading && comments.length === 0 ? (
            <ActivityIndicator style={{ margin: 25 }} color={colors.orange} />
          ) : !comments.length ? (
            <Text style={[ui.muted, { marginVertical: 22 }]}>
              还没有评论，来分享你的做法或小技巧吧。
            </Text>
          ) : (
            comments.map((c) => (
              <View
                style={[styles.comment, c.parentId && { marginLeft: 27 }]}
                key={c.id}
              >
                <Avatar name={c.name} size={27} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: colors.green,
                    }}
                  >
                    {c.name}
                    {c.parentId ? (
                      <Text style={{ fontWeight: "400", color: colors.muted }}>
                        {" "}
                        回复{" "}
                        {comments.find((p) => p.id === c.parentId)?.name ||
                          "评论"}
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={[ui.text, { fontSize: 13, marginTop: 6 }]}>
                    {c.text}
                  </Text>
                  <View style={[ui.row, { marginTop: 8, gap: 15 }]}>
                    <Text style={{ fontSize: 9, color: colors.muted }}>
                      {new Date(c.createdAt).toLocaleDateString("zh-CN")}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={"回复" + c.name}
                      onPress={() => setReply(c)}
                    >
                      <Text style={{ fontSize: 10, color: colors.green }}>
                        回复
                      </Text>
                    </Pressable>
                    {c.authorId === app.me?.id ? <Pressable accessibilityRole="button" accessibilityLabel="删除自己的评论" disabled={busy} onPress={() => setRemove(c.id)}><Text style={{fontSize:10,color:colors.muted}}>删除</Text></Pressable> : null}
                  </View>
                </View>
              </View>
            ))
          )}
          {app.me ? (
            <View style={{ marginTop: 20 }}>
              {reply ? (
                <View style={[ui.between, { marginBottom: 8 }]}>
                  <Text style={ui.muted}>回复 {reply.name}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setReply(null)}
                  >
                    <Text style={{ fontSize: 11, color: colors.orange }}>
                      取消回复
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <View style={styles.commentInput}>
                <TextInput
                  accessibilityLabel="写下评论"
                  value={text}
                  onChangeText={setText}
                  placeholder="分享你的烹饪灵感…"
                  maxLength={1000}
                  multiline
                  style={{
                    flex: 1,
                    minHeight: 45,
                    maxHeight: 120,
                    fontSize: 13,
                    color: colors.ink,
                    padding: 10,
                  }}
                  placeholderTextColor={colors.muted}
                />
                <IconButton
                  name="send"
                  label="发送评论"
                  disabled={busy || !text.trim()}
                  color={colors.orange}
                  onPress={async () => {
                    if (await act("comment", { text, parentId: reply?.id })) {
                      setText("");
                      setReply(null);
                    }
                  }}
                />
              </View>
            </View>
          ) : (
            <Button
              title="登录参与交流"
              onPress={() => router.push("/settings")}
            />
          )}
        </View>
      </ScrollView>
      <Modal
        transparent
        visible={!!remove}
        animationType="fade"
        onRequestClose={() => setRemove(null)}
      >
        <View style={styles.overlay}>
          <View style={[ui.card, { width: "85%", maxWidth: 370 }]}>
            <Text style={ui.h3}>{remove === "post" ? "删除这份分享？" : "删除这条评论？"}</Text>
            <Text style={[ui.muted, { marginVertical: 17 }]}>
              {remove === "post" ? "内容及其评论将被删除，操作无法撤销。" : "这条评论将被删除，操作无法撤销。"}
            </Text>
            <View style={ui.row}>
              <View style={{ flex: 1 }}>
                <Button
                  title="保留内容"
                  secondary
                  onPress={() => setRemove(null)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="确认删除"
                  loading={busy}
                  onPress={async () => {
                    if (await act(remove === "post" ? "delete" : "deleteComment", remove === "post" ? {} : { id: remove })) {
                      if (remove === "post") router.back();
                      setRemove(null);
                      app.notify("已删除");
                    }
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}
const styles = StyleSheet.create({
  counter: {
    position: "absolute",
    bottom: 16,
    right: 17,
    backgroundColor: "#0007",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  ingredients: {
    backgroundColor: colors.softGreen,
    borderRadius: 15,
    paddingHorizontal: 17,
    marginTop: 15,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 25,
    alignItems: "center",
    paddingVertical: 21,
    marginTop: 28,
    marginBottom: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
  },
  comment: { flexDirection: "row", gap: 10, marginVertical: 15 },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.softGreen,
    borderRadius: 13,
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#1A241B88",
    alignItems: "center",
    justifyContent: "center",
  },
});
