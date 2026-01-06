# Icon Usage Guide

## Using Centralized Icons

All icons are exported from a single file to prevent missing import errors.

### ✅ Correct Usage

```tsx
// Import from the centralized Icons.tsx
import { FiUser, FiMail, FiExternalLink } from '../components/Icons';

function MyComponent() {
  return (
    <div>
      <FiUser />
      <FiMail />
      <a href="#" target="_blank">
        Visit <FiExternalLink />
      </a>
    </div>
  );
}
```

### ❌ Avoid This

```tsx
// Don't import directly from react-icons
import { FiUser } from 'react-icons/fi'; // ❌ Don't do this
```

## Adding New Icons

If you need an icon that's not in `Icons.tsx`:

1. Open `src/components/Icons.tsx`
2. Add the icon to the export list
3. Use it in your component

Example:
```tsx
// In Icons.tsx
export {
  FiUser,
  FiNewIcon, // ← Add new icon here
} from 'react-icons/fi';

// In your component
import { FiNewIcon } from '../components/Icons';
```

## Benefits

- ✅ Single source of truth
- ✅ Prevents missing import errors
- ✅ Easy to see which icons are used
- ✅ Better code organization
- ✅ Easier refactoring
