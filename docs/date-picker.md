# DatePicker

Use `DatePicker` for every date selection field in the web app. Do not use
native `input type="date"` controls; browser implementations differ too much
for a consistent UI.

The component displays dates as `MM/DD/YYYY` and submits ISO `YYYY-MM-DD`
values, which keeps forms compatible with server actions and URL query
handling.

## Basic Form Field

```tsx
import { DatePicker } from '@/components/DatePicker';

<label className="grid min-w-0 gap-2 text-sm font-bold">
  From
  <DatePicker
    aria-label="From date"
    defaultValue={searchParams.dateFrom}
    name="dateFrom"
  />
</label>
```

## Validation

```tsx
<DatePicker
  aria-label="Start date"
  error={state.errors?.startDate?.[0]}
  max="2026-12-31"
  min="2026-01-01"
  name="startDate"
  required
/>
```

## Controlled Usage

```tsx
const [date, setDate] = useState<string | undefined>();

<DatePicker
  aria-label="Published date"
  allowClear
  name="publishedAt"
  onChange={setDate}
  value={date}
/>;
```

## Behavior

- Users can type `MM/DD/YYYY`, `M/D/YYYY`, or `YYYY-MM-DD`.
- The hidden form value is always `YYYY-MM-DD` or an empty string.
- Arrow keys move through the calendar when the popover is open.
- `PageUp` and `PageDown` move by month; add `Shift` to move by year.
- `Enter` or `Space` selects the active day.
- `Escape` closes the calendar and returns focus to the text field.
- `min`, `max`, `required`, `disabled`, `readOnly`, `allowClear`, and `error`
  should be passed through from form state when applicable.
