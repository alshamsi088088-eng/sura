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


---

# TODO - Sura Codex - MVP-first (مرحلة 1)
- [x] إضافة/تحديث Tabs وروابط إنشاء المحتوى في Navbar
  - [x] إضافة Create Post / Create Tech / Gallery (روابط)
  - [ ] التأكد من تقييد Books/Store للأدمن فقط (Route/Visibility)
- [ ] تحسين Create Novel/Post/Tech الأساسية (تصير “جاهزة لـ MVP”)
  - [x] Create Tech: إصلاح حفظ TechArticle عبر توافق schema (حذف githubUrl/demoUrl من payload لأنهما غير موجودين في schema)
  - [x] Create Novel: Redirect بعد إنشاء Novel إلى CreateChapter مع تمرير novelId عبر query
  - [x] Create Chapter: تعبئة novelId تلقائيًا من query
  - [ ] Create Novel: دعم رفع ملف الرواية (PDF/DOCX/TXT) + حفظ Novel وربط chapters (إن وجد) (بدون Migration في هذا MVP الحالي)
  - [ ] Create Post: إدخال Rich Editor + Live Preview
  - [ ] Create Tech: Syntax Highlighting + تحسين UI للـ Code Snippets (MVP: بلوك واحد على الأقل)
- [ ] تفعيل/توحيد نظام التفاعل على صفحات التفاصيل
  - [ ] Like Button + Like count
  - [ ] Save/Bookmark
  - [ ] Nested Comments + Reply
  - [ ] Rating Stars (1-5) + average + count
  - [ ] Emoji reactions + counters
  - [ ] التأكد من أن كل هذه التفاعلات تعمل في:
    - [ ] صفحة المقالات (Article detail)
    - [ ] صفحة الروايات (Novel/Chapter detail)
    - [ ] صفحة Tech articles
- [ ] Lighthouse/Performance: Lazy Loading للصور في Gallery/Covers
- [ ] فحص TypeScript + build verify بعد كل دفعة

