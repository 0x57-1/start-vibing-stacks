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

## TailwindCSS Class Organization

```tsx
// ✅ Classes as CONST — clean JSX
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

// ❌ Inline class soup
<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm"> // ❌
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
