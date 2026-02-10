# MealLog AI Agent Instructions

## Project Overview
MealLog is a meal recommendation and tracking web app built with React + TypeScript. It provides meal suggestions based on recent eating history and tracks daily meals with BMI calculation.

## Architecture

### Component Structure
- **Tab-based Navigation**: Single page app with 5 tabs (recommend/log/history/bmi/settings), managed via state in `App.tsx`
- **No Routing**: Uses conditional rendering instead of React Router - switch statement in `renderContent()`
- **Feature Components** in `src/components/`:
  - `MealRecommendation.tsx` - Time-aware meal suggestions with duplicate prevention
  - `MealLogger.tsx` - Category-filtered menu selection + custom input
  - `MealHistory.tsx` - Date-grouped meal records with delete capability
  - `BMICalculator.tsx` - Health metrics with localized BMI categories
  - `ProfileSetting.tsx` - User data management with clear all option

### Data Layer
- **Storage**: 100% browser localStorage, no backend server
- **Keys**: Prefixed with `mealog_` (profile, meal_records, custom_menus)
- **Utils Pattern**: `src/utils/storage.ts` provides CRUD operations for all data types
- **Menu Database**: Static 86-item menu array in `src/data/menuDatabase.ts` categorized by cuisine type

### Business Logic (`src/utils/recommendationEngine.ts`)
- **Time Detection**: Auto-detects meal type by hour (5-11=breakfast, 11-16=lunch, 16-5=dinner)
- **Duplicate Prevention**:
  - Breakfast excludes yesterday's dinner
  - Lunch excludes today's breakfast
  - Dinner excludes today's breakfast + lunch
- Returns 5 random non-duplicate suggestions

## TypeScript Conventions

### Type-Only Imports
**CRITICAL**: All type imports MUST use `import type` due to `verbatimModuleSyntax` config:
```typescript
// ✅ Correct
import type { MealRecord, UserProfile } from '../types';
import { saveMealRecord } from '../utils/storage';

// ❌ Wrong - will cause build errors
import { MealRecord, UserProfile } from '../types';
```

### Inline Type Imports
When importing both value and type from same module:
```typescript
import { calculateBMI, type BMIResult } from '../utils/bmiCalculator';
```

## Development Workflow

### Build & Run
```bash
npm run dev    # Dev server on http://localhost:5173
npm run build  # Production build (TypeScript check + Vite)
```

### Tailwind Note
- Using **Tailwind CSS v3.4** (NOT v4) - v4 has build issues with current Vite version
- Config uses PostCSS plugin, NOT Vite plugin
- Standard `@tailwind base/components/utilities` directives in `index.css`

## Design System

### Styling Approach
- **Pastel gradient theme**: from-pink-100 via-purple-100 to-indigo-100
- **Card layout**: All feature areas use `rounded-3xl` white cards with `shadow-xl`
- **Buttons**: `rounded-2xl` with gradient `from-pink-400 to-purple-400` for primary actions
- **Interactive states**: `hover:scale-105 transition-all duration-200` on CTAs

### Component Patterns
```typescript
// Emoji icons for visual distinction
const mealTypeEmoji = {
  breakfast: '☀️',
  lunch: '🌤️',
  dinner: '🌙'
};

// Category buttons with active state
className={category === selected
  ? 'bg-purple-500 text-white shadow-md'
  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
```

## State Management
- **No Redux/Context**: Local `useState` in each feature component
- **Data Refresh Pattern**: Components call storage utils directly, use `useEffect` to load on mount
- **ID Generation**: `crypto.randomUUID()` for new records

## Date Handling
- **Storage Format**: YYYY-MM-DD strings via `date.toISOString().split('T')[0]`
- **Display Format**: Korean format `${year}년 ${month}월 ${day}일` in `formatDateDisplay()`
- **Input**: Native `<input type="date">` for cross-browser compatibility

## Common Tasks

### Adding New Menu Items
Edit `src/data/menuDatabase.ts`:
```typescript
{ name: '새메뉴', category: '한식' | '중식' | '일식' | '양식' | '분식' | '기타' }
```

### Adding New Feature Tab
1. Add tab to `Navigation.tsx` tabs array
2. Update `Tab` type in `App.tsx`
3. Add component to `renderContent()` switch
4. Create feature component in `src/components/`

### Storage Schema Updates
1. Update interface in `src/types/index.ts`
2. Add/update functions in `src/utils/storage.ts`
3. Consider migration if changing existing keys (currently no migration system)

## Gotchas
- **localStorage limits**: ~5-10MB per domain, no quota exceeded handling currently
- **Date timezone**: Uses local timezone, may cause issues crossing midnight
- **No data sync**: Each browser/device maintains separate data
- **No input validation**: Relies on HTML5 input types and user trust
