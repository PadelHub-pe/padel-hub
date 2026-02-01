# PadelHub Component Patterns

## Mobile (React Native + NativeWind)

### Primary Button (CTA)

```tsx
<Pressable className="bg-secondary-500 active:bg-secondary-600 rounded-lg px-6 py-3">
  <Text className="text-white font-semibold text-center">Book Now</Text>
</Pressable>
```

### Secondary Button

```tsx
<Pressable className="bg-primary-500 active:bg-primary-600 rounded-lg px-6 py-3">
  <Text className="text-white font-semibold text-center">View Details</Text>
</Pressable>
```

### Outline Button

```tsx
<Pressable className="border border-gray-300 rounded-lg px-6 py-3 active:bg-gray-50">
  <Text className="text-gray-700 font-medium text-center">Cancel</Text>
</Pressable>
```

### Card

```tsx
<View className="bg-white rounded-xl p-4 shadow-sm">
  <Text className="text-gray-900 text-lg font-semibold">Court Name</Text>
  <Text className="text-gray-500 text-sm">Location details</Text>
</View>
```

### Status Badge

```tsx
// Confirmed
<View className="bg-success-light px-3 py-1 rounded-full flex-row items-center">
  <CheckCircle size={14} className="text-success-dark mr-1" />
  <Text className="text-success-dark text-xs font-medium">Confirmed</Text>
</View>

// Pending
<View className="bg-warning-light px-3 py-1 rounded-full flex-row items-center">
  <Clock size={14} className="text-warning-dark mr-1" />
  <Text className="text-warning-dark text-xs font-medium">Pending</Text>
</View>

// Open Match
<View className="bg-secondary-100 px-3 py-1 rounded-full">
  <Text className="text-secondary-700 text-xs font-medium">2 spots left</Text>
</View>
```

### Skill Level Badge

```tsx
type SkillCategory = 1 | 2 | 3 | 4 | 5 | 6;

const skillBadgeStyles: Record<SkillCategory, { bg: string; text: string }> = {
  6: { bg: "bg-primary-50", text: "text-primary-600" },
  5: { bg: "bg-primary-100", text: "text-primary-700" },
  4: { bg: "bg-primary-200", text: "text-primary-800" },
  3: { bg: "bg-primary-500", text: "text-white" },
  2: { bg: "bg-gray-700", text: "text-white" },
  1: { bg: "bg-gray-900", text: "text-white" },
};

function SkillBadge({ category }: { category: SkillCategory }) {
  const styles = skillBadgeStyles[category];
  return (
    <View className={`${styles.bg} px-2 py-1 rounded-full`}>
      <Text className={`${styles.text} text-xs font-medium`}>Cat {category}</Text>
    </View>
  );
}
```

### Input Field

```tsx
<View className="space-y-1">
  <Text className="text-gray-700 text-sm font-medium">Email</Text>
  <TextInput
    className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 
               focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
    placeholder="Enter your email"
    placeholderTextColor="#9CA3AF"
  />
</View>
```

### Tab Bar Item

```tsx
// Active
<View className="items-center py-2">
  <Home size={24} className="text-primary-500" />
  <Text className="text-primary-500 text-xs font-medium mt-1">Home</Text>
</View>

// Inactive
<View className="items-center py-2">
  <Search size={24} className="text-gray-400" />
  <Text className="text-gray-400 text-xs mt-1">Search</Text>
</View>
```

---

## Web (Next.js + shadcn/ui)

### Primary Button (CTA)

```tsx
<Button className="bg-secondary-500 hover:bg-secondary-600 text-white">
  Book Now
</Button>
```

### Secondary Button

```tsx
<Button className="bg-primary-500 hover:bg-primary-600 text-white">
  View Details
</Button>
```

### Outline Button

```tsx
<Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
  Cancel
</Button>
```

### Card

```tsx
<Card className="rounded-xl">
  <CardHeader>
    <CardTitle className="text-gray-900">Court Name</CardTitle>
    <CardDescription className="text-gray-500">Location details</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Status Badge

```tsx
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Users, Calendar } from "lucide-react";

// Confirmed
<Badge className="bg-success-light text-success-dark hover:bg-success-light">
  <CheckCircle className="w-3 h-3 mr-1" />
  Confirmed
</Badge>

// Pending
<Badge className="bg-warning-light text-warning-dark hover:bg-warning-light">
  <Clock className="w-3 h-3 mr-1" />
  Pending
</Badge>

// Cancelled
<Badge className="bg-error-light text-error-dark hover:bg-error-light">
  <XCircle className="w-3 h-3 mr-1" />
  Cancelled
</Badge>

// Open Match
<Badge className="bg-secondary-100 text-secondary-700 hover:bg-secondary-100">
  <Users className="w-3 h-3 mr-1" />
  2 spots left
</Badge>

// Completed
<Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
  <Calendar className="w-3 h-3 mr-1" />
  Completed
</Badge>
```

### Data Table Row with Status

```tsx
<TableRow>
  <TableCell className="text-gray-900 font-medium">Court 1</TableCell>
  <TableCell className="text-gray-600">10:00 AM - 11:00 AM</TableCell>
  <TableCell>
    <Badge className="bg-success-light text-success-dark">
      <CheckCircle className="w-3 h-3 mr-1" />
      Confirmed
    </Badge>
  </TableCell>
  <TableCell className="text-secondary-600 font-semibold">$45.00</TableCell>
</TableRow>
```

### Form Input

```tsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-gray-700">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
    className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
  />
</div>
```

### Navigation Link

```tsx
// Active
<Link href="/dashboard" className="text-primary-600 font-medium">
  Dashboard
</Link>

// Inactive
<Link href="/settings" className="text-gray-600 hover:text-primary-600">
  Settings
</Link>
```

### Price Display

```tsx
<span className="text-secondary-600 font-bold text-xl">$45.00</span>
<span className="text-gray-500 text-sm">/hour</span>
```

### Availability Indicator

```tsx
<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-secondary-500" />
  <span className="text-secondary-700 text-sm font-medium">Available</span>
</div>

<div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-error" />
  <span className="text-error-dark text-sm font-medium">Booked</span>
</div>
```

---

## Common Patterns

### Loading State

```tsx
// Mobile
<ActivityIndicator color="#3B82F6" />

// Web
<Loader2 className="w-6 h-6 animate-spin text-primary-500" />
```

### Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12">
  <CalendarX className="w-12 h-12 text-gray-300 mb-4" />
  <Text className="text-gray-600 text-lg font-medium">No bookings yet</Text>
  <Text className="text-gray-400 text-sm">Your upcoming matches will appear here</Text>
</div>
```

### Error State

```tsx
<div className="bg-error-light border border-error rounded-lg p-4">
  <div className="flex items-center gap-2">
    <AlertCircle className="w-5 h-5 text-error" />
    <Text className="text-error-dark font-medium">Something went wrong</Text>
  </div>
  <Text className="text-error-dark text-sm mt-1">Please try again later</Text>
</div>
```
