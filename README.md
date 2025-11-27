# BloggerShow Android App

این پروژه برای تبدیل شدن به اپلیکیشن اندرویدی (APK) آماده شده است.

## نحوه ساخت APK با گیتهاب (سریع)
1. کدها را در یک ریپازیتوری گیتهاب Push کنید.
2. به تب **Actions** بروید.
3. ورک‌فلوی **Build Android APK** را اجرا کنید.
4. فایل APK ساخته شده را از بخش Artifacts دانلود کنید.

## نحوه ساخت روی سیستم شخصی
1. `npm install`
2. `npm run build`
3. `npx cap add android`
4. `npx cap open android`
5. در اندروید استودیو خروجی Signed APK بگیرید.
