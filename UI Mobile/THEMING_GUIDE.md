# Theming Guide

## Overview

The app uses a centralized theming system that supports both light and dark modes. All color references must use the `useTheme()` hook to ensure proper theme switching.

## ❌ DON'T: Hardcode Colors

```typescript
// BAD - Don't import colors directly
import { colors } from '@/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.background, // ❌ Hardcoded
  },
});
```

## ✅ DO: Use useTheme Hook

### Approach 1: Inline Styles

```typescript
import { useTheme } from '@/context/ThemeContext';

export const MyComponent = () => {
  const { colors } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
};
```

### Approach 2: useThemedStyles Hook (Recommended)

```typescript
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing, fontSize } from '@/theme';

export const MyComponent = () => {
  const styles = useThemedStyles(createStyles);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello</Text>
    </View>
  );
};

const createStyles = (colors) => ({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  text: {
    color: colors.text,
    fontSize: fontSize.md,
  },
});
```

## Available Theme Colors

- **Primary**: `primary`, `primaryDark`, `primaryLight`, `primarySoft`
- **Text**: `text`, `textSecondary`, `textTertiary`, `textInverse`
- **Background**: `background`, `surface`, `surfaceHover`
- **Semantic**: `success`, `warning`, `danger`, `info` (with `*Soft` variants)
- **UI**: `border`, `borderLight`, `divider`, `shadow`, `overlay`
- **Status**: `statusApproved`, `statusPending`, `statusRejected`

## Migrating Existing Components

If you see an error like: "Property 'colors' doesn't exist", follow these steps:

1. **Remove** `colors` from imports:
   ```typescript
   // Before
   import { colors, spacing } from '@/theme';
   // After
   import { spacing } from '@/theme';
   ```

2. **Add** useTheme or useThemedStyles:
   ```typescript
   import { useThemedStyles } from '@/hooks/useThemedStyles';
   ```

3. **Convert** StyleSheet to function:
   ```typescript
   // Before
   const styles = StyleSheet.create({
     container: { backgroundColor: colors.light.background },
   });
   
   // After
   const createStyles = (colors) => ({
     container: { backgroundColor: colors.background },
   });
   ```

4. **Use** the hook in component:
   ```typescript
   const styles = useThemedStyles(createStyles);
   ```

## Static Theme Exports (Safe to Import)

These can be imported directly as they don't change with theme:

- `spacing` - Consistent spacing values
- `fontSize` - Font size scale
- `fontWeight` - Font weight constants
- `borderRadius` - Border radius values
- `shadows` - Shadow presets
