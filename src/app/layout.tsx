import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getViewer } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata: Metadata = {
  title: "Grocery Price Map",
  description: "Track and compare grocery prices by store location.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await getViewer();
  const configured = isSupabaseConfigured();

  return (
    <html lang="en">
      <body>
        <AppShell viewer={viewer} configured={configured}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
