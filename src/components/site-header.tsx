import { requestCategory } from "@/lib/request-category";
import { requestCountry } from "@/lib/request-country";

import { GuestPrefs } from "./guest-prefs";
import { Header } from "./header";
import { PublicIpCountry } from "./public-ip-country";

export async function SiteHeader() {
  const [country, category] = await Promise.all([requestCountry(), requestCategory()]);

  return (
    <>
      <GuestPrefs country={country} category={category ?? "all"} />
      <PublicIpCountry current={country} />
      <Header country={country} category={category ?? "all"} />
    </>
  );
}
