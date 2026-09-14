import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Submit a myth",
  description: "Send a claim for review. Pick a country or Global. An editor reads it before it reaches the feed.",
  path: "/submit",
});

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
