import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const providerErrorDescription = searchParams.get("error_description");

  if (providerError) {
    console.error("Auth callback provider error", {
      description: providerErrorDescription,
      error: providerError,
      event: "auth_callback_provider_error",
      origin,
    });

    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oauth_callback", origin),
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      console.error("Auth callback missing Supabase client", {
        event: "auth_callback_missing_supabase_client",
        origin,
      });

      return NextResponse.redirect(new URL("/auth/sign-in?error=config", origin));
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback session exchange failed", {
        error: error.message,
        event: "auth_callback_exchange_failed",
        origin,
      });

      return NextResponse.redirect(
        new URL("/auth/sign-in?error=oauth_callback", origin),
      );
    }
  }

  return NextResponse.redirect(new URL("/", origin));
}
