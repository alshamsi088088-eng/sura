# TODO - Sura Codex - إكمال وإصلاح المتجر

- [x] مراجعة storeController.ts بالكامل (سيتم التنفيذ)
  - [x] تصحيح checkout logic بحيث يتم تطبيق الخصم داخل line_items في Stripe (وليس فقط metadata)
  - [x] إزالة/منع أي placeholder/logic Stripe غير مكتمل
  - [x] تحسين validation و error handling
  - [x] حماية من عدم توفر STRIPE_SECRET_KEY


- [x] تحديث StorePage.tsx
  - [x] إضافة حالة loading/error لزر التحميل
  - [x] (اختياري/مطلوب حسب الكود) إظهار CTA فقط للكتب المشتراة عبر API
  - [x] عدم كسر Cart أو Checkout الحالي

- [x] تحديث ProfilePage.tsx
  - [x] إنشاء قسم "مشترياتي" يعرض الكتب بدون تكرار
  - [x] زر Download لكل كتاب (يستخدم endpoint الموجود)
  - [x] معالجة حالة No purchases

- [x] مراجعة storeRoutes.ts
  - [x] التأكد من ربط جميع routes بالـ Controllers

- [x] تنفيذ TypeScript validation
- [x] تنفيذ build verification
- [x] تقرير نهائي عن أي مشاكل متبقية تمنع الإطلاق الإنتاجي

