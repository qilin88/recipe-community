import { useLocalSearchParams } from "expo-router";
import FeedScreen from "../../screens/FeedScreen";
export default function Author() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <FeedScreen key={id} authorId={id} />;
}
