import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDiagnosticContext,
  emitDiagnosticEvent,
  startDiagnosticSpan,
} from "./diagnostics";

describe("diagnostics", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emits the stable structured server log shape", () => {
    emitDiagnosticEvent({
      attrs: {
        count: 2,
        hasPhoto: true,
      },
      component: "test_component",
      event: "test.started",
      eventKind: "start",
      level: "info",
      operation: "test_operation",
      outcome: "ok",
      traceId: "trace-test",
      spanId: "span-test",
    });

    expect(infoSpy).toHaveBeenCalledOnce();
    const event = JSON.parse(String(infoSpy.mock.calls[0][0]));

    expect(event).toMatchObject({
      attrs: {
        count: 2,
        hasPhoto: true,
      },
      component: "test_component",
      event: "test.started",
      event_kind: "start",
      level: "info",
      operation: "test_operation",
      outcome: "ok",
      redaction: {
        classification: "operational",
        contains_raw_user_content: false,
        safe_to_commit: true,
      },
      schema_version: 1,
      span_id: "span-test",
      trace_id: "trace-test",
    });
    expect(event.elapsed_ms).toEqual(expect.any(Number));
    expect(event.seq).toEqual(expect.any(Number));
    expect(event.ts).toEqual(expect.any(String));
  });

  it("sanitizes unsafe diagnostic attributes by default", () => {
    emitDiagnosticEvent({
      attrs: {
        empty: undefined,
        hasListingUrl: true,
        latitude: 35.6812,
        listingUrl: "https://example.test/item?token=secret",
        nested: { safe: false },
        notes: "private note",
        photoDataUrl: "data:image/jpeg;base64,abc",
        safeLabel: "log-1",
        supabaseAnonKey: "secret",
      },
      component: "test_component",
      event: "test.redaction",
      eventKind: "point",
      level: "warn",
      operation: "test_operation",
      traceId: "trace-test",
      spanId: "span-test",
    });

    expect(warnSpy).toHaveBeenCalledOnce();
    const event = JSON.parse(String(warnSpy.mock.calls[0][0]));

    expect(event.attrs).toEqual({
      hasListingUrl: true,
      latitude: "[redacted]",
      listingUrl: "https://example.test/item",
      nested: "[redacted:non_scalar]",
      notes: "[redacted]",
      photoDataUrl: "[redacted]",
      safeLabel: "log-1",
      supabaseAnonKey: "[redacted]",
    });
  });

  it("redacts entity IDs and error-message content", () => {
    emitDiagnosticEvent({
      attrs: {
        error_message: 'invalid input syntax for type uuid: "not-a-real-id"',
        itemId: "not-a-real-id",
        logId: "a3cb9b5c-9e41-42cb-a784-2d717ab1c1de",
      },
      component: "test_component",
      event: "test.redaction",
      eventKind: "point",
      level: "error",
      operation: "test_operation",
      traceId: "trace-test",
      spanId: "span-test",
    });

    expect(errorSpy).toHaveBeenCalledOnce();
    const event = JSON.parse(String(errorSpy.mock.calls[0][0]));

    expect(event.attrs).toEqual({
      error_message: "[redacted:error_message]",
      itemId: "[redacted:id]",
      logId: "[redacted:id]",
    });
  });

  it("creates correlated spans with duration on end and error events", () => {
    const context = createDiagnosticContext({
      component: "price_log_action",
      operation: "create",
      traceId: "trace-create",
    });
    const span = startDiagnosticSpan(context, {
      event: "price_log_create",
      attrs: { hasPhoto: false },
    });

    span.end({ attrs: { inserted: true } });
    span.error(new Error("insert failed"));

    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledOnce();

    const started = JSON.parse(String(infoSpy.mock.calls[0][0]));
    const ended = JSON.parse(String(infoSpy.mock.calls[1][0]));
    const failed = JSON.parse(String(errorSpy.mock.calls[0][0]));

    expect(started).toMatchObject({
      event: "price_log_create.started",
      event_kind: "start",
      outcome: "ok",
      trace_id: "trace-create",
    });
    expect(ended).toMatchObject({
      attrs: { inserted: true },
      event: "price_log_create.finished",
      event_kind: "end",
      outcome: "ok",
      span_id: started.span_id,
      trace_id: "trace-create",
    });
    expect(ended.duration_ms).toEqual(expect.any(Number));
    expect(failed).toMatchObject({
      attrs: { error_message: "[redacted:error_message]" },
      event: "price_log_create.failed",
      event_kind: "error",
      outcome: "error",
      span_id: started.span_id,
      trace_id: "trace-create",
    });
    expect(failed.duration_ms).toEqual(expect.any(Number));
  });

  it("uses a span-level parent span ID when provided", () => {
    const context = createDiagnosticContext({
      component: "price_log_action",
      operation: "create",
      traceId: "trace-create",
    });
    const span = startDiagnosticSpan(context, {
      event: "price_log_create",
      parentSpanId: "span-parent",
    });

    span.end();

    const started = JSON.parse(String(infoSpy.mock.calls[0][0]));
    const ended = JSON.parse(String(infoSpy.mock.calls[1][0]));

    expect(started.parent_span_id).toBe("span-parent");
    expect(ended.parent_span_id).toBe("span-parent");
  });
});
