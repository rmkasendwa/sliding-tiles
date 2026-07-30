'use client';

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  size,
  useFloating,
} from '@floating-ui/react';
import { Check, ChevronDown, LoaderCircle, X } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

export type DropdownOption<T extends string | number = string> = {
  label: string;
  value: T;
  metadata?: string;
  disabled?: boolean;
};

type SearchableDropdownProps<T extends string | number> = {
  'aria-label'?: string;
  className?: string;
  clearable?: boolean;
  defaultValue?: T;
  disabled?: boolean;
  emptyMessage?: string;
  error?: string;
  id?: string;
  loading?: boolean;
  loadingMessage?: string;
  name?: string;
  onChange?: (value: T | undefined, option?: DropdownOption<T>) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  searchPlaceholder?: string;
  value?: T;
};

function valuesMatch(
  left: string | number | undefined,
  right: string | number | undefined,
) {
  return left !== undefined && right !== undefined && String(left) === String(right);
}

export function SearchableDropdown<T extends string | number>({
  'aria-label': ariaLabel,
  className = '',
  clearable = false,
  defaultValue,
  disabled = false,
  emptyMessage = 'No options found',
  error,
  id,
  loading = false,
  loadingMessage = 'Loading options…',
  name,
  onChange,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Type to search…',
  value,
}: SearchableDropdownProps<T>) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-input`;
  const listboxId = `${inputId}-listbox`;
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<T | undefined>(defaultValue);
  const selectedValue = isControlled ? value : internalValue;
  const selectedOption = options.find((option) =>
    valuesMatch(option.value, selectedValue),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { floatingStyles, refs } = useFloating({
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ availableHeight, rects, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.min(288, availableHeight)}px`,
            width: `${rects.reference.width}px`,
          });
        },
        padding: 8,
      }),
    ],
    onOpenChange: setIsOpen,
    open: isOpen,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
  });
  const { floating: floatingElementRef, setFloating, setReference } = refs;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      `${option.label} ${option.metadata ?? ''}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideInteraction = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !floatingElementRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideInteraction);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsideInteraction);
  }, [floatingElementRef, isOpen]);

  useEffect(() => {
    if (isOpen) searchInputRef.current?.focus();
  }, [isOpen]);

  const openDropdown = () => {
    const selectedIndex = options.findIndex((option) =>
      valuesMatch(option.value, selectedValue),
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : options.length ? 0 : -1);
    setIsOpen(true);
  };

  const selectOption = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    if (!isControlled) setInternalValue(option.value);
    onChange?.(option.value, option);
    setQuery('');
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const clearSelection = () => {
    if (!isControlled) setInternalValue(undefined);
    onChange?.(undefined);
    setQuery('');
    triggerRef.current?.focus();
  };

  const moveActive = (direction: 1 | -1) => {
    if (!filteredOptions.length) return;
    let nextIndex = activeIndex;
    for (let index = 0; index < filteredOptions.length; index += 1) {
      nextIndex =
        (nextIndex + direction + filteredOptions.length) %
        filteredOptions.length;
      if (!filteredOptions[nextIndex]?.disabled) {
        setActiveIndex(nextIndex);
        return;
      }
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setQuery('');
        triggerRef.current?.focus();
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) openDropdown();
      moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
      } else if (activeIndex >= 0) {
        const option = filteredOptions[activeIndex];
        if (option) selectOption(option);
      }
      return;
    }

    if (event.key === 'Home' && isOpen) {
      event.preventDefault();
      const firstEnabled = filteredOptions.findIndex((option) => !option.disabled);
      setActiveIndex(firstEnabled);
    }

    if (event.key === 'End' && isOpen) {
      event.preventDefault();
      let lastEnabled = -1;
      for (let index = filteredOptions.length - 1; index >= 0; index -= 1) {
        if (!filteredOptions[index]?.disabled) {
          lastEnabled = index;
          break;
        }
      }
      setActiveIndex(lastEnabled);
    }
  };

  const activeOption = filteredOptions[activeIndex];
  const activeDescendant =
    isOpen && activeOption ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className={`relative min-w-0 ${className}`} ref={rootRef}>
      {name ? (
        <input
          name={name}
          type="hidden"
          value={selectedValue === undefined ? '' : String(selectedValue)}
        />
      ) : null}
      <div className="relative" ref={setReference}>
        <button
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          className="min-h-11 w-full min-w-0 cursor-pointer truncate rounded-[7px] border border-line bg-panel py-2 pl-3 pr-16 text-left text-base text-foreground outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
          data-dropdown-trigger
          disabled={disabled}
          id={inputId}
          onClick={() => {
            if (!disabled) {
              setQuery('');
              if (isOpen) setIsOpen(false);
              else openDropdown();
            }
          }}
          onKeyDown={(event) => {
            if (
              event.key === 'ArrowDown' ||
              event.key === 'ArrowUp' ||
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault();
              openDropdown();
              return;
            }

            if (
              event.key.length === 1 &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              event.preventDefault();
              setQuery(event.key);
              setActiveIndex(0);
              setIsOpen(true);
            }
          }}
          ref={triggerRef}
          type="button"
        >
          <span className={selectedOption ? '' : 'text-muted'}>
            {selectedOption?.label ?? placeholder}
          </span>
        </button>
        {clearable && selectedOption && !disabled ? (
          <button
            aria-label="Clear selection"
            className="absolute right-8 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted hover:bg-accent/10 hover:text-foreground"
            onClick={clearSelection}
            type="button"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
        <button
          aria-label={isOpen ? 'Close options' : 'Open options'}
          className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted disabled:cursor-not-allowed"
          disabled={disabled}
          onClick={() => {
            const nextOpen = !isOpen;
            triggerRef.current?.focus();
            setIsOpen(nextOpen);
            setQuery('');
          }}
          tabIndex={-1}
          type="button"
        >
          <ChevronDown
            aria-hidden="true"
            className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {isOpen ? (
        <FloatingPortal>
          <div
            className="z-[100] min-w-[12rem] overflow-y-auto overscroll-contain rounded-lg border border-line bg-panel p-1 shadow-panel"
            ref={setFloating}
            style={floatingStyles}
          >
            <div className="sticky top-0 z-10 bg-panel p-1">
              <input
                aria-activedescendant={activeDescendant}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-expanded="true"
                aria-invalid={Boolean(error)}
                aria-label={`Search ${ariaLabel ?? 'options'}`}
                className="min-h-10 w-full rounded-md border border-line bg-surface px-3 text-base text-foreground outline-none placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                ref={searchInputRef}
                role="combobox"
                value={query}
              />
            </div>
            <div id={listboxId} role="listbox">
              {loading ? (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted" role="status">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  {loadingMessage}
                </div>
              ) : error ? (
                <div className="px-3 py-2.5 text-sm font-bold text-danger" role="alert">
                  {error}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-3 py-2.5 text-sm text-muted" role="status">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = valuesMatch(option.value, selectedValue);
                  const isActive = index === activeIndex;
                  return (
                    <div
                      aria-disabled={option.disabled || undefined}
                      aria-selected={isSelected}
                      className={[
                        'flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm',
                        isActive ? 'bg-accent/12 text-accent-strong' : 'text-foreground',
                        option.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-accent/8',
                      ].join(' ')}
                      id={`${listboxId}-option-${index}`}
                      key={String(option.value)}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectOption(option)}
                      role="option"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{option.label}</span>
                        {option.metadata ? (
                          <span className="block truncate text-xs text-muted">
                            {option.metadata}
                          </span>
                        ) : null}
                      </span>
                      {isSelected ? (
                        <Check aria-hidden="true" className="size-4 shrink-0 text-accent" />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
