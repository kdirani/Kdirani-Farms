# Farm Setup Feature - Verification Steps

## ✅ Verification Checklist

After fixing the duplicate key error, follow these steps to verify everything works:

## 1. Start the Development Server

```bash
cd /workspace
pnpm run dev
```

Wait for: `✓ Ready in [time]ms`

## 2. Login as Admin

1. Navigate to `http://localhost:3000/login`
2. Login with admin credentials
3. Verify you're redirected to `/admin`

## 3. Access the Setup Page

### Via URL
- Navigate to: `http://localhost:3000/admin/setup`

### Via Navigation
- Look for sidebar menu
- Find "إعداد مزرعة كاملة" (Complete Farm Setup)
- Click the link with ⚡ icon

**Expected Result**: 
- ✅ Page loads successfully
- ✅ No errors in console
- ✅ Form displays with 5 sections

## 4. Test Basic Setup (No Materials)

Fill in the form:

### Farmer Details
```
Full Name: Test Farmer One
Email: farmer1@test.com
Password: test123456
```

### Farm Details
```
Farm Name: Test Farm Alpha
Location: Test District
☑ Farm is active (checked)
```

### Warehouse Details
```
Warehouse Name: Alpha Storage
```

### Poultry Batch
```
Batch Name: Batch-001
Opening Chicks: 1000
```

### Materials
- Leave empty (don't add any materials)

**Click**: "Create Complete Farm Setup"

**Expected Results**:
- ✅ Loading spinner appears
- ✅ NO "duplicate key" error
- ✅ Success toast notification appears
- ✅ Green success screen shows
- ✅ Form resets after 5 seconds

## 5. Verify Created Entities

### Check User
1. Navigate to `/admin/users`
2. Look for "Test Farmer One"
3. Email should be "farmer1@test.com"
4. Role should be "مزارع" (Farmer)

### Check Farm
1. Navigate to `/admin/farms`
2. Look for "Test Farm Alpha"
3. Should show assigned to "Test Farmer One"
4. Location should be "Test District"
5. Status should be "Active"

### Check Warehouse
1. Navigate to `/admin/warehouses`
2. Look for "Alpha Storage"
3. Should be assigned to "Test Farm Alpha"

### Check Poultry
1. Navigate to `/admin/poultry`
2. Look for "Batch-001"
3. Should be assigned to "Test Farm Alpha"
4. Opening chicks should be 1000
5. Remaining chicks should be 1000

### Check Materials
1. Navigate to `/admin/materials`
2. Should NOT show any materials for "Alpha Storage"
3. This is correct since we didn't add any

## 6. Test Setup with Materials

Go back to `/admin/setup` and create another farm:

### Farmer Details
```
Full Name: Test Farmer Two
Email: farmer2@test.com
Password: test123456
```

### Farm Details
```
Farm Name: Test Farm Beta
Location: Beta District
☑ Farm is active (checked)
```

### Warehouse Details
```
Warehouse Name: Beta Storage
```

### Poultry Batch
```
Batch Name: Batch-002
Opening Chicks: 2000
```

### Materials
Click "Add Material" button **3 times** and fill:

**Material 1:**
- Material: ذرة (Corn) - or any available
- Unit: كيلو جرام (Kilogram) - or any available
- Opening Balance: 100

**Material 2:**
- Material: علف 1 (Feed 1) - or any available
- Unit: كيلو جرام (Kilogram) - or any available
- Opening Balance: 500

**Material 3:**
- Material: كرتون (Carton) - or any available
- Unit: كرتونة (Carton box) - or any available
- Opening Balance: 50

**Click**: "Create Complete Farm Setup"

**Expected Results**:
- ✅ All entities created successfully
- ✅ Materials are created in warehouse

## 7. Verify Second Setup

### Check Materials This Time
1. Navigate to `/admin/materials`
2. Filter or search for "Beta Storage"
3. Should show 3 materials:
   - Material with 100 balance
   - Material with 500 balance
   - Material with 50 balance

## 8. Test Farmer Login

### Logout as Admin
1. Click logout button

### Login as Farmer
1. Navigate to `/login`
2. Email: `farmer1@test.com`
3. Password: `test123456`
4. Click login

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to `/farmer` dashboard
- ✅ Can see farm data
- ✅ Cannot access `/admin` pages

## 9. Test Error Handling

### Duplicate Email Test
1. Logout and login as admin
2. Go to `/admin/setup`
3. Try to create a farm with existing email:
   - Email: `farmer1@test.com` (already exists)
   - Fill other fields
   - Submit

**Expected Results**:
- ❌ Error message appears
- ✅ Clear error about duplicate email or user already exists
- ✅ Form remains editable
- ✅ Can fix and retry

### Validation Test
1. Go to `/admin/setup`
2. Leave all fields empty
3. Click submit

**Expected Results**:
- ❌ Validation errors appear for required fields
- ✅ Red error messages under each field
- ✅ Cannot submit until fixed

## 10. Test Material Management

1. Go to `/admin/setup`
2. Fill required fields
3. Click "Add Material" 5 times
4. Fill 3 materials
5. Click trash icon on 2nd and 4th materials
6. Should have 3 materials left (1st, 3rd, 5th)
7. Submit

**Expected Results**:
- ✅ Only 3 materials are created (not 5)
- ✅ Correct materials are created

## 11. Performance Test

Create 3 farms in quick succession:

1. Create farm with 0 materials
2. Create farm with 5 materials
3. Create farm with 10 materials

**Expected Results**:
- ✅ Each completes in < 5 seconds
- ✅ No timeout errors
- ✅ No memory issues
- ✅ All farms created successfully

## 12. Console Check

Throughout all tests, check browser console:

**Expected**:
- ✅ No JavaScript errors
- ✅ No network errors (except expected 401 when logged out)
- ✅ No React warnings
- ✅ No memory leaks

## 13. Mobile Responsiveness

1. Open dev tools
2. Toggle device toolbar
3. Test on:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

**Expected Results**:
- ✅ Form is usable on all screen sizes
- ✅ Buttons are accessible
- ✅ No horizontal scroll
- ✅ Text is readable

## ✅ Final Verification

All items checked? The feature is ready! 🎉

## 🐛 If Something Fails

### Check Logs
```bash
# Server logs
Check terminal where dev server is running

# Browser console
F12 → Console tab

# Network tab
F12 → Network tab → Check failed requests
```

### Common Issues

**Issue**: "Unauthorized" error
- **Solution**: Make sure you're logged in as admin

**Issue**: Material/Unit dropdowns are empty
- **Solution**: Check database has data in `materials_names` and `measurement_units` tables

**Issue**: Page won't load
- **Solution**: Check dev server is running, check for console errors

**Issue**: Form won't submit
- **Solution**: Check validation errors, ensure all required fields are filled

### Get Help

If issues persist:
1. Check `/workspace/BUGFIX_PROFILE_DUPLICATE_KEY.md`
2. Check `/workspace/docs/farm-setup-feature.md`
3. Check server logs for errors
4. Verify database trigger exists (see schema.md)

## 📊 Success Criteria

- [ ] Can access setup page
- [ ] Can create farm without materials
- [ ] Can create farm with materials
- [ ] No duplicate key errors
- [ ] All entities created correctly
- [ ] Farmer can login
- [ ] Error handling works
- [ ] Form validation works
- [ ] Responsive on all devices
- [ ] No console errors

**All checked?** Feature is production-ready! ✅
