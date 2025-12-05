# Frontend Structure Documentation

## 📁 Cấu trúc thư mục

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout với AuthProvider
│   ├── page.tsx                 # Dashboard page
│   ├── login/                   # Login page
│   ├── profile/                 # Profile pages
│   │   ├── page.tsx            # View profile
│   │   └── edit/               # Edit profile
│   ├── leave/                   # Leave management pages
│   ├── timesheet/              # Timesheet pages
│   ├── checkin/                # Check-in pages
│   └── wfh/                    # Work from home pages
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── app-sidebar.tsx         # Sidebar navigation
│   ├── dashboard-overview.tsx  # Dashboard content
│   ├── require-auth.tsx        # Auth wrapper component
│   └── ...
│
├── lib/                         # Utilities and core logic
│   ├── api/                    # API service layer
│   │   ├── index.ts           # Export all APIs
│   │   ├── profile.ts         # Profile API calls
│   │   ├── leave.ts           # Leave API calls
│   │   ├── leave-service.ts   # Extended leave service
│   │   └── wfh.ts             # WFH API calls
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── index.ts           # Export all hooks
│   │   └── use-auth.tsx       # Authentication hook
│   │
│   ├── constants/              # Constants and configs
│   │   ├── index.ts           # App-wide constants
│   │   └── leaveConstants.ts  # Leave-specific (deprecated)
│   │
│   └── utils.ts               # Utility functions (cn, etc.)
│
└── types/                       # TypeScript type definitions
    ├── index.ts                # Export all types
    ├── auth.ts                 # Auth-related types
    ├── common.ts               # Common/shared types
    ├── leave.ts                # Leave-related types
    ├── profile.ts              # Profile-related types
    └── wfh.ts                  # WFH-related types
```

## 🎯 Nguyên tắc tổ chức

### 1. **Types (`types/`)**
- Chứa tất cả TypeScript interfaces và types
- Mỗi file type tương ứng với một domain (auth, leave, profile, etc.)
- Import types sử dụng `import type` để tree-shaking tốt hơn

```typescript
// ✅ Đúng
import type { EmployeeProfile } from '@/types/profile'

// ❌ Sai (nên tránh)
import { EmployeeProfile } from '@/lib/profile-api'
```

### 2. **API Services (`lib/api/`)**
- Chứa tất cả API calls và HTTP requests
- Mỗi file API tương ứng với một API endpoint group
- Sử dụng object pattern để export (e.g., `profileApi`, `leaveApi`)

```typescript
// ✅ Đúng
import { profileApi } from '@/lib/api/profile'
const data = await profileApi.getProfile()

// ❌ Sai (old pattern)
import { getEmployeeProfile } from '@/lib/profile-api'
```

### 3. **Hooks (`lib/hooks/`)**
- Chứa custom React hooks
- Hooks phải bắt đầu với `use` prefix
- Context providers cũng nên đặt ở đây

```typescript
// ✅ Đúng
import { useAuth } from '@/lib/hooks/use-auth'

// ❌ Sai (old location)
import { useAuth } from '@/lib/auth-context'
```

### 4. **Constants (`lib/constants/`)**
- Chứa app-wide constants, configs
- Export as const objects để type safety

```typescript
// ✅ Đúng
import { LEAVE_STATUS } from '@/lib/constants'
```

### 5. **Components (`components/`)**
- UI components (reusable hoặc page-specific)
- `ui/` folder chứa shadcn/ui components
- Các components khác đặt ở root level

### 6. **App (`app/`)**
- Next.js App Router pages
- Mỗi folder là một route
- `page.tsx` là entry point của route

## 📦 Import Guidelines

### Absolute imports sử dụng `@/` prefix:

```typescript
// Types
import type { EmployeeProfile } from '@/types/profile'
import type { LeaveRequest } from '@/types/leave'

// API Services
import { profileApi } from '@/lib/api/profile'
import { leaveService } from '@/lib/api/leave-service'

// Hooks
import { useAuth } from '@/lib/hooks/use-auth'

// Constants
import { LEAVE_STATUS } from '@/lib/constants'

// Utils
import { cn } from '@/lib/utils'

// Components
import { Button } from '@/components/ui/button'
```

## 🔄 Migration từ cấu trúc cũ

### Old → New mapping:

| Old Path | New Path |
|----------|----------|
| `@/lib/profile-api` (types) | `@/types/profile` |
| `@/lib/profile-api` (API) | `@/lib/api/profile` |
| `@/lib/leave-api` (types) | `@/types/leave` |
| `@/lib/leave-api` (API) | `@/lib/api/leave` |
| `@/lib/auth-context` | `@/lib/hooks/use-auth` |
| `@/lib/services/leaveService` | `@/lib/api/leave-service` |
| `@/lib/index` (types) | `@/types/common` |

## ✨ Best Practices

1. **Separation of Concerns**: Types, API logic, hooks, và components được tách riêng
2. **Type Safety**: Sử dụng `import type` cho type imports
3. **Consistent Naming**: 
   - API services: `xxxApi` object pattern
   - Hooks: `useXxx` prefix
   - Types: PascalCase interfaces
4. **Centralized Exports**: Mỗi folder có `index.ts` để export centralized
5. **Clean Imports**: Tránh relative imports phức tạp, dùng `@/` alias

## 🚀 Usage Examples

### Fetch và hiển thị profile:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { profileApi } from '@/lib/api/profile'
import type { EmployeeProfile } from '@/types/profile'
import { useAuth } from '@/lib/hooks/use-auth'

export default function ProfilePage() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)

  useEffect(() => {
    async function loadProfile() {
      const data = await profileApi.getProfile()
      setProfile(data)
    }
    if (token) loadProfile()
  }, [token])

  // Render profile...
}
```

### Create leave request:

```typescript
import { leaveService } from '@/lib/api/leave-service'
import type { CreateLeaveRequestDto } from '@/types/leave'

async function submitLeave(employeeId: number, data: CreateLeaveRequestDto) {
  try {
    const result = await leaveService.createLeaveRequest(employeeId, data)
    console.log('Leave created:', result)
  } catch (error) {
    console.error('Failed to create leave:', error)
  }
}
```

---

**Note**: Cấu trúc này tuân theo best practices của Next.js 14+ và TypeScript, đảm bảo code dễ maintain và scale.
