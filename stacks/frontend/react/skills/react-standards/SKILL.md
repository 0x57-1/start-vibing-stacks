# React 19+ Standards

## Version Requirements

- **ReactJS >= 19** — MANDATORY
- **TailwindCSS >= 4** — MANDATORY

## Translation Pattern

```tsx
// ✅ Translations as CONST at the top, BEFORE hooks
const LABELS = {
    title: __('dashboard.title'),
    save: __('common.save'),
    cancel: __('common.cancel'),
    errorRequired: __('errors.field_required'),
};

export default function Dashboard() {
    const [data, setData] = useState(null);
    
    return <h1>{LABELS.title}</h1>;
}

// ❌ NEVER call __() inside JSX (Hook violations)
return <h1>{__('dashboard.title')}</h1>; // ❌
```

**Rules:**
- Translations in `CONST` variables before state hooks
- New strings → add to `lang/en/*.php` and `lang/pt/*.php`
- Error strings centralized in `lang/*/errors.php`

## Debug Logging

```tsx
// Controlled debug system per component
const ENABLE_DASHBOARD_DEBUG = false;

const debugLog = (...args: unknown[]) => {
    if (ENABLE_DASHBOARD_DEBUG) console.log('[Dashboard]', ...args);
};

export default function Dashboard() {
    debugLog('Rendering with data:', data);
    // ...
}
```

**Rule:** Never leave raw `console.log`. Always use controlled debug pattern.

## TailwindCSS Class Organization (CONST Pattern)

**MANDATORY:** Define all CSS classes as constants at the TOP of the file, before the component.

### Why

1. **No re-renders** — string constants have stable references (no new object per render)
2. **Single source of truth** — change style once, updates everywhere
3. **Clean JSX** — readable templates, no class soup
4. **Prevents React state warnings** — no inline objects/strings changing reference
5. **Easy theming** — swap tokens in one place

### Pattern

```tsx
// ═══════════════════════════════════════════
// 1. TRANSLATIONS (before hooks)
// ═══════════════════════════════════════════
const LABELS = {
    title: __('dashboard.title'),
    save: __('common.save'),
} as const;

// ═══════════════════════════════════════════
// 2. STYLES (semantic tokens, not raw colors)
// ═══════════════════════════════════════════
const STYLES = {
    // Layout
    page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    section: 'space-y-6',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',

    // Cards
    card: 'bg-card border border-card-line rounded-xl p-6 hover:shadow-md transition-shadow',
    cardHeader: 'flex items-center justify-between border-b border-card-divider pb-4 mb-4',
    cardTitle: 'text-lg font-semibold text-foreground',
    cardDescription: 'text-sm text-muted-foreground mt-1',

    // Table
    table: 'w-full text-sm',
    tableHeader: 'text-left text-muted-foreground font-medium border-b border-border',
    tableRow: 'border-b border-border hover:bg-muted/50 transition-colors',
    tableCell: 'px-4 py-3 text-foreground',

    // Buttons
    btnPrimary: 'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    btnSecondary: 'px-4 py-2 bg-layer border border-layer-line text-layer-foreground rounded-lg hover:bg-layer-hover font-medium transition-colors',
    btnDestructive: 'px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive-hover font-medium transition-colors',
    btnGhost: 'px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors',

    // Forms
    input: 'w-full h-10 px-3 rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors',
    label: 'block text-sm font-medium text-foreground mb-1',
    fieldError: 'mt-1 text-sm text-destructive',

    // Status badges
    badgeSuccess: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    badgeWarning: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    badgeDanger: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

    // Typography
    heading: 'text-2xl font-bold text-foreground',
    subheading: 'text-lg font-semibold text-foreground',
    body: 'text-sm text-foreground',
    muted: 'text-sm text-muted-foreground',
} as const;

// ═══════════════════════════════════════════
// 3. COMPONENT
// ═══════════════════════════════════════════
export default function Dashboard() {
    const [data, setData] = useState(null);

    return (
        <div className={STYLES.page}>
            <h1 className={STYLES.heading}>{LABELS.title}</h1>
            <div className={STYLES.grid}>
                <div className={STYLES.card}>
                    <h2 className={STYLES.cardTitle}>Stats</h2>
                    <p className={STYLES.cardDescription}>Overview</p>
                </div>
            </div>
        </div>
    );
}
```

### Composing Styles

```tsx
// ✅ Combine with template literal when conditional
<tr className={`${STYLES.tableRow} ${isSelected ? 'bg-primary/5' : ''}`}>

// ✅ clsx/cn for complex conditions
import { cn } from '@/lib/utils';
<button className={cn(STYLES.btnPrimary, isFullWidth && 'w-full', className)}>
```

### Rules

1. **CONST at top** — before hooks, before component
2. **`as const`** — TypeScript ensures immutability
3. **Semantic tokens** — `bg-card` not `bg-white`, `text-foreground` not `text-gray-900`
4. **No inline class strings > 3 utilities** — extract to STYLES
5. **Shared styles** — create a `styles.ts` file for cross-component constants

```tsx
// resources/js/styles.ts — shared across components
export const SHARED_STYLES = {
    page: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    btnPrimary: 'px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover ...',
    input: 'w-full h-10 px-3 rounded-md border border-border bg-background ...',
} as const;
```

### ❌ FORBIDDEN

```tsx
// ❌ Inline class soup — unreadable, unstable reference
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm">

// ❌ Raw colors instead of tokens
const STYLES = { card: 'bg-white text-gray-900' };  // ❌ Breaks dark mode

// ❌ Dynamic class construction (breaks Tailwind purge)
const color = 'blue';
<div className={`bg-${color}-500`}>  // ❌ Purged!

// ❌ Styles inside component (new object every render)
export default function Bad() {
    const styles = { card: 'bg-card p-4' };  // ❌ Inside = new ref every render
    return <div className={styles.card} />;
}
```

## SVG Icons

```tsx
// ✅ Separate files, import with ?react
// resources/js/Icons/CheckIcon.svg
import CheckIcon from '@/Icons/CheckIcon.svg?react';
import { CheckIcon, AlertIcon } from '@/Icons';

// ❌ Inline SVG
<svg viewBox="0 0 24 24">...</svg> // ❌ Bloats JSX
```

## Loading States

```tsx
// ✅ Always show loading feedback
export default function DataTable() {
    const [loading, setLoading] = useState(true);
    
    if (loading) {
        return <SectionLoader />;  // Overlay for content sections
    }
    
    return <Table data={data} />;
}

// ✅ Button loading
<Button onClick={handleSave} loading={saving}>
    {saving ? <LoadingSpinner /> : LABELS.save}
</Button>
```

**Rule:** Every data-heavy section needs a loading state.

## Modal Data Flow

```tsx
// ✅ onUpdated callback for parent refresh
interface EditModalProps {
    item: Item;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;  // Required callback
}

function EditModal({ item, isOpen, onClose, onUpdated }: EditModalProps) {
    const handleSave = async () => {
        await api.update(item.id, formData);
        onUpdated();  // Trigger parent refresh
        onClose();
    };
}

// Parent usage
<EditModal
    item={selectedItem}
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onUpdated={() => refetchData()}  // Refresh list
/>
```

## Third-Party Libraries (Charts)

```tsx
// ✅ Let React handle re-rendering
{chartData && (
    <ApexChart
        key={JSON.stringify(chartData)}  // Force remount on data change
        options={chartOptions}
        series={chartData}
        type="area"
    />
)}

// ❌ Manual DOM manipulation
const chartRef = useRef(null);
chartRef.current.updateSeries(newData); // ❌ NEVER

// ✅ Memoize expensive computations
const processedData = useMemo(() => {
    return heavyTransform(rawData);
}, [rawData]);
```

**Rules:**
- No `useRef` for updating third-party components
- Conditional rendering: `data && <Component />`
- `useMemo` for expensive computations
- Loading states before rendering charts
