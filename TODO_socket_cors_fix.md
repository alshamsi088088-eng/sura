# TODO: إصلاح أخطاء CORS لـ Socket.IO و 500 في واجهة التطبيق

## الخطوة 1 — جمع معلومات (تم جزئياً)
- [x] فحص server/src/services/socketService.ts
- [x] فحص server/src/app.ts (CORS للـ REST)
- [x] فحص client/src/context/ChatContext.tsx (socketUrl)

## الخطوة 2 — تعديل مسموحات CORS في السيرفر
- [x] تعديل server/src/services/configI.ts لإضافة origin محلي عند الحاجة (حسب هدف الإطلاق)

## الخطوة 3 — تعديل socketUrl في العميل
- [x] تحديث server URL الافتراضي داخل client/src/context/ChatContext.tsx ليتجنب hardcoding


## الخطوة 4 — إعادة التشغيل والتحقق
- [ ] تشغيل السيرفر/إعادة deploy
- [ ] فتح التطبيق من نفس origin الذي ظهرت منه المشكلة
- [ ] التأكد من اختفاء رسائل blocked by CORS و 400 (Bad Request) الخاصة بـ /socket.io
- [ ] التأكد أن /api/content/home لا يزال يعمل (500 تختفي أو تنخفض إلى سبب آخر)

