export type Profile = {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  followers: number;
  following: number;
  followed: boolean;
};
export type Ingredient = { name: string; amount: string };
export type Step = { text: string; image?: string };
export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  name: string;
  text: string;
  parentId: string | null;
  createdAt: number;
};
export type Post = {
  id: string;
  authorId: string;
  type: "work" | "recipe";
  title: string;
  body: string;
  images: string[];
  ingredients: Ingredient[];
  steps: Step[];
  servings: string;
  tag: string;
  createdAt: number;
  name: string;
  avatar: string;
  likes: number;
  favorites: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
  followed: boolean;
  demo?: boolean;
};
export type FeedData = {
  me: Profile | null;
  posts: Post[];
  creators: Profile[];
  profile: Profile | null;
  hasMore: boolean;
};
