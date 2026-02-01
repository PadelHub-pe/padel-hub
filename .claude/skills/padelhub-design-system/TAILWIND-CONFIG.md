# PadelHub Tailwind Configuration

## Complete Configuration

Copy this configuration to your `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Primary (Blue) - Trust, reliability, modern tech
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6", // Main brand color
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        // Secondary (Emerald) - Action, "go" psychology
        secondary: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981", // Primary CTAs
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },
        // Semantic colors
        success: {
          light: "#DCFCE7",
          DEFAULT: "#22C55E",
          dark: "#15803D",
        },
        warning: {
          light: "#FEF3C7",
          DEFAULT: "#F59E0B",
          dark: "#B45309",
        },
        error: {
          light: "#FEE2E2",
          DEFAULT: "#EF4444",
          dark: "#B91C1C",
        },
        info: {
          light: "#E0F2FE",
          DEFAULT: "#0EA5E9",
          dark: "#0369A1",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      fontSize: {
        display: ["40px", { lineHeight: "1.1", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.25", fontWeight: "600" }],
        h3: ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["18px", { lineHeight: "1.4", fontWeight: "500" }],
        body: ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "500" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## CSS Variables (Alternative)

For shadcn/ui integration, add these CSS variables to your `globals.css`:

```css
@layer base {
  :root {
    /* Primary (Blue) */
    --primary-50: 239 246 255;
    --primary-100: 219 234 254;
    --primary-200: 191 219 254;
    --primary-300: 147 197 253;
    --primary-400: 96 165 250;
    --primary-500: 59 130 246;
    --primary-600: 37 99 235;
    --primary-700: 29 78 216;
    --primary-800: 30 64 175;
    --primary-900: 30 58 138;

    /* Secondary (Emerald) */
    --secondary-50: 236 253 245;
    --secondary-100: 209 250 229;
    --secondary-200: 167 243 208;
    --secondary-300: 110 231 183;
    --secondary-400: 52 211 153;
    --secondary-500: 16 185 129;
    --secondary-600: 5 150 105;
    --secondary-700: 4 120 87;
    --secondary-800: 6 95 70;
    --secondary-900: 6 78 59;

    /* Semantic */
    --success-light: 220 252 231;
    --success: 34 197 94;
    --success-dark: 21 128 61;

    --warning-light: 254 243 199;
    --warning: 245 158 11;
    --warning-dark: 180 83 9;

    --error-light: 254 226 226;
    --error: 239 68 68;
    --error-dark: 185 28 28;

    --info-light: 224 242 254;
    --info: 14 165 233;
    --info-dark: 3 105 161;

    /* shadcn/ui mappings */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 217 91% 60%; /* primary-500 */
    --primary-foreground: 0 0% 100%;
    --secondary: 160 84% 39%; /* secondary-500 */
    --secondary-foreground: 0 0% 100%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84% 60%; /* error */
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 217 91% 60%; /* primary-500 */
    --radius: 0.5rem;
  }
}
```

## NativeWind Setup (React Native)

For NativeWind v5, use the same Tailwind config. Ensure your `nativewind-env.d.ts` includes:

```typescript
/// <reference types="nativewind/types" />
```

And in your `metro.config.js`:

```javascript
const { withNativeWind } = require("nativewind/metro");

module.exports = withNativeWind(config, { input: "./global.css" });
```

## Usage Examples

### Text Colors

```tsx
// Headings
<h1 className="text-gray-900">Primary Heading</h1>
<h2 className="text-gray-800">Secondary Heading</h2>

// Body text
<p className="text-gray-600">Body text content</p>

// Secondary/muted text
<span className="text-gray-500">Secondary information</span>

// Links
<a className="text-primary-600 hover:text-primary-700">Learn more</a>

// Prices
<span className="text-secondary-600 font-bold">$45.00</span>
```

### Background Colors

```tsx
// Page background
<div className="bg-gray-50">

// Card surface
<div className="bg-white rounded-xl shadow-sm">

// Subtle highlight
<div className="bg-primary-50">

// CTA section
<div className="bg-secondary-500">
```

### Borders

```tsx
// Standard border
<div className="border border-gray-200">

// Input border
<input className="border border-gray-300 focus:border-primary-500">

// Active/selected border
<div className="border-2 border-primary-500">
```
