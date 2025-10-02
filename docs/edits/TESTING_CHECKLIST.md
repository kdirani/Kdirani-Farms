# Complete Farm Setup - Testing Checklist

## 🧪 Pre-Testing Setup

### Prerequisites
- [ ] Application is running at `http://localhost:3000`
- [ ] You have admin credentials to login
- [ ] Database has material names in `materials_names` table
- [ ] Database has units in `measurement_units` table

### Access Test
- [ ] Can access `/admin/setup` when logged in as admin
- [ ] Cannot access `/admin/setup` when logged in as farmer
- [ ] Cannot access `/admin/setup` when not logged in
- [ ] Navigation link appears in sidebar: "إعداد مزرعة كاملة"
- [ ] Navigation link has Zap icon (⚡)

## 📋 Form Display Tests

### Page Load
- [ ] Page title displays: "Complete Farm Setup"
- [ ] Info card with workflow explanation is visible
- [ ] Form loads without errors
- [ ] All 5 sections are visible:
  - [ ] Farmer Details
  - [ ] Farm Details
  - [ ] Warehouse Details
  - [ ] Poultry Batch
  - [ ] Opening Stock Materials

### Form Fields
- [ ] Farmer section has: name, email, password fields
- [ ] Farm section has: name, location, is_active checkbox
- [ ] Warehouse section has: name field
- [ ] Poultry section has: batch name, opening chicks fields
- [ ] Materials section has: "Add Material" button
- [ ] Materials section shows empty state initially

## ✏️ Form Interaction Tests

### Basic Input
- [ ] Can type in text fields
- [ ] Can enter email address
- [ ] Can enter password (characters hidden)
- [ ] Can check/uncheck "Farm is active"
- [ ] Can enter numbers in opening chicks field

### Material Management
- [ ] Click "Add Material" adds a new material entry
- [ ] Each material entry has 3 fields (material, unit, balance)
- [ ] Material dropdown shows available materials
- [ ] Unit dropdown shows available units
- [ ] Can select from dropdowns
- [ ] Can enter opening balance
- [ ] Click trash icon removes material entry
- [ ] Can add multiple material entries
- [ ] Can remove middle entry without affecting others

### Buttons
- [ ] "Reset Form" button is visible
- [ ] "Create Complete Farm Setup" button is visible
- [ ] Buttons are enabled when form is empty
- [ ] Loading state shows when submitting

## ✅ Validation Tests

### Required Fields
- [ ] Submit empty form shows validation errors
- [ ] Email field requires valid email format
- [ ] Password must be at least 6 characters
- [ ] Farm name must be at least 2 characters
- [ ] Warehouse name must be at least 2 characters
- [ ] Batch name must be at least 2 characters
- [ ] Opening chicks must be at least 1

### Optional Fields
- [ ] Can submit without farm location
- [ ] Can submit without materials
- [ ] "Farm is active" defaults to checked

### Field-Level Validation
- [ ] Invalid email shows error message
- [ ] Short password shows error message
- [ ] Short names show error messages
- [ ] Error messages are clear and helpful

## 🚀 Submission Tests

### Successful Submission
- [ ] Fill all required fields with valid data
- [ ] Submit form
- [ ] Loading spinner appears
- [ ] Form fields are disabled during submission
- [ ] Success toast notification appears
- [ ] Success message includes summary of created entities
- [ ] Green success screen appears
- [ ] Success screen shows for ~5 seconds
- [ ] Form resets after success
- [ ] Ready to create another farm

### Created Entities Verification
- [ ] Navigate to `/admin/users` - new farmer appears
- [ ] Navigate to `/admin/farms` - new farm appears
- [ ] Farm is assigned to the farmer
- [ ] Navigate to `/admin/warehouses` - new warehouse appears
- [ ] Warehouse is assigned to the farm
- [ ] Navigate to `/admin/poultry` - new batch appears
- [ ] Batch is assigned to the farm
- [ ] Navigate to `/admin/materials` - materials appear (if any)
- [ ] Materials are assigned to the warehouse

### Farmer Login Test
- [ ] Logout as admin
- [ ] Login with farmer credentials created
- [ ] Farmer can access `/farmer` dashboard
- [ ] Farmer can see their farm data
- [ ] Farmer cannot access `/admin` pages

## ❌ Error Handling Tests

### Duplicate Data
- [ ] Try to create user with existing email
- [ ] Error message is clear
- [ ] Form remains editable
- [ ] Can fix and retry

### Database Constraints
- [ ] Try to create farm with same name (if unique constraint exists)
- [ ] Appropriate error message shows
- [ ] Partial success is handled gracefully

### Network Errors
- [ ] Disconnect network (if possible)
- [ ] Try to submit
- [ ] Error message appears
- [ ] Form remains editable
- [ ] Can retry when network returns

## 🎨 UI/UX Tests

### Responsive Design
- [ ] Form works on desktop (1920px+)
- [ ] Form works on laptop (1366px)
- [ ] Form works on tablet (768px)
- [ ] Form works on mobile (375px)
- [ ] Mobile navigation shows setup link
- [ ] Form sections stack properly on mobile
- [ ] Buttons are accessible on mobile

### Visual Elements
- [ ] Card sections have proper borders
- [ ] Spacing is consistent
- [ ] Colors match theme
- [ ] Icons display correctly
- [ ] Success screen is visually appealing
- [ ] Error messages are in red
- [ ] Success messages are in green

### Accessibility
- [ ] All form fields have labels
- [ ] Labels are associated with inputs
- [ ] Error messages are announced
- [ ] Can tab through form fields
- [ ] Focus indicators are visible
- [ ] Color contrast is sufficient

## 🔄 Edge Cases

### Unusual Input
- [ ] Very long farmer name (100+ characters)
- [ ] Very long email address
- [ ] Special characters in names
- [ ] Unicode characters (Arabic, emoji, etc.)
- [ ] Very large opening chicks number (999999999)
- [ ] Zero opening chicks
- [ ] Negative opening balance (should fail validation)

### Material Edge Cases
- [ ] Add 10+ material entries
- [ ] Remove all material entries
- [ ] Add, remove, add same material
- [ ] Select same material multiple times
- [ ] Leave material dropdowns empty

### Form State
- [ ] Fill form, reset, verify all fields clear
- [ ] Fill form, navigate away, come back - form resets
- [ ] Multiple successful submissions in a row
- [ ] Submit, wait for success, immediately submit again

## 🔐 Security Tests

### Authorization
- [ ] Admin can access setup page
- [ ] Sub-admin cannot execute setup (if restricted)
- [ ] Farmer cannot access setup page
- [ ] Unauthenticated user redirects to login

### Data Validation
- [ ] SQL injection attempts are prevented
- [ ] XSS attempts are sanitized
- [ ] Invalid JSON is rejected
- [ ] Password is not visible in form
- [ ] Password is not logged in console

## 📊 Performance Tests

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] Material/unit dropdowns load quickly
- [ ] No console errors on load
- [ ] No memory leaks after multiple uses

### Submission Time
- [ ] Simple setup (no materials) completes in < 3 seconds
- [ ] Setup with 5 materials completes in < 5 seconds
- [ ] Loading state provides feedback

## 🐛 Bug Testing

### Known Issues to Check
- [ ] No duplicate API calls
- [ ] No race conditions
- [ ] No infinite loops
- [ ] No memory leaks
- [ ] Form state doesn't persist incorrectly

### Cross-Browser (if applicable)
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

## 📝 Test Scenarios

### Scenario 1: Basic Farm
1. Login as admin
2. Navigate to setup page
3. Enter farmer: "Test Farmer", "test@farm.com", "password123"
4. Enter farm: "Test Farm", "Test Location"
5. Enter warehouse: "Main Warehouse"
6. Enter poultry: "Batch-001", 1000 chicks
7. Skip materials
8. Submit
9. Verify success
10. Verify all entities created

### Scenario 2: Farm with Materials
1. Login as admin
2. Navigate to setup page
3. Fill farmer details
4. Fill farm details
5. Fill warehouse details
6. Fill poultry details
7. Add 3 materials with different types
8. Submit
9. Verify success
10. Verify materials in warehouse

### Scenario 3: Error Recovery
1. Login as admin
2. Navigate to setup page
3. Enter existing farmer email
4. Fill other fields
5. Submit
6. See error
7. Change email
8. Resubmit
9. Verify success

## ✅ Final Checklist

- [ ] All tests passed
- [ ] No console errors
- [ ] No warnings in logs
- [ ] Performance is acceptable
- [ ] UI is responsive
- [ ] Feature ready for production

## 📊 Test Results Summary

**Date**: ___________  
**Tester**: ___________  
**Environment**: ___________  

**Pass Rate**: _____ / _____ (___%)  
**Critical Issues**: _____  
**Minor Issues**: _____  
**Notes**: 
_______________________________________
_______________________________________
_______________________________________
