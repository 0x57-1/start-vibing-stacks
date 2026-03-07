# React 19+ Standards (with Inertia.js)

## Version Requirements

- **ReactJS >= 19** — MANDATORY
- **TailwindCSS >= 4** — MANDATORY
- **Inertia.js >= 2** — MANDATORY

## Translation Pattern (via Inertia shared props)

```tsx
import __ from '@/Utils/translate';

// CORRECT: Translations as CONST at the top, BEFORE hooks
const LABELS = {
    title: __('dashboard.title'),
    save: __('common.save'),
    cancel: __('common.cancel'),
    errorRequired: __('errors.field_required'),
    welcome: __('dashboard.welcome', { name: 'User' }),
};

export default function Dashboard() {
    const [data, setData] = useState(null);

    return <h1>{LABELS.title}</h1>;
}

// WRONG: __() inside JSX (Hook violation — usePage() is called internally)
return <h1>{__('dashboard.title')}</h1>; // NEVER
```

**Rules:**
- Translations in `CONST` variables before state hooks
- New strings must be added to `lang/en/*.php` AND `lang/pt/*.php`
- Error strings centralized in `lang/*/errors.php`
- Use replacements for dynamic values: `__('key', { name: value })`

## Debug Logging

```tsx
const ENABLE_DASHBOARD_DEBUG = false;

const debugLog = (...args: unknown[]) => {
    if (ENABLE_DASHBOARD_DEBUG) console.log('[Dashboard]', ...args);
};

export default function Dashboard() {
    debugLog('Rendering with data:', data);
}
```

**Rule:** Never leave raw `console.log`. Always use controlled debug pattern.

## TailwindCSS Class Organization

```tsx
// CORRECT: Classes as CONST — clean JSX
const STYLES = {
    container: 'flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm',
    title: 'text-2xl font-bold text-gray-900',
    button: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
};

export default function Dashboard() {
    return (
        <div className={STYLES.container}>
            <h1 className={STYLES.title}>{LABELS.title}</h1>
        </div>
    );
}

// WRONG: Inline class soup
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm"> // NEVER
```

## SVG Icons

```tsx
// CORRECT: Separate files, import with ?react
import CheckIcon from '@/Icons/CheckIcon.svg?react';
import { CheckIcon, AlertIcon } from '@/Icons';

// WRONG: Inline SVG (bloats JSX)
<svg viewBox="0 0 24 24">...</svg> // NEVER
```

**Structure:**
```
resources/js/Icons/
├── index.js           # Barrel export
├── CheckIcon.svg
├── AlertIcon.svg
└── SpinnerIcon.svg
```

## Inertia.js Hooks & Navigation

### Accessing Shared Props

```tsx
import { usePage } from '@inertiajs/react';

export default function Header() {
    const { auth, locale, flash } = usePage().props;

    return (
        <nav>
            <span>{auth.user?.name}</span>
            {flash.success && <Alert>{flash.success}</Alert>}
        </nav>
    );
}
```

### Forms with useForm

```tsx
import { useForm } from '@inertiajs/react';

export default function CreateOrder() {
    const { data, setData, post, processing, errors } = useForm({
        product_id: '',
        quantity: 1,
        notes: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('orders.store'));
    };

    return (
        <form onSubmit={handleSubmit}>
            <Input
                value={data.product_id}
                onChange={(e) => setData('product_id', e.target.value)}
                error={errors.product_id}
            />
            <Button type="submit" loading={processing}>
                {processing ? <LoadingSpinner /> : LABELS.save}
            </Button>
        </form>
    );
}
```

**Rules:**
- Use `useForm` for ALL form submissions (handles CSRF, errors, loading)
- `processing` boolean for button loading states
- `errors` object maps to Form Request validation errors
- Never use `fetch()` or `axios` for form submissions

### Navigation

```tsx
import { Link, router } from '@inertiajs/react';

// SPA links (no full page reload)
<Link href={route('orders.index')}>Orders</Link>

// Programmatic navigation
router.visit(route('dashboard'));

// Partial reload (only refresh specific props)
router.reload({ only: ['stats', 'recentOrders'] });
```

## Loading States

```tsx
// CORRECT: Always show loading feedback
export default function DataTable() {
    const [loading, setLoading] = useState(true);

    if (loading) {
        return <SectionLoader />;
    }

    return <Table data={data} />;
}

// Button loading (from useForm)
<Button onClick={handleSave} disabled={processing}>
    {processing ? <LoadingSpinner /> : LABELS.save}
</Button>
```

**Rule:** Every data-heavy section needs a loading state.

## Modal Data Flow

```tsx
interface EditModalProps {
    item: Item;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

function EditModal({ item, isOpen, onClose, onUpdated }: EditModalProps) {
    const { data, setData, put, processing } = useForm({
        name: item.name,
    });

    const handleSave = (e) => {
        e.preventDefault();
        put(route('items.update', item.id), {
            onSuccess: () => {
                onUpdated();
                onClose();
            },
        });
    };
}

// Parent: use router.reload for refresh after modal mutation
<EditModal
    item={selectedItem}
    isOpen={showModal}
    onClose={() => setShowModal(false)}
    onUpdated={() => router.reload({ only: ['items'] })}
/>
```

## Third-Party Libraries (Charts)

```tsx
// CORRECT: Let React handle re-rendering
{chartData && (
    <ApexChart
        key={JSON.stringify(chartData)}
        options={chartOptions}
        series={chartData}
        type="area"
    />
)}

// WRONG: Manual DOM manipulation
const chartRef = useRef(null);
chartRef.current.updateSeries(newData); // NEVER

// Memoize expensive computations
const processedData = useMemo(() => {
    return heavyTransform(rawData);
}, [rawData]);
```

**Rules:**
- No `useRef` for updating third-party components
- Conditional rendering: `data && <Component />`
- `useMemo` for expensive computations
- Loading states before rendering charts

## Forbidden Patterns

| Pattern | Reason | Use Instead |
|---------|--------|-------------|
| `fetch()` / `axios` for pages | Bypasses Inertia | `Inertia::render()` props |
| `__()` inside JSX | Hook violation | CONST at top |
| Inline SVGs | Bloats components | SVG files + `?react` |
| `<a href>` for internal links | Full reload | `<Link href>` |
| `window.location` | Full reload | `router.visit()` |
| Raw `console.log` | Uncontrolled | Debug constant pattern |
| Inline Tailwind soup | Unreadable | STYLES const object |
| `axios.post()` for forms | No CSRF/errors | `useForm().post()` |
