import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Page, Avatar, Icon, Empty } from "../components/Common";
import { useFeed } from "../AppProvider";
import { colors, ui } from "../theme";
import FoodCard from "../components/FoodCard";
export default function Search() {
  const [value, setValue] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    { data, error, loading, reload } = useFeed({ q: query, page });
  return (
    <Page title="寻找今天的美味">
      <View style={{ padding: 18 }}>
        <View style={[ui.row, ui.input, { paddingVertical: 5 }]}>
          <Icon name="search-outline" size={18} color={colors.muted} />
          <TextInput
            accessibilityLabel="搜索菜名、标题或作者"
            value={value}
            onChangeText={setValue}
            placeholder="搜索菜名、灵感或创作者"
            returnKeyType="search"
            onSubmitEditing={() => {
              setQuery(value.trim());
              setPage(0);
            }}
            style={{ flex: 1, minHeight: 40, fontSize: 13, color: colors.ink }}
            placeholderTextColor={colors.muted}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setQuery(value.trim());
              setPage(0);
            }}
          >
            <Text style={{ fontSize: 12, color: colors.orange }}>搜索</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 35 }}
        keyboardShouldPersistTaps="handled"
      >
        {!query ? (
          <View>
            <Text style={[ui.eyebrow, { marginVertical: 20 }]}>
              A LITTLE INSPIRATION
            </Text>
            <Text style={ui.h2}>
              从一份好奇开始<Text style={ui.orange}>.</Text>
            </Text>
            <View style={[ui.row, { flexWrap: "wrap", marginTop: 20 }]}>
              {["意面", "早餐", "沙拉", "番茄"].map((q) => (
                <Pressable
                  key={q}
                  onPress={() => {
                    setValue(q);
                    setQuery(q);
                    setPage(0);
                  }}
                  style={ui.pill}
                >
                  <Text style={ui.pillText}>{q}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : loading && !data ? (
          <ActivityIndicator color={colors.orange} />
        ) : error ? (
          <Empty
            title="搜索暂时不可用"
            subtitle={error}
            button="重试"
            onPress={reload}
          />
        ) : (
          <>
            <Text style={[ui.muted, { marginBottom: 18 }]}>
              关于“{query}”的美味灵感
            </Text>
            {data?.creators.length ? (
              <>
                <Text style={[ui.h3, { marginBottom: 13 }]}>创作者</Text>
                {data.creators.map((p) => (
                  <Pressable
                    accessibilityRole="button"
                    key={p.id}
                    style={[
                      ui.row,
                      {
                        padding: 13,
                        backgroundColor: colors.softGreen,
                        borderRadius: 13,
                        marginBottom: 10,
                      },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/author/[id]",
                        params: { id: p.id },
                      })
                    }
                  >
                    <Avatar name={p.name} />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.ink,
                          fontWeight: "600",
                        }}
                      >
                        {p.name}
                      </Text>
                      <Text style={ui.muted} numberOfLines={1}>
                        {p.bio}
                      </Text>
                    </View>
                    <Icon
                      name="chevron-forward"
                      size={17}
                      color={colors.green}
                    />
                  </Pressable>
                ))}
              </>
            ) : null}
            {data?.posts.length ? (
              <View style={{ flexDirection: "row", gap: 12, marginTop: 15 }}>
                {[0, 1].map((column) => (
                  <View key={column} style={{ flex: 1 }}>
                    {data.posts
                      .map((p, i) => ({ p, i }))
                      .filter(({ i }) => i % 2 === column)
                      .map(({ p, i }) => (
                        <FoodCard key={p.id} post={p} index={i} />
                      ))}
                  </View>
                ))}
              </View>
            ) : !data?.creators.length ? (
              <Empty
                title="还没找到这份好味道"
                subtitle="换个菜名或作者昵称再试一次。"
              />
            ) : null}
            {data?.hasMore ? (
              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={() => setPage((n) => n + 1)}
                style={{ padding: 18, alignItems: "center" }}
              >
                <Text style={{ color: colors.orange }}>加载更多</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </Page>
  );
}
