export type MythVerdict = "TRUE" | "FALSE" | "PARTIALLY_TRUE" | "UNCERTAIN";

export type Myth = {
  id: string;
  title: string;
  slug: string;
  verdict: MythVerdict;
  explanation: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  countryCode: string | null;
  isAdult?: boolean;
  category: { id: string; name: string; slug: string } | null;
  creator: { id: string | null; displayName: string; avatarUrl: string | null };
  sources: { id: string; title: string | null; url: string }[];
  stats: {
    trueCount: number;
    falseCount: number;
    truePercent: number;
    falsePercent: number;
    responseCount: number;
    authenticatedCount: number;
    anonymousCount: number;
    commentCount: number;
  };
  myVote: "TRUE" | "FALSE" | null;
};

export type RelatedMyth = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: { id: string; name: string; slug: string } | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Advertisement = {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string | null;
    displayName: string;
    avatarUrl: string | null;
  };
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  country_code: string | null;
  default_category_id: string | null;
  default_category: { id: string; name: string; slug: string } | null;
};

export type MeResponse = {
  authMode: string;
  user: { id: string; email?: string; role?: string } | null;
  profile: Profile | null;
};

export type FeedItem =
  | { kind: "myth"; myth: Myth }
  | { kind: "ad"; ad: Advertisement };
