import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Profile",
  description: "Your MYTHH votes, submissions, and saved country and topic defaults.",
  path: "/profile",
  index: false,
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
