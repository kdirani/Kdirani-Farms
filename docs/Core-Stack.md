## Core Stack

**Package Manager:** pnpm
**Framework:** Next.js 15+ (App Router) with React 19+
**Runtime:** Node.js 20+
**Language:** TypeScript


## Database & ORM

**Database:** supabase

## Authentication & Security

**Authentication:**   next-auth v5
**Environment Variables:** Native Next.js `.env.local`
**Session Management:** Built-in Next.js cookies/sessions
**Security Headers:** Next.js `headers()` في `next.config.js`


## API Layer & Data Fetching

**Server Components:** للقراءة المباشرة من Database (GET operations)
**Server Actions:** للـ mutations (POST/PUT/DELETE/PATCH)
**Route Handlers:** `app/api/*/route.ts` (للـ webhooks، external APIs، REST endpoints)
**Middleware:** Next.js Middleware (`middleware.ts`)
**Caching:** Built-in Next.js caching (`fetch`, `unstable_cache`, `revalidatePath`)

## State Management

**Server State:** Server Components + Server Actions (primary)
**Client State:** Zustand (للـ UI state فقط: modals, theme, sidebar, etc.)
**URL State:** Next.js `searchParams` و `useSearchParams`
**Form State:** React `useActionState` + `useFormStatus`



## User Interface

**Styling Framework:** Tailwind CSS
**UI Components:** shadcn/ui
**Icons:** Lucide React
**Dropdown/Select:** shadcn/ui Select, Dropdown Menu & Combobox


## Forms & Validation

**Schema Validation:** Zod (مشترك بين client و server)
**Form Management:**

- React Hook Form (للـ client-side complex forms)
- Native HTML forms مع Server Actions (للـ simple forms) **Form Hooks:** `useActionState`, `useFormStatus` (React 19)
    **File Upload:**
- **Client:** react-dropzone
- **Server:** Next.js native file handling أو Vercel Blob أو Uploadthing

## Additional Tools
**Date & Time:** `date-fns`
**Notifications:** `sonner`

## File Structure
use Route groups
actions files
lib
types
middleware.ts
etc

## Validation & Error Handling

**Schema Validation:** Zod (في Server Actions و Route Handlers)
**Error Handling:**

- `error.tsx` - Error UI boundaries
- `global-error.tsx` - Global errors
- Try-catch في Server Actions
- Standardized error responses في Route Handlers


## Performance & Optimization

**Image Optimization:** Next.js `<Image>` component
**Font Optimization:** `next/font` (Google Fonts, local fonts)
**Bundle Analysis:** `@next/bundle-analyzer`
**Partial Prerendering (PPR):** Enable في `next.config.js` (experimental)
**React Compiler:** Enable للـ automatic memoization
**Code Splitting:** Automatic via Next.js
**Lazy Loading:** `next/dynamic` للـ heavy components
