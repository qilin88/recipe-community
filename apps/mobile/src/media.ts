import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Manipulator from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import { type Asset, requestJSON } from "./api";
export async function pickImages(limit: number): Promise<Asset[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    quality: 0.85,
    base64: false,
  });
  if (result.canceled) return [];
  if (result.assets.length > limit)
    throw new Error(`最多还可以添加${limit}张图片`);
  const images: Asset[] = [];
  for (const asset of result.assets) {
    const context = Manipulator.ImageManipulator.manipulate(asset.uri);
    if (Math.max(asset.width, asset.height) > 1800) {
      const scale = 1800 / Math.max(asset.width, asset.height);
      context.resize({
        width: Math.round(asset.width * scale),
        height: Math.round(asset.height * scale),
      });
    }
    const image = await context.renderAsync();
    const converted = await image.saveAsync({
      format: Manipulator.SaveFormat.JPEG,
      compress: 0.85,
    });
    let uri = converted.uri,
      size: number;
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      size = blob.size;
      uri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("图片读取失败"));
        reader.readAsDataURL(blob);
      });
    } else {
      const source = new File(uri);
      size = source.size;
      const destination = new File(
        Paths.document,
        Crypto.randomUUID() + ".jpg",
      );
      source.copy(destination);
      uri = destination.uri;
    }
    if (size > 5 * 1024 * 1024)
      throw new Error("转换后的图片仍超过5MB，请选择更小的图片");
    images.push({
      uri,
      name: Crypto.randomUUID() + ".jpg",
      mimeType: "image/jpeg",
      size,
    });
  }
  return images;
}
export async function uploadAsset(
  base: string,
  token: string | null,
  asset: Asset,
) {
  if (!base) return asset.uri;
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    form.append("file", blob, asset.name);
  } else
    form.append("file", {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType,
    } as unknown as Blob);
  const result = await requestJSON<{ url: string }>(
    base,
    "/api/community",
    token,
    form,
  );
  return result.url;
}
