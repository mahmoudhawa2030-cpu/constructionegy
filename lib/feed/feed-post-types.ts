export type FeedPostItem = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  images: string[];
  location: string | null;
  view_count: number;
  created_at: string;
  author_name: string;
  author_role: string;
  is_pro: boolean;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
  savedByViewer: boolean;
};
