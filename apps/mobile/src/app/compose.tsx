import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useApp } from "../AppProvider";
import {
  Page,
  Field,
  Button,
  Icon,
  IconButton,
  LoginPrompt,
} from "../components/Common";
import { colors, ui } from "../theme";
import { pickImages, uploadAsset } from "../media";
import { type Asset } from "../api";
import { validateDraft, draftStorageKey } from "../domain";
import { AsyncStorage } from "../storage";
import { examples } from "../examples";
import type { Ingredient } from "../types";
export default function Compose() {
  const app = useApp(),
    [type, setType] = useState<"work" | "recipe">("work"),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [tag, setTag] = useState(""),
    [servings, setServings] = useState("2 人份"),
    [images, setImages] = useState<Asset[]>([]),
    [ingredients, setIngredients] = useState<Ingredient[]>([
      { name: "", amount: "" },
    ]),
    [steps, setSteps] = useState<{ text: string; image?: Asset }[]>([
      { text: "" },
    ]),
    [busy, setBusy] = useState(false),
    [picking, setPicking] = useState(false),
    [error, setError] = useState(""),
    [loadedKey, setLoadedKey] = useState("");
  const uploaded = useRef(new Map<string, string>()),
    published = useRef(false),
    draftKey = draftStorageKey(app.base, app.me?.id || "anonymous"),
    draftReady = loadedKey === draftKey;
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(draftKey)
      .then((value) => {
        if (!active) return;
        const d = value ? JSON.parse(value) : {};
        uploaded.current.clear();
        published.current = false;
        if (d.images && !Array.isArray(d.images))
          throw new Error("草稿格式无效");
        setType(d.type === "recipe" ? "recipe" : "work");
        setTitle(d.title || "");
        setBody(d.body || "");
        setTag(d.tag || "");
        setServings(d.servings || "2 人份");
        setImages(d.images || []);
        setIngredients(
          d.ingredients?.length ? d.ingredients : [{ name: "", amount: "" }],
        );
        setSteps(d.steps?.length ? d.steps : [{ text: "" }]);
      })
      .catch(() => {
        if (active) {
          uploaded.current.clear();
          published.current = false;
          setType("work");
          setTitle("");
          setBody("");
          setTag("");
          setServings("2 人份");
          setImages([]);
          setIngredients([{ name: "", amount: "" }]);
          setSteps([{ text: "" }]);
          setError("未能恢复上次草稿，可以继续新建。");
        }
      })
      .finally(() => {
        if (active) setLoadedKey(draftKey);
      });
    return () => {
      active = false;
    };
  }, [draftKey]);
  useLayoutEffect(() => {
    if (!draftReady || published.current) return;
    void AsyncStorage.setItem(
      draftKey,
      JSON.stringify({
        type,
        title,
        body,
        tag,
        servings,
        images,
        ingredients,
        steps,
      }),
    ).catch(() => setError("草稿保存失败，请检查设备空间"));
  }, [
    draftReady,
    draftKey,
    type,
    title,
    body,
    tag,
    servings,
    images,
    ingredients,
    steps,
  ]);
  async function choose(step?: number) {
    setError("");
    setPicking(true);
    try {
      const assets = await pickImages(
        step === undefined ? 9 - images.length : 1,
      );
      if (!assets.length) return;
      if (step === undefined) setImages((prev) => [...prev, ...assets]);
      else
        setSteps((prev) =>
          prev.map((s, i) => (i === step ? { ...s, image: assets[0] } : s)),
        );
    } catch (e) {
      setError((e as Error).message || "无法读取相册，请检查权限");
    } finally {
      setPicking(false);
    }
  }
  async function path(asset: Asset) {
    if (uploaded.current.has(asset.uri))
      return uploaded.current.get(asset.uri)!;
    const uri = await uploadAsset(app.base, app.token, asset);
    uploaded.current.set(asset.uri, uri);
    return uri;
  }
  async function submit() {
    setError("");
    try {
      validateDraft({
        type,
        title,
        body,
        tag,
        servings,
        images: images.map((i) => i.uri),
        ingredients,
        steps: steps.map((s) => ({ text: s.text, image: s.image?.uri })),
      });
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setBusy(true);
    try {
      const imagePaths: string[] = [];
      for (const asset of images) imagePaths.push(await path(asset));
      const stepPaths = [];
      for (const step of steps)
        stepPaths.push({
          text: step.text,
          ...(step.image ? { image: await path(step.image) } : {}),
        });
      await app.mutate({
        action: "publish",
        type,
        title,
        body,
        tag,
        servings,
        images: imagePaths,
        ingredients,
        steps: stepPaths,
      });
      published.current = true;
      await AsyncStorage.removeItem(draftKey);
      app.notify(app.base ? "分享成功，已同步到社区" : "已发布到本机体验厨房");
      router.replace("/(tabs)/mine");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!app.ready || !draftReady)
    return (
      <Page title="分享你的美味">
        <ActivityIndicator style={{ margin: 40 }} color={colors.orange} />
      </Page>
    );
  if (!app.me)
    return (
      <Page title="分享你的美味">
        <LoginPrompt />
      </Page>
    );
  return (
    <Page title="分享你的美味">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 21, paddingBottom: 45 }}
      >
        <Text style={ui.eyebrow}>FROM YOUR KITCHEN, WITH LOVE</Text>
        <Text style={[ui.title, { marginTop: 10, marginBottom: 10 }]}>
          把好味道，分享出去<Text style={ui.orange}>.</Text>
        </Text>
        <Text style={[ui.muted, { marginBottom: 23 }]}>
          {app.base
            ? "让一道好菜，成为另一个人的灵感。"
            : "本机体验模式 · 此分享仅保存在你的设备。"}
        </Text>
        <View style={[ui.row, { marginBottom: 25 }]}>
          {(
            [
              { id: "work", label: "美食作品", sub: "记录小美好" },
              { id: "recipe", label: "完整食谱", sub: "分享详细做法" },
            ] as const
          ).map((t) => (
            <Pressable
              key={t.id}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected: type === t.id }}
              disabled={busy}
              onPress={() => setType(t.id)}
              style={{
                flex: 1,
                padding: 15,
                borderWidth: 1,
                borderColor: type === t.id ? "#D9A78A" : colors.line,
                borderRadius: 13,
                backgroundColor: type === t.id ? colors.softOrange : "white",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: type === t.id ? colors.orange : colors.ink,
                }}
              >
                {t.label}
              </Text>
              <Text style={[ui.muted, { fontSize: 10, marginTop: 6 }]}>
                {t.sub}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[ui.between, { marginBottom: 12 }]}>
          <Text style={ui.label}>成品图片</Text>
          <Text style={ui.muted}>{images.length}/9 · 第一张作为封面</Text>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {images.map((asset, i) => (
            <View
              key={asset.uri + i}
              style={{
                width: 97,
                height: 108,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: colors.softGreen,
              }}
            >
              <Image
                source={{ uri: asset.uri }}
                accessibilityLabel={`成品图${i + 1}`}
                style={{ width: 97, height: 108 }}
              />
              <View
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  backgroundColor: "#FFF9",
                  borderBottomLeftRadius: 12,
                }}
              >
                <IconButton
                  name="close"
                  label={`移除成品图${i + 1}`}
                  disabled={busy || picking}
                  onPress={() =>
                    setImages((prev) => prev.filter((_, k) => k !== i))
                  }
                />
              </View>
              {i > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`将第${i + 1}张设为封面`}
                  onPress={() =>
                    setImages((prev) => [
                      asset,
                      ...prev.filter((_, k) => k !== i),
                    ])
                  }
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    paddingVertical: 5,
                    backgroundColor: "#FFF9",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      color: colors.ink,
                      textAlign: "center",
                    }}
                  >
                    设为封面
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {images.length < 9 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="从相册添加成品图片"
              disabled={picking || busy}
              onPress={() => void choose()}
              style={{
                width: 97,
                height: 108,
                borderRadius: 12,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#C6CEB6",
                backgroundColor: colors.softGreen,
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {picking ? (
                <ActivityIndicator color={colors.green} />
              ) : (
                <Icon name="images-outline" color={colors.green} size={25} />
              )}
              <Text style={{ fontSize: 10, color: colors.green }}>
                {picking ? "正在处理" : "添加图片"}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text
          style={[ui.muted, { fontSize: 10, marginTop: 10, marginBottom: 20 }]}
        >
          图片将转为 JPG，每张最多 5 MB。
        </Text>
        {!app.base && images.length === 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              setImages([
                {
                  uri: examples[0].images[0],
                  name: "example.jpg",
                  mimeType: "image/jpeg",
                  size: 0,
                },
              ])
            }
          >
            <Text
              style={{ fontSize: 12, color: colors.orange, marginBottom: 18 }}
            >
              先使用一张灵感图片体验发布
            </Text>
          </Pressable>
        ) : null}
        <Field
          label="标题"
          placeholder="给这道美味起个名字吧"
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          editable={!busy}
        />
        <Field
          label="创作心得"
          placeholder="分享灵感、味道，或这道菜背后的小故事……"
          value={body}
          onChangeText={setBody}
          maxLength={5000}
          multiline
          editable={!busy}
        />
        <Field
          label="标签（可选）"
          placeholder="例如：周末下厨"
          value={tag}
          onChangeText={setTag}
          maxLength={20}
          editable={!busy}
        />
        {type === "recipe" ? (
          <>
            <Field
              label="份量"
              value={servings}
              onChangeText={setServings}
              maxLength={30}
            />
            <View style={[ui.between, { marginBottom: 17, marginTop: 6 }]}>
              <Text style={ui.h3}>准备食材</Text>
              <Pressable
                disabled={ingredients.length >= 50 || busy}
                onPress={() =>
                  setIngredients((prev) => [...prev, { name: "", amount: "" }])
                }
                accessibilityRole="button"
              >
                <Text style={{ color: colors.orange, fontSize: 12 }}>
                  ＋ 添加食材
                </Text>
              </Pressable>
            </View>
            {ingredients.map((item, i) => (
              <View
                style={{
                  flexDirection: "row",
                  gap: 7,
                  alignItems: "flex-start",
                }}
                key={i}
              >
                <View style={{ flex: 1 }}>
                  <Field
                    label={`食材 ${i + 1}`}
                    placeholder="食材名称"
                    value={item.name}
                    maxLength={80}
                    onChangeText={(v) =>
                      setIngredients((prev) =>
                        prev.map((s, k) => (k === i ? { ...s, name: v } : s)),
                      )
                    }
                  />
                </View>
                <View style={{ width: "32%" }}>
                  <Field
                    label={`用量 ${i + 1}`}
                    placeholder="100 克"
                    maxLength={80}
                    value={item.amount}
                    onChangeText={(v) =>
                      setIngredients((prev) =>
                        prev.map((s, k) => (k === i ? { ...s, amount: v } : s)),
                      )
                    }
                  />
                </View>
                <View style={{ paddingTop: 25 }}>
                  <IconButton
                    name="remove-circle-outline"
                    label={`删除食材${i + 1}`}
                    disabled={ingredients.length <= 1 || busy}
                    color={colors.muted}
                    onPress={() =>
                      setIngredients((prev) => prev.filter((_, k) => k !== i))
                    }
                  />
                </View>
              </View>
            ))}
            <View style={[ui.between, { marginBottom: 20, marginTop: 7 }]}>
              <Text style={ui.h3}>制作步骤</Text>
              <Pressable
                accessibilityRole="button"
                disabled={steps.length >= 30 || busy}
                onPress={() => setSteps((prev) => [...prev, { text: "" }])}
              >
                <Text style={{ color: colors.orange, fontSize: 12 }}>
                  ＋ 添加步骤
                </Text>
              </Pressable>
            </View>
            {steps.map((step, i) => (
              <View key={i} style={{ marginBottom: 22 }}>
                <Field
                  label={`步骤 ${i + 1}`}
                  value={step.text}
                  maxLength={2000}
                  multiline
                  placeholder="描述这一步的做法与小技巧"
                  onChangeText={(v) =>
                    setSteps((prev) =>
                      prev.map((s, k) => (k === i ? { ...s, text: v } : s)),
                    )
                  }
                />
                {step.image ? (
                  <Image
                    source={{ uri: step.image.uri }}
                    accessibilityLabel={`步骤${i + 1}配图`}
                    style={{
                      width: "100%",
                      height: 165,
                      borderRadius: 12,
                      marginBottom: 10,
                    }}
                  />
                ) : null}
                <View style={ui.between}>
                  <Pressable
                    disabled={busy || picking}
                    accessibilityRole="button"
                    onPress={() => void choose(i)}
                    style={ui.row}
                  >
                    <Icon name="image-outline" size={17} color={colors.green} />
                    <Text style={{ fontSize: 11, color: colors.green }}>
                      {step.image ? "更换步骤配图" : "添加配图（可选）"}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={steps.length <= 1 || busy}
                    onPress={() =>
                      setSteps((prev) => prev.filter((_, k) => k !== i))
                    }
                  >
                    <Text style={{ fontSize: 11, color: colors.muted }}>
                      删除步骤
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        ) : null}
        {error ? (
          <Text
            accessibilityRole="alert"
            style={[ui.error, { marginBottom: 20 }]}
          >
            {error}
          </Text>
        ) : null}
        <Button
          title={busy ? "正在发布…" : "发布分享"}
          onPress={() => void submit()}
          loading={busy}
          disabled={picking}
        />
        <Text
          style={[
            ui.muted,
            { fontSize: 10, textAlign: "center", marginTop: 13 },
          ]}
        >
          草稿自动保存在本设备，失败后可继续编辑。
        </Text>
      </ScrollView>
    </Page>
  );
}
