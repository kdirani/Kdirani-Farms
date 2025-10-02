# Complete Farm Setup Feature

## Overview
A unified setup page that allows admins to create a complete farm configuration in one place, streamlining the onboarding process for new farms.

## Page Location
`/admin/setup` - accessible via the admin navigation menu as "إعداد مزرعة كاملة" (Complete Farm Setup)

## What It Does
This feature creates all necessary entities for a new farm in a single workflow:

1. **Farmer User Account** - Creates a new user with farmer role
2. **Farm** - Creates and assigns a farm to the farmer
3. **Warehouse** - Creates a warehouse for the farm
4. **Poultry Batch** - Creates an initial herd/flock
5. **Materials (Optional)** - Adds opening stock materials to the warehouse inventory

## Components

### Action
- `actions/farm-setup.actions.ts` - Server action that orchestrates the complete setup
  - `createCompleteFarmSetup()` - Main function that calls individual actions sequentially

### Component
- `components/admin/setup/complete-farm-setup-form.tsx` - Form component with:
  - Multi-section form layout (5 steps)
  - Dynamic material entries (add/remove)
  - Form validation using Zod
  - Success state with visual feedback

### Page
- `app/(dashboard)/admin/setup/page.tsx` - Main page that:
  - Loads required data (material names, units)
  - Displays the setup form
  - Shows helpful information about the workflow

## Form Sections

### 1. Farmer Details
- Full Name (required)
- Email Address (required)
- Password (required, min 6 characters)

### 2. Farm Details
- Farm Name (required)
- Location (optional)
- Is Active checkbox (default: true)

### 3. Warehouse Details
- Warehouse Name (required)

### 4. Poultry Batch
- Batch Name (required)
- Opening Chicks Count (required, default: 1000)

### 5. Opening Stock Materials (Optional)
- Dynamic list of materials
- Each material has:
  - Material Name dropdown (from materials_names table)
  - Unit dropdown (from measurement_units table)
  - Opening Balance (number, min: 0)
- Add/Remove materials as needed

## Error Handling
The setup process includes robust error handling:
- If user creation fails, the entire process stops
- If farm creation fails, returns the created user ID
- If warehouse creation fails, returns user and farm IDs
- If poultry creation fails, returns user, farm, and warehouse IDs
- Materials creation continues even if some fail

This allows partial recovery and debugging of failed setups.

## Success Flow
Upon successful completion:
1. All entities are created in sequence
2. Success toast notification is displayed
3. Green success screen is shown for 5 seconds
4. Form resets for next setup
5. All relevant admin pages are revalidated

## Navigation
The setup page is accessible from:
- Admin navigation sidebar: Under "الرئيسية" (Main) section
- Direct URL: `/admin/setup`

## Permissions
Only users with `admin` role can:
- Access the setup page
- Execute the farm setup action

Sub-admins and farmers cannot access this feature.

## Technical Details

### Dependencies
- Uses existing actions: user, farm, warehouse, poultry, material
- Leverages existing form components and UI library
- Built with react-hook-form and Zod validation

### Database Operations
All operations are performed sequentially with proper error handling. The action uses server-side validation and Supabase queries.

### Revalidation
After successful setup, the following paths are revalidated:
- `/admin/users`
- `/admin/farms`
- `/admin/warehouses`
- `/admin/poultry`
- `/admin/materials`
- `/admin/setup`
