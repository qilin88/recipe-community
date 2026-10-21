import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { View, Text } from "react-native";
import * as Crypto from "expo-crypto";
import {
  initialState,
  mutateDemo,
  selectDemo,
  validateApiUrl,
  SessionGate,
  type DemoState,
  type Query,
} from "./domain";
import type { Profile, FeedData } from "./types";
import { AsyncStorage, storeKeys, readToken, saveToken } from "./storage";
import { remoteFeed, remoteComments, requestJSON } from "./api";
import { signInToServer } from "./auth";
import { colors } from "./theme";
const Context = createContext<ReturnType<typeof useAppState> | null>(null);
const identity = (base: string, token: string | null) =>
  JSON.stringify([base, token]);
function useAppState() {
  const [ready, setReady] = useState(false),
    [base, setBase] = useState(""),
    [token, setToken] = useState<string | null>(null),
    [revision, setRevision] = useState(0),
    [session, setSession] = useState(0),
    [me, setMe] = useState<Profile | null>(null),
    [toast, setToast] = useState(""),
    [bootError, setBootError] = useState("");
  const local = useRef<DemoState>(initialState()),
    queue = useRef<Promise<unknown>>(Promise.resolve()),
    gate = useRef(new SessionGate()),
    credentials = useRef<string | null>(identity("", null));
  const notify = useCallback((message: string) => setToast(message), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [settings, data] = await Promise.all([
          AsyncStorage.getItem(storeKeys.config),
          AsyncStorage.getItem(storeKeys.demo),
        ]);
        if (data) {
          const parsed = JSON.parse(data);
          if (
            parsed.version !== 1 ||
            !Array.isArray(parsed.posts) ||
            !Array.isArray(parsed.profiles)
          )
            throw new Error("本机体验数据格式无效");
          local.current = parsed;
        }
        const configured = settings
            ? JSON.parse(settings).base || ""
            : process.env.EXPO_PUBLIC_API_URL || "",
          b = configured ? validateApiUrl(configured, __DEV__) : "",
          t = b ? await readToken(b) : null;
        if (!active) return;
        credentials.current = identity(b, t);
        setBase(b);
        setToken(t);
        if (!b) setMe(selectDemo(local.current, {}).me);
      } catch (e) {
        if (active)
          setBootError(e instanceof Error ? e.message : "读取设置失败");
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const feed = useCallback(
    async (q: Query): Promise<FeedData> =>
      base ? remoteFeed(base, token, q) : selectDemo(local.current, q),
    [base, token],
  );
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const generation = gate.current.current(),
      key = identity(base, token);
    feed({})
      .then((d) => {
        if (
          active &&
          gate.current.accepts(generation) &&
          credentials.current === key
        )
          setMe(d.me);
      })
      .catch(() => {
        /* Feed screen displays network failures. */
      });
    return () => {
      active = false;
    };
  }, [ready, base, token, feed, revision]);
  const mutate = useCallback(
    async (input: Record<string, unknown>) => {
      const key = identity(base, token),
        generation = gate.current.current();
      if (base) {
        await requestJSON(base, "/api/community", token, input);
        if (gate.current.accepts(generation)) setRevision((n) => n + 1);
        return;
      }
      const run = queue.current
        .catch(() => {})
        .then(async () => {
          const next = mutateDemo(local.current, input, Crypto.randomUUID());
          await AsyncStorage.setItem(storeKeys.demo, JSON.stringify(next));
          local.current = next;
          if (gate.current.accepts(generation) && credentials.current === key) {
            setMe(selectDemo(next, {}).me);
            setRevision((n) => n + 1);
          }
        });
      queue.current = run;
      await run;
    },
    [base, token],
  );
  const comments = useCallback(
    async (postId: string, page = 0) => {
      if (base) return remoteComments(base, token, postId, page);
      const all = local.current.comments
        .filter((c) => c.postId === postId)
        .sort((a, b) => b.createdAt - a.createdAt);
      return {
        comments: all
          .slice(page * 50, (page + 1) * 50)
          .reverse()
          .map((c) => ({
            ...c,
            name:
              local.current.profiles.find((p) => p.id === c.authorId)?.name ||
              c.name,
          })),
        hasMore: all.length > (page + 1) * 50,
      };
    },
    [base, token],
  );
  const configure = useCallback(async (b: string) => {
    gate.current.advance();
    credentials.current = null;
    setMe(null);
    setSession((n) => n + 1);
    const t = b ? await readToken(b) : null;
    await AsyncStorage.setItem(storeKeys.config, JSON.stringify({ base: b }));
    credentials.current = identity(b, t);
    setBase(b);
    setToken(t);
    setRevision((n) => n + 1);
  }, []);
  const login = useCallback(async () => {
    if (base) {
      const t = await signInToServer(base);
      await saveToken(base, t);
      gate.current.advance();
      credentials.current = identity(base, t);
      setMe(null);
      setToken(t);
    } else {
      const next = { ...local.current, signedIn: true };
      await AsyncStorage.setItem(storeKeys.demo, JSON.stringify(next));
      local.current = next;
      gate.current.advance();
      credentials.current = identity("", null);
      setMe(selectDemo(next, {}).me);
    }
    setSession((n) => n + 1);
    setRevision((n) => n + 1);
  }, [base]);
  const logout = useCallback(async () => {
    gate.current.advance();
    credentials.current = null;
    setMe(null);
    setSession((n) => n + 1);
    if (base) {
      try {
        if (token)
          await requestJSON(base, "/api/mobile/session", token, {
            action: "revoke",
          });
      } catch {
        notify("已清除本机登录；远程会话撤销失败，将在有效期结束时失效");
      } finally {
        await saveToken(base, null);
        credentials.current = identity(base, null);
        setToken(null);
      }
    } else {
      const next = { ...local.current, signedIn: false };
      await AsyncStorage.setItem(storeKeys.demo, JSON.stringify(next));
      local.current = next;
      credentials.current = identity("", null);
    }
    setRevision((n) => n + 1);
  }, [base, token, notify]);
  return {
    ready,
    base,
    token,
    revision,
    sourceKey: base + "@" + session,
    me,
    toast,
    notify,
    bootError,
    feed,
    mutate,
    comments,
    configure,
    login,
    logout,
  };
}
export function AppProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  return (
    <Context.Provider value={state}>
      {children}
      {state.toast ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 95,
            left: 25,
            right: 25,
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <View
            style={{
              backgroundColor: colors.ink,
              borderRadius: 14,
              padding: 15,
              maxWidth: 440,
            }}
          >
            <Text
              accessibilityLiveRegion="polite"
              style={{ color: "white", fontSize: 13, lineHeight: 22 }}
            >
              {state.toast}
            </Text>
          </View>
        </View>
      ) : null}
    </Context.Provider>
  );
}
export function useApp() {
  const app = useContext(Context);
  if (!app) throw new Error("Missing AppProvider");
  return app;
}
export function useFeed(query: Query) {
  const { feed, revision, ready, sourceKey } = useApp(),
    key = JSON.stringify(query),
    [refresh, setRefresh] = useState(0);
  const identityKey =
      sourceKey + "|" + JSON.stringify({ ...query, page: undefined }),
    requestKey = identityKey + "|" + key + "|" + revision + "|" + refresh;
  const [snapshot, setSnapshot] = useState<{
    identity: string;
    request: string;
    data: FeedData | null;
    error: string;
  }>({ identity: "", request: "", data: null, error: "" });
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const q = JSON.parse(key) as Query;
    Promise.all(
      Array.from({ length: (q.page || 0) + 1 }, (_, page) =>
        feed({ ...q, page }),
      ),
    )
      .then((results) => {
        if (alive)
          setSnapshot({
            identity: identityKey,
            request: requestKey,
            data: {
              ...results[results.length - 1],
              posts: results.flatMap((r) => r.posts),
            },
            error: "",
          });
      })
      .catch((e) => {
        if (alive)
          setSnapshot({
            identity: identityKey,
            request: requestKey,
            data: null,
            error: e instanceof Error ? e.message : "加载失败",
          });
      });
    return () => {
      alive = false;
    };
  }, [key, feed, ready, identityKey, requestKey]);
  const loading = !ready || snapshot.request !== requestKey;
  return {
    data: snapshot.identity === identityKey ? snapshot.data : null,
    loading,
    error: loading ? "" : snapshot.error,
    reload: () => setRefresh((n) => n + 1),
  };
}
