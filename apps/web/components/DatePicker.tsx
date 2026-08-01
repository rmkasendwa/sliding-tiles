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
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

const DATE_INPUT_FORMAT = 'MM/DD/YYYY';
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
});

type DateParts = {
  day: number;
  month: number;
  year: number;
};

export type DatePickerProps = {
  'aria-label'?: string;
  allowClear?: boolean;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
  max?: string;
  min?: string;
  name?: string;
  onChange?: (value: string | undefined) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value?: string;
};

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function dateToIso(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate(),
  )}`;
}

function parseIsoDate(value: string | undefined) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, yearValue, monthValue, dayValue] = match;
  const parts = {
    day: Number(dayValue),
    month: Number(monthValue),
    year: Number(yearValue),
  };
  return isValidDateParts(parts) ? parts : undefined;
}

function isValidDateParts({ day, month, year }: DateParts) {
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isoToDate(value: string | undefined) {
  const parts = parseIsoDate(value);
  if (!parts) return undefined;
  return new Date(parts.year, parts.month - 1, parts.day);
}

function parseDisplayDate(value: string) {
  const normalized = value.trim();
  if (!normalized) return undefined;

  const isoParts = parseIsoDate(normalized);
  if (isoParts)
    return `${isoParts.year}-${padDatePart(isoParts.month)}-${padDatePart(isoParts.day)}`;

  const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(normalized);
  if (!match) return undefined;
  const [, monthValue, dayValue, yearValue] = match;
  const parts = {
    day: Number(dayValue),
    month: Number(monthValue),
    year: Number(yearValue),
  };
  if (!isValidDateParts(parts)) return undefined;
  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

function formatDisplayDate(value: string | undefined) {
  const parts = parseIsoDate(value);
  if (!parts) return '';
  return `${padDatePart(parts.month)}/${padDatePart(parts.day)}/${parts.year}`;
}

function isIsoWithinRange(value: string, min?: string, max?: string) {
  if (min && value < min) return false;
  if (max && value > max) return false;
  return true;
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstVisible = new Date(firstOfMonth);
  firstVisible.setDate(1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisible);
    date.setDate(firstVisible.getDate() + index);
    return date;
  });
}

function moveDate(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function clampMonth(anchor: Date, min?: string, max?: string) {
  const minDate = isoToDate(min);
  const maxDate = isoToDate(max);
  let next = new Date(anchor.getFullYear(), anchor.getMonth(), 1);

  if (
    minDate &&
    next < new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  ) {
    next = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  }

  if (
    maxDate &&
    next > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  ) {
    next = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
  }

  return next;
}

export function DatePicker({
  'aria-label': ariaLabel,
  allowClear = true,
  className = '',
  defaultValue,
  disabled = false,
  error,
  id,
  max,
  min,
  name,
  onChange,
  placeholder = DATE_INPUT_FORMAT,
  readOnly = false,
  required = false,
  value,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-date`;
  const dialogId = `${inputId}-dialog`;
  const gridId = `${inputId}-grid`;
  const errorId = error ? `${inputId}-error` : undefined;
  const isControlled = value !== undefined;
  const normalizedDefaultValue =
    defaultValue &&
    parseIsoDate(defaultValue) &&
    isIsoWithinRange(defaultValue, min, max)
      ? defaultValue
      : undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(
    normalizedDefaultValue,
  );
  const selectedValue = isControlled ? value : internalValue;
  const selectedDate = isoToDate(selectedValue);
  const [displayState, setDisplayState] = useState({
    sourceValue: selectedValue,
    text: formatDisplayDate(selectedValue),
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activeDate, setActiveDate] = useState<Date>(
    selectedDate ?? clampMonth(new Date(), min, max),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeDayRef = useRef<HTMLButtonElement>(null);
  const { floatingStyles, refs } = useFloating({
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ availableWidth, elements, rects }) {
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.min(352, availableWidth)}px`,
            width: `${Math.max(304, Math.min(352, rects.reference.width))}px`,
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

  const calendarDays = useMemo(() => getCalendarDays(activeDate), [activeDate]);
  const activeIso = dateToIso(activeDate);
  const todayIso = dateToIso(new Date());
  const canInteract = !disabled && !readOnly;
  let displayValue = displayState.text;

  if (displayState.sourceValue !== selectedValue) {
    displayValue = formatDisplayDate(selectedValue);
    setDisplayState({ sourceValue: selectedValue, text: displayValue });
  }

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideInteraction = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !floatingElementRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideInteraction);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsideInteraction);
  }, [floatingElementRef, isOpen]);

  useEffect(() => {
    if (isOpen)
      window.requestAnimationFrame(() => activeDayRef.current?.focus());
  }, [activeIso, isOpen]);

  const commitValue = (nextValue: string | undefined) => {
    if (!isControlled) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  const setDisplayText = (text: string, sourceValue = selectedValue) => {
    setDisplayState({ sourceValue, text });
  };

  const selectDate = (date: Date) => {
    const nextValue = dateToIso(date);
    if (!isIsoWithinRange(nextValue, min, max)) return;
    setDisplayText(formatDisplayDate(nextValue), nextValue);
    setActiveDate(date);
    commitValue(nextValue);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const clearDate = () => {
    if (!allowClear || required || disabled || readOnly) return;
    setDisplayText('', undefined);
    commitValue(undefined);
    inputRef.current?.focus();
  };

  const openCalendar = () => {
    if (!canInteract) return;
    setActiveDate(selectedDate ?? clampMonth(new Date(), min, max));
    setIsOpen(true);
  };

  const commitManualEntry = () => {
    const trimmed = displayValue.trim();
    if (!trimmed) {
      if (!required) {
        setDisplayText('', undefined);
        commitValue(undefined);
        return;
      }
      setDisplayText(formatDisplayDate(selectedValue));
      return;
    }

    const nextValue = parseDisplayDate(trimmed);
    if (!nextValue || !isIsoWithinRange(nextValue, min, max)) {
      setDisplayText(formatDisplayDate(selectedValue));
      return;
    }

    commitValue(nextValue);
    setDisplayText(formatDisplayDate(nextValue), nextValue);
  };

  const moveActiveDate = (days: number) => {
    const next = moveDate(activeDate, days);
    const nextIso = dateToIso(next);
    if (!isIsoWithinRange(nextIso, min, max)) return;
    setActiveDate(next);
  };

  const moveActiveMonth = (months: number) => {
    setActiveDate((current) =>
      clampMonth(
        new Date(current.getFullYear(), current.getMonth() + months, 1),
        min,
        max,
      ),
    );
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openCalendar();
      return;
    }

    if (event.key === 'Enter') {
      commitManualEntry();
    }
  };

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (
      event.relatedTarget &&
      floatingElementRef.current?.contains(event.relatedTarget)
    ) {
      return;
    }
    commitManualEntry();
  };

  const handleCalendarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      inputRef.current?.focus();
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectDate(activeDate);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveActiveDate(-1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveActiveDate(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActiveDate(-7);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActiveDate(7);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      moveActiveDate(-activeDate.getDay());
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      moveActiveDate(6 - activeDate.getDay());
      return;
    }

    if (event.key === 'PageUp') {
      event.preventDefault();
      moveActiveMonth(event.shiftKey ? -12 : -1);
      return;
    }

    if (event.key === 'PageDown') {
      event.preventDefault();
      moveActiveMonth(event.shiftKey ? 12 : 1);
    }
  };

  return (
    <div className={`relative min-w-0 ${className}`} ref={rootRef}>
      {name ? (
        <input
          aria-hidden="true"
          name={name}
          required={required}
          type="hidden"
          value={selectedValue ?? ''}
        />
      ) : null}
      <div className="relative" ref={setReference}>
        <input
          aria-controls={dialogId}
          aria-describedby={errorId}
          aria-haspopup="dialog"
          aria-invalid={Boolean(error)}
          aria-label={ariaLabel}
          autoComplete="off"
          className={[
            'min-h-11 w-full min-w-0 rounded-[7px] border bg-panel py-2 pl-3 pr-20 text-base text-foreground outline-none transition-colors placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60',
            error
              ? 'border-danger/65 focus:border-danger/75 focus:shadow-focus-danger'
              : 'border-line focus:border-accent focus:ring-2 focus:ring-accent/20',
          ].join(' ')}
          disabled={disabled}
          id={inputId}
          inputMode="numeric"
          onBlur={handleInputBlur}
          onChange={(event) => setDisplayText(event.target.value)}
          onFocus={() => {
            if (selectedDate) setActiveDate(selectedDate);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          readOnly={readOnly}
          ref={inputRef}
          required={required}
          type="text"
          value={displayValue}
        />
        {allowClear && selectedValue && !required && !disabled && !readOnly ? (
          <button
            aria-label="Clear date"
            className="absolute right-10 top-1/2 grid size-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted hover:bg-accent/10 hover:text-foreground"
            onClick={clearDate}
            type="button"
          >
            <X aria-hidden="true" className="size-3.5" />
          </button>
        ) : null}
        <button
          aria-label={isOpen ? 'Close calendar' : 'Open calendar'}
          className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-muted hover:bg-accent/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
          disabled={!canInteract}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              inputRef.current?.focus();
            } else {
              openCalendar();
            }
          }}
          tabIndex={-1}
          type="button"
        >
          <CalendarDays aria-hidden="true" className="size-4" />
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-[0.9rem] text-danger" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      {isOpen ? (
        <FloatingPortal>
          <div
            aria-labelledby={`${dialogId}-heading`}
            className="z-100 grid gap-3 rounded-lg border border-line bg-panel p-3 text-foreground shadow-panel"
            id={dialogId}
            onKeyDown={handleCalendarKeyDown}
            ref={setFloating}
            role="dialog"
            style={floatingStyles}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                aria-label="Previous year"
                className="grid size-9 cursor-pointer place-items-center rounded-md text-muted hover:bg-accent/10 hover:text-foreground"
                onClick={() => moveActiveMonth(-12)}
                type="button"
              >
                <ChevronsLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                aria-label="Previous month"
                className="grid size-9 cursor-pointer place-items-center rounded-md text-muted hover:bg-accent/10 hover:text-foreground"
                onClick={() => moveActiveMonth(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
              </button>
              <h2
                className="min-w-0 flex-1 text-center text-sm font-extrabold text-accent-strong"
                id={`${dialogId}-heading`}
              >
                {MONTH_FORMATTER.format(activeDate)}
              </h2>
              <button
                aria-label="Next month"
                className="grid size-9 cursor-pointer place-items-center rounded-md text-muted hover:bg-accent/10 hover:text-foreground"
                onClick={() => moveActiveMonth(1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
              <button
                aria-label="Next year"
                className="grid size-9 cursor-pointer place-items-center rounded-md text-muted hover:bg-accent/10 hover:text-foreground"
                onClick={() => moveActiveMonth(12)}
                type="button"
              >
                <ChevronsRight aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div
              aria-label="Choose date"
              className="grid grid-cols-7 gap-1"
              id={gridId}
              role="grid"
            >
              {DAY_NAMES.map((dayName) => (
                <div
                  className="grid h-8 place-items-center text-xs font-extrabold text-muted"
                  key={dayName}
                  role="columnheader"
                >
                  {dayName}
                </div>
              ))}
              {calendarDays.map((date) => {
                const iso = dateToIso(date);
                const isOutsideMonth =
                  date.getMonth() !== activeDate.getMonth();
                const isSelected = iso === selectedValue;
                const isActive = iso === activeIso;
                const isDisabled = !isIsoWithinRange(iso, min, max);

                return (
                  <button
                    aria-label={new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'full',
                    }).format(date)}
                    aria-selected={isSelected}
                    className={[
                      'grid h-9 min-w-0 cursor-pointer place-items-center rounded-md border text-sm font-bold outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-35',
                      isSelected
                        ? 'border-primary bg-primary text-primary-contrast'
                        : 'border-transparent text-foreground hover:bg-accent/10',
                      isOutsideMonth && !isSelected ? 'text-muted/60' : '',
                      isActive && !isSelected
                        ? 'border-accent text-accent-strong'
                        : '',
                    ].join(' ')}
                    disabled={isDisabled}
                    key={iso}
                    onClick={() => selectDate(date)}
                    ref={isActive ? activeDayRef : undefined}
                    role="gridcell"
                    tabIndex={isActive ? 0 : -1}
                    type="button"
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
              <button
                className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-[7px] px-3 text-sm font-bold text-muted transition hover:bg-accent/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                disabled={!isIsoWithinRange(todayIso, min, max)}
                onClick={() => selectDate(new Date())}
                type="button"
              >
                Today
              </button>
              <button
                className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-[7px] bg-primary px-3 text-sm font-bold text-primary-contrast shadow-button-primary transition hover:bg-primary-strong"
                onClick={() => selectDate(activeDate)}
                type="button"
              >
                Select
              </button>
            </div>
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
