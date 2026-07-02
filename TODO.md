- [ ] Replace entire server/src/controllers/authController.ts with a complete implementation exporting all handlers required by server/src/routes/authRoutes.ts
- [ ] Add missing imports (express types, prisma, token helpers)
- [ ] Implement sanitize(user) helper to avoid leaking sensitive fields
- [ ] Implement AuthCallback with proper Express request body typing + validation + upsert user + cookie/token issuance
- [ ] Add basic placeholder implementations for other auth handlers (login/logout/me/register/oauth/password/profile/verify/refresh) to unblock build
- [x] Run `cd server && npm run build` and fix any remaining TypeScript errors


