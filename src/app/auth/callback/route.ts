import { NextResponse } from "next/server";
import {
  createDiagnosticContext,
  emitDiagnosticEvent,
  startDiagnosticSpan,
} from "@/lib/diagnostics";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError = searchParams.get("error");
  const context = createDiagnosticContext({
    component: "auth_callback_route",
    operation: "auth_callback",
  });
  const span = startDiagnosticSpan(context, {
    attrs: {
      hasCode: Boolean(code),
      hasProviderError: Boolean(providerError),
    },
    event: "auth_callback",
  });

  if (providerError) {
    emitDiagnosticEvent({
      ...context,
      attrs: {
        provider_error_code: providerError,
      },
      event: "auth_callback_provider_error",
      eventKind: "error",
      level: "error",
      outcome: "error",
      spanId: span.spanId,
    });

    span.end({ event: "auth_callback.finished", outcome: "error" });
    return NextResponse.redirect(
      new URL("/auth/sign-in?error=oauth_callback", origin),
    );
  }

  if (code) {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      emitDiagnosticEvent({
        ...context,
        event: "auth_callback_missing_supabase_client",
        eventKind: "error",
        level: "error",
        outcome: "error",
        spanId: span.spanId,
      });

      span.end({ event: "auth_callback.finished", outcome: "error" });
      return NextResponse.redirect(new URL("/auth/sign-in?error=config", origin));
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      emitDiagnosticEvent({
        ...context,
        attrs: {
          error_message: error.message,
        },
        event: "auth_callback_exchange_failed",
        eventKind: "error",
        level: "error",
        outcome: "error",
        spanId: span.spanId,
      });

      span.end({ event: "auth_callback.finished", outcome: "error" });
      return NextResponse.redirect(
        new URL("/auth/sign-in?error=oauth_callback", origin),
      );
    }
  }

  span.end({ event: "auth_callback.finished" });
  return NextResponse.redirect(new URL("/", origin));
}
