import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

type DiagnosticLevel = "info" | "warn" | "error";
type DiagnosticEventKind = "start" | "end" | "error" | "point";
type DiagnosticOutcome = "ok" | "error" | "skipped";
type DiagnosticAttrValue = boolean | number | string | null;
type DiagnosticAttrs = Record<string, unknown>;

export type DiagnosticContext = {
  component: string;
  operation: string;
  parentSpanId?: string | null;
  traceId: string;
};

type EmitDiagnosticEventInput = DiagnosticContext & {
  attrs?: DiagnosticAttrs;
  durationMs?: number;
  event: string;
  eventKind: DiagnosticEventKind;
  level?: DiagnosticLevel;
  outcome?: DiagnosticOutcome;
  spanId: string;
};

type StartDiagnosticSpanInput = {
  attrs?: DiagnosticAttrs;
  emitStart?: boolean;
  event: string;
  parentSpanId?: string | null;
  spanId?: string;
};

type EndDiagnosticSpanInput = {
  attrs?: DiagnosticAttrs;
  event?: string;
  outcome?: DiagnosticOutcome;
};

type ErrorDiagnosticSpanInput = {
  attrs?: DiagnosticAttrs;
  event?: string;
  level?: "warn" | "error";
};

const PROCESS_STARTED_AT = performance.now();
const UNSAFE_ATTR_KEY_PATTERN =
  /(authorization|body|cookie|dataurl|email|key|latitude|longitude|location|note|password|secret|token|url)/i;
let seq = 0;

export function createDiagnosticContext(input: {
  component: string;
  operation: string;
  parentSpanId?: string | null;
  traceId?: string;
}): DiagnosticContext {
  return {
    component: input.component,
    operation: input.operation,
    parentSpanId: input.parentSpanId ?? null,
    traceId: input.traceId ?? `trace-${randomUUID()}`,
  };
}

export function startDiagnosticSpan(
  context: DiagnosticContext,
  input: StartDiagnosticSpanInput,
) {
  const spanContext = {
    ...context,
    parentSpanId: input.parentSpanId ?? context.parentSpanId ?? null,
  };
  const spanId = input.spanId ?? `span-${randomUUID()}`;
  const startedAt = performance.now();
  const event = input.event;

  if (input.emitStart !== false) {
    emitDiagnosticEvent({
      ...spanContext,
      attrs: input.attrs,
      event: `${event}.started`,
      eventKind: "start",
      level: "info",
      outcome: "ok",
      spanId,
    });
  }

  return {
    end: (endInput: EndDiagnosticSpanInput = {}) =>
      emitDiagnosticEvent({
        ...spanContext,
        attrs: endInput.attrs,
        durationMs: durationSince(startedAt),
        event: endInput.event ?? `${event}.finished`,
        eventKind: "end",
        level: "info",
        outcome: endInput.outcome ?? "ok",
        spanId,
      }),
    error: (error: unknown, errorInput: ErrorDiagnosticSpanInput = {}) =>
      emitDiagnosticEvent({
        ...spanContext,
        attrs: {
          ...errorInput.attrs,
          error_message: sanitizeErrorMessage(
            error instanceof Error ? error.message : "Unknown error",
          ),
        },
        durationMs: durationSince(startedAt),
        event: errorInput.event ?? `${event}.failed`,
        eventKind: "error",
        level: errorInput.level ?? "error",
        outcome: "error",
        spanId,
      }),
    parentSpanId: spanContext.parentSpanId ?? null,
    spanId,
    traceId: spanContext.traceId,
  };
}

export function emitDiagnosticEvent(input: EmitDiagnosticEventInput) {
  const event = {
    attrs: sanitizeDiagnosticAttrs(input.attrs ?? {}),
    component: input.component,
    duration_ms:
      typeof input.durationMs === "number" ? roundMilliseconds(input.durationMs) : undefined,
    elapsed_ms: roundMilliseconds(performance.now() - PROCESS_STARTED_AT),
    event: input.event,
    event_kind: input.eventKind,
    level: input.level ?? "info",
    operation: input.operation,
    outcome: input.outcome,
    parent_span_id: input.parentSpanId ?? null,
    redaction: {
      classification: "operational",
      contains_raw_user_content: false,
      safe_to_commit: true,
    },
    schema_version: 1,
    seq: (seq += 1),
    span_id: input.spanId,
    trace_id: input.traceId,
    ts: new Date().toISOString(),
  };
  const payload = JSON.stringify(dropUndefinedFields(event));

  if (event.level === "error") {
    console.error(payload);
  } else if (event.level === "warn") {
    console.warn(payload);
  } else {
    console.info(payload);
  }
}

function sanitizeDiagnosticAttrs(attrs: DiagnosticAttrs): Record<string, DiagnosticAttrValue> {
  return Object.fromEntries(
    Object.entries(attrs)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, sanitizeDiagnosticAttr(key, value)]),
  );
}

function sanitizeDiagnosticAttr(key: string, value: unknown): DiagnosticAttrValue {
  if (key.toLowerCase() === "error_message") {
    return typeof value === "string" ? sanitizeErrorMessage(value) : "[redacted]";
  }

  if (isEntityIdAttrKey(key)) {
    return "[redacted:id]";
  }

  if (isUnsafeAttrKey(key)) {
    if (typeof value === "boolean" && key.toLowerCase().startsWith("has")) {
      return value;
    }

    if (typeof value === "string" && /^https?:\/\//i.test(value)) {
      return stripUrlQuery(value);
    }

    return "[redacted]";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return value;
  }

  return "[redacted:non_scalar]";
}

function isEntityIdAttrKey(key: string): boolean {
  const normalizedKey = key.toLowerCase();

  return (
    normalizedKey === "id" ||
    normalizedKey.endsWith("id") ||
    normalizedKey.endsWith("_id")
  );
}

function sanitizeErrorMessage(message: string): string {
  if (!message) {
    return "Unknown error";
  }

  return "[redacted:error_message]";
}

function isUnsafeAttrKey(key: string): boolean {
  const normalizedKey = key.toLowerCase();

  return (
    UNSAFE_ATTR_KEY_PATTERN.test(normalizedKey) ||
    normalizedKey === "path" ||
    normalizedKey.endsWith("path") ||
    normalizedKey.includes("photo_path") ||
    normalizedKey.includes("photo_data")
  );
}

function stripUrlQuery(value: string): string {
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "[redacted]";
  }
}

function durationSince(startedAt: number): number {
  return performance.now() - startedAt;
}

function roundMilliseconds(value: number): number {
  return Math.round(value * 100) / 100;
}

function dropUndefinedFields<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>;
}
