# نشر سفرة على SnapDeploy (من غير بطاقة)

## 1) ارفع المشروع على GitHub
```bash
cd sofra-restaurant
git init
git add .
git commit -m "Sofra restaurant"
git branch -M main
# أنشئ ريبو فاضي على github.com وبعدين:
git remote add origin https://github.com/USERNAME/sofra-restaurant.git
git push -u origin main
```
`.gitignore` بيمنع رفع `node_modules` و`.env` وملف الطلبات.

## 2) انشر
1. سجّل في snapdeploy.dev (من غير بطاقة).
2. Deploy ← Connect GitHub ← اختار الريبو.
3. أضف متغيرات البيئة:
   - `NODE_ENV` = `production`
   - `ADMIN_PASSWORD` = كلمة سر قوية من عندك (لازم، السيرفر مش هيشتغل من غيرها)
4. اضغط Deploy وانتظر اللينك.

## 3) جرّب
- افتح اللينك واطلب أي طبق.
- افتح `/admin.html` وادخل بكلمة السر.
- `/healthz` لازم يرجّع `ok`.

## تنبيه
الطلبات بتتحفظ في `DATA_DIR`. لو الاستضافة بتمسح القرص عند إعادة التشغيل، الطلبات هتضيع،
فاعتبر النشر ده تجريبي لحد ما ننقل التخزين لقاعدة بيانات خارجية.
