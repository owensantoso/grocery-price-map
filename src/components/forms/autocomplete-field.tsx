"use client";

import {
  forwardRef,
  useDeferredValue,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDebugFlag } from "@/components/debug/use-debug-flag";

export type AutocompleteOption = {
  hint?: string;
  id: string;
  kind?: "item" | "store";
  kindLabel?: string;
  label: string;
};

type AutocompleteFieldProps = {
  autoFocus?: boolean;
  createActionLabel?: string;
  defaultOptionId?: string;
  disabled?: boolean;
  error?: string;
  label: string;
  name: string;
  onCreateAction?: (query: string) => void;
  onClear?: () => void;
  onCommit?: (option: AutocompleteOption) => void;
  onSelect?: (option: AutocompleteOption | null) => void;
  options: AutocompleteOption[];
  showClearButton?: boolean;
  placeholder?: string;
};

export type AutocompleteFieldHandle = {
  clearAndFocus: () => void;
  focus: () => void;
};

function resolveDefaultOption(
  options: AutocompleteOption[],
  defaultOptionId?: string,
) {
  if (!defaultOptionId) {
    return null;
  }

  return options.find((option) => option.id === defaultOptionId) ?? null;
}

function bindMediaQuery(
  mediaQuery: MediaQueryList,
  listener: () => void,
) {
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
}

function getOptionElementId(listId: string, optionId: string) {
  return `${listId}-option-${optionId}`;
}

function getCreateActionElementId(listId: string) {
  return `${listId}-create`;
}

export const AutocompleteField = forwardRef<AutocompleteFieldHandle, AutocompleteFieldProps>(function AutocompleteField({
  autoFocus = false,
  createActionLabel,
  defaultOptionId,
  disabled,
  error,
  label,
  name,
  onCreateAction,
  onClear,
  onCommit,
  onSelect,
  options,
  showClearButton,
  placeholder,
}, ref) {
  const inputId = useId();
  const listId = useId();
  const defaultOption = resolveDefaultOption(options, defaultOptionId);
  const [query, setQuery] = useState(defaultOption?.label ?? "");
  const [selectedId, setSelectedId] = useState(defaultOption?.id ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isTouchLayout, setIsTouchLayout] = useState(false);
  const [clearCount, setClearCount] = useState(0);
  const [lastAction, setLastAction] = useState("idle");
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debugEnabled = useDebugFlag();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 720px), (pointer: coarse)");
    const update = () => setIsTouchLayout(mediaQuery.matches);
    update();

    return bindMediaQuery(mediaQuery, update);
  }, []);

  useEffect(() => {
    if (!autoFocus || isTouchLayout) {
      return;
    }

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [autoFocus, isTouchLayout]);

  const filteredOptions = useMemo(() => {
    const trimmedQuery = deferredQuery.trim().toLowerCase();

    if (!trimmedQuery) {
      return options.slice(0, 8);
    }

    return options
      .filter((option) => {
        const haystack = `${option.label} ${option.hint ?? ""}`.toLowerCase();
        return haystack.includes(trimmedQuery);
      })
      .slice(0, 8);
  }, [deferredQuery, options]);

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const showCreateAction =
    Boolean(onCreateAction && createActionLabel) &&
    trimmedQuery.length > 0 &&
    !hasExactMatch;
  const activeItemCount = filteredOptions.length + (showCreateAction ? 1 : 0);
  const boundedHighlightedIndex = Math.min(
    highlightedIndex,
    Math.max(activeItemCount - 1, 0),
  );
  const activeDescendantId =
    isOpen && activeItemCount > 0
      ? boundedHighlightedIndex < filteredOptions.length
        ? getOptionElementId(listId, filteredOptions[boundedHighlightedIndex]!.id)
        : getCreateActionElementId(listId)
      : undefined;

  function selectOption(option: AutocompleteOption, shouldCommit?: boolean) {
    setQuery(option.label);
    setSelectedId(option.id);
    setIsOpen(false);
    setHighlightedIndex(0);
    setLastAction(`selected:${option.id}${shouldCommit ? ":commit" : ""}`);
    onSelect?.(option);

    if (shouldCommit) {
      if (isTouchLayout) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            onCommit?.(option);
          });
        });
      } else {
        onCommit?.(option);
      }
    }
  }

  function clearSelection() {
    setQuery("");
    setSelectedId("");
    setIsOpen(true);
    setHighlightedIndex(0);
    setClearCount((count) => count + 1);
    setLastAction("clear");
    onSelect?.(null);
    onClear?.();
    inputRef.current?.focus();
  }

  useImperativeHandle(ref, () => ({
    clearAndFocus() {
      clearSelection();
    },
    focus() {
      inputRef.current?.focus();
    },
  }));

  return (
    <div className="form-field autocomplete-field">
      <label htmlFor={inputId}>{label}</label>
      <input name={name} type="hidden" value={selectedId} />
      <div className={`autocomplete ${isOpen ? "is-open" : ""}`}>
        <div className="autocomplete__input-wrap">
          <input
            aria-autocomplete="list"
            aria-activedescendant={activeDescendantId}
            aria-controls={listId}
            aria-expanded={isOpen}
            aria-invalid={error ? "true" : "false"}
            autoComplete="off"
            autoFocus={autoFocus && !isTouchLayout}
            className="input autocomplete__input"
            disabled={disabled}
            id={inputId}
            onBlur={() => {
              if (isTouchLayout) {
                return;
              }

              window.setTimeout(() => setIsOpen(false), 100);
            }}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setIsOpen(true);
              setHighlightedIndex(0);
              setLastAction(`change:${nextQuery}`);

              const exactMatch =
                options.find((option) => option.label.toLowerCase() === nextQuery.trim().toLowerCase()) ??
                null;

              setSelectedId(exactMatch?.id ?? "");
              onSelect?.(exactMatch);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIsOpen(true);
                setHighlightedIndex((currentIndex) =>
                  isOpen
                    ? Math.min(currentIndex + 1, Math.max(activeItemCount - 1, 0))
                    : 0,
                );
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setIsOpen(true);
                setHighlightedIndex((currentIndex) =>
                  isOpen
                    ? Math.max(currentIndex - 1, 0)
                    : Math.max(activeItemCount - 1, 0),
                );
                return;
              }

              if (event.key === "Escape") {
                setIsOpen(false);
                return;
              }

              if (event.key === "Enter") {
                const isCreateActionActive =
                  showCreateAction && boundedHighlightedIndex >= filteredOptions.length;

                if (isCreateActionActive) {
                  event.preventDefault();
                  onCreateAction?.(trimmedQuery);
                  return;
                }

                const optionToCommit =
                  filteredOptions[boundedHighlightedIndex] ??
                  options.find(
                    (option) => option.label.toLowerCase() === query.trim().toLowerCase(),
                  ) ??
                  null;

                if (optionToCommit) {
                  event.preventDefault();
                  selectOption(optionToCommit, true);
                }
              }
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            ref={inputRef}
            role="combobox"
            type="text"
            value={query}
          />
          {showClearButton && query ? (
            <button
              aria-label={`Clear ${label}`}
              className="autocomplete__clear"
              onClick={() => clearSelection()}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
        {isOpen && filteredOptions.length > 0 ? (
          <div
            className={`autocomplete__menu ${isTouchLayout ? "autocomplete__menu--inline" : ""}`}
            id={listId}
            role="listbox"
          >
            {filteredOptions.map((option, index) => (
              <button
                aria-selected={option.id === selectedId}
                className={`autocomplete__option ${
                  option.id === selectedId || index === boundedHighlightedIndex
                    ? "is-selected"
                    : ""
                }`}
                id={getOptionElementId(listId, option.id)}
                key={option.id}
                onClick={() => {
                  selectOption(option, true);
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                role="option"
                type="button"
              >
                <span className="autocomplete__label-group">
                  {option.kindLabel ? (
                    <span
                      className={`autocomplete__kind autocomplete__kind--${option.kind ?? "item"}`}
                    >
                      {option.kindLabel}
                    </span>
                  ) : null}
                  <span>{option.label}</span>
                </span>
                {option.hint ? <span className="autocomplete__hint">{option.hint}</span> : null}
              </button>
            ))}
            {showCreateAction ? (
              <button
                aria-selected={boundedHighlightedIndex >= filteredOptions.length}
                className={`autocomplete__option autocomplete__option--create ${
                  boundedHighlightedIndex >= filteredOptions.length ? "is-selected" : ""
                }`}
                id={getCreateActionElementId(listId)}
                onClick={() => onCreateAction?.(trimmedQuery)}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                role="option"
                type="button"
              >
                <span>
                  Add new {createActionLabel} &quot;{trimmedQuery}&quot;
                </span>
                <span className="autocomplete__create-icon">+</span>
              </button>
            ) : null}
          </div>
        ) : isOpen && showCreateAction ? (
          <div
            className={`autocomplete__menu ${isTouchLayout ? "autocomplete__menu--inline" : ""}`}
            id={listId}
            role="listbox"
          >
            <button
              aria-selected
              className="autocomplete__option autocomplete__option--create is-selected"
              id={getCreateActionElementId(listId)}
              onClick={() => onCreateAction?.(trimmedQuery)}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              role="option"
              type="button"
            >
              <span>
                Add new {createActionLabel} &quot;{trimmedQuery}&quot;
              </span>
              <span className="autocomplete__create-icon">+</span>
            </button>
          </div>
        ) : null}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
      {debugEnabled ? (
        <div className="debug-panel">
          <strong>Autocomplete debug: {label}</strong>
          <span>query: {query || "(empty)"}</span>
          <span>selectedId: {selectedId || "(none)"}</span>
          <span>isOpen: {String(isOpen)}</span>
          <span>filteredOptions: {filteredOptions.length}</span>
          <span>highlightedIndex: {highlightedIndex}</span>
          <span>isTouchLayout: {String(isTouchLayout)}</span>
          <span>clearCount: {clearCount}</span>
          <span>lastAction: {lastAction}</span>
          <span>showClearButton: {String(Boolean(showClearButton && query))}</span>
        </div>
      ) : null}
    </div>
  );
});
