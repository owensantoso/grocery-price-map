import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getItems, getStores, getViewer } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Grocery Price Map",
  description: "Track and compare grocery prices by store location.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [viewer, items, stores] = await Promise.all([getViewer(), getItems(), getStores()]);
  const configured = isSupabaseConfigured();

  return (
    <html lang="en">
      <body>
        <AppShell configured={configured} items={items} stores={stores} viewer={viewer}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
