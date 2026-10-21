import type { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const development = process.env.APP_VARIANT === "development";
  return {
    ...config,
    name: config.name || "食光",
    slug: config.slug || "shiguang-mobile",
    plugins: [
      ...(config.plugins || []).filter(
        (p) => (Array.isArray(p) ? p[0] : p) !== "expo-build-properties",
      ),
      [
        "expo-build-properties",
        { android: { usesCleartextTraffic: development } },
      ],
    ],
  };
};
