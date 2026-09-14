import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Admin",
  description: "Review pending claims, comments, reports, and ads.",
  path: "/admin",
  index: false,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
