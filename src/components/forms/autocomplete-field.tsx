"use client";

import { useDeferredValue, useId, useMemo, useRef, useState } from "react";

export type AutocompleteOption = {
  hint?: string;
  id: string;
  label: string;
};

type AutocompleteFieldProps = {
  defaultOptionId?: string;
  disabled?: boolean;
  error?: string;
  label: string;
  name: string;
  onClear?: () => void;
  onCommit?: (option: AutocompleteOption) => void;
  onSelect?: (option: AutocompleteOption | null) => void;
  options: AutocompleteOption[];
  showClearButton?: boolean;
  placeholder?: string;
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

export function AutocompleteField({
  defaultOptionId,
  disabled,
  error,
  label,
  name,
  onClear,
  onCommit,
  onSelect,
  options,
  showClearButton,
  placeholder,
}: AutocompleteFieldProps) {
  const inputId = useId();
  const listId = useId();
  const defaultOption = resolveDefaultOption(options, defaultOptionId);
  const [query, setQuery] = useState(defaultOption?.label ?? "");
  const [selectedId, setSelectedId] = useState(defaultOption?.id ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  function selectOption(option: AutocompleteOption, shouldCommit?: boolean) {
    setQuery(option.label);
    setSelectedId(option.id);
    setIsOpen(false);
    setHighlightedIndex(0);
    onSelect?.(option);

    if (shouldCommit) {
      onCommit?.(option);
    }
  }

  function clearSelection() {
    setQuery("");
    setSelectedId("");
    setIsOpen(true);
    setHighlightedIndex(0);
    onSelect?.(null);
    onClear?.();
    inputRef.current?.focus();
  }

  return (
    <label className="form-field autocomplete-field">
      <span>{label}</span>
      <input name={name} type="hidden" value={selectedId} />
      <div className={`autocomplete ${isOpen ? "is-open" : ""}`}>
        <div className="autocomplete__input-wrap">
          <input
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={isOpen}
            aria-invalid={error ? "true" : "false"}
            autoComplete="off"
            className="input autocomplete__input"
            disabled={disabled}
            id={inputId}
            onBlur={() => {
              window.setTimeout(() => setIsOpen(false), 100);
            }}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setIsOpen(true);
              setHighlightedIndex(0);

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
                    ? Math.min(currentIndex + 1, Math.max(filteredOptions.length - 1, 0))
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
                    : Math.max(filteredOptions.length - 1, 0),
                );
                return;
              }

              if (event.key === "Escape") {
                setIsOpen(false);
                return;
              }

              if (event.key === "Enter") {
                const optionToCommit =
                  filteredOptions[highlightedIndex] ??
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
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>
        {isOpen && filteredOptions.length > 0 ? (
          <div className="autocomplete__menu" id={listId} role="listbox">
            {filteredOptions.map((option, index) => (
              <button
                aria-selected={option.id === selectedId || index === highlightedIndex}
                className={`autocomplete__option ${
                  option.id === selectedId || index === highlightedIndex
                    ? "is-selected"
                    : ""
                }`}
                key={option.id}
                onClick={() => {
                  selectOption(option, true);
                }}
                onPointerDown={(event) => {
                  event.preventDefault();
                }}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {option.hint ? <span className="autocomplete__hint">{option.hint}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
