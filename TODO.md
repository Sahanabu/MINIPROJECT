# AssetFlow Development TODO

## Phase 1: Implement Asset Editing Functionality ✅
- [x] Add updateAsset thunk in assetsSlice.ts
- [x] Add getAsset thunk in assetsSlice.ts (if needed)
- [x] Update AssetsList.tsx: Make Edit button navigate to edit mode
- [x] Update AssetForm.tsx: Add edit mode detection, prefill data, handle file re-uploads
- [x] Update App.tsx: Add route for edit mode
- [x] Enhance backend updateAsset to handle multipart files
- [x] Update assetRoutes.js: Ensure PUT route supports multer
- [x] Test asset editing: Create asset, edit fields and files, verify updates

## Phase 2: Add Authentication System ✅
- [x] Create User model with roles
- [x] Implement login/register endpoints with JWT
- [x] Add auth middleware for protected routes
- [x] Update frontend to handle login/logout, store tokens
- [x] Add login route and protect routes with ProtectedRoute
- [x] Add registration page with role selection
- [x] Update AssetForm to auto-fill officer from logged-in user
- [x] Update AssetsList to navigate to edit page on edit button click
- [x] Add Google OAuth authentication option

## Phase 3: UI Polish
- [ ] Replace department IDs with names in admin panel
- [ ] Improve error handling with global toast system
- [ ] Add loading states where needed

## Phase 4: File Previews (Optional)
- [ ] Add modal to preview bill files inline
