# 🎨 راهنمای طراحی UI/UX - سیستم‌های وب مدرن

## 📋 مقدمه

این راهنما شامل اصول طراحی UI/UX است که در پروژه‌های مختلف قابل استفاده است. این مستندات بر اساس تجربه توسعه سیستم‌های وب مدرن و بهترین practices صنعت تهیه شده است.

---

## 🎯 اصول کلی طراحی

### 1. **طراحی کاربرمحور (User-Centered Design)**
- **قابلیت استفاده (Usability)**: رابط کاربری باید ساده و قابل فهم باشد
- **دسترسی‌پذیری (Accessibility)**: پشتیبانی از کاربران با نیازهای خاص
- **عملکرد (Performance)**: سرعت بارگذاری و پاسخگویی بالا
- **سازگاری (Compatibility)**: کارکرد در تمام دستگاه‌ها و مرورگرها

### 2. **اصول طراحی بصری**
- **سلسله مراتب بصری**: استفاده از اندازه، رنگ و فاصله برای ایجاد سلسله مراتب
- **تعادل و تناسب**: توزیع مناسب عناصر در صفحه
- **یکپارچگی**: استفاده از الگوهای طراحی یکسان در تمام بخش‌ها
- **سادگی**: اجتناب از پیچیدگی‌های غیرضروری

---

## 🎨 سیستم رنگ‌بندی

### **پالت رنگ اصلی**

```css
/* رنگ‌های پس‌زمینه */
--bg-primary: #F7FAFC;        /* پس‌زمینه اصلی */
--bg-surface: #FFFFFF;        /* پس‌زمینه کارت‌ها */
--bg-muted: #F8F9FA;          /* پس‌زمینه غیرفعال */

/* رنگ‌های متن */
--text-primary: #111827;      /* متن اصلی */
--text-secondary: #4B5563;    /* متن ثانویه */
--text-muted: #9CA3AF;        /* متن کم‌رنگ */

/* رنگ‌های اصلی */
--primary: #3B82F6;           /* آبی اصلی */
--primary-hover: #2563EB;     /* آبی hover */
--primary-subtle: #DBEAFE;    /* آبی کم‌رنگ */

/* رنگ‌های ثانویه */
--accent: #0EA5A4;            /* سبز-آبی */
--accent-hover: #0C8E8D;      /* سبز-آبی hover */
--accent-subtle: #CCFBF1;     /* سبز-آبی کم‌رنگ */

/* رنگ‌های وضعیت */
--success: #16A34A;           /* سبز موفقیت */
--warning: #F59E0B;           /* زرد هشدار */
--danger: #DC2626;            /* قرمز خطا */
--info: #0284C7;              /* آبی اطلاعات */

/* رنگ‌های مرزی */
--border: #E5E7EB;            /* مرز اصلی */
--divider: #EEF2F7;           /* جداکننده */
--focus: #93C5FD;             /* حالت فوکوس */
```

### **اصول استفاده از رنگ‌ها**

1. **رنگ اصلی (Primary)**: برای دکمه‌های اصلی، لینک‌ها و عناصر مهم
2. **رنگ ثانویه (Accent)**: برای تأکید و عناصر مکمل
3. **رنگ‌های وضعیت**: برای نمایش وضعیت‌های مختلف (موفقیت، خطا، هشدار)
4. **رنگ‌های خنثی**: برای متن‌ها، پس‌زمینه‌ها و مرزها

---

## 📝 سیستم تایپوگرافی

### **فونت‌های پیشنهادی**

```css
/* فونت اصلی */
font-family: 'Peyda', 'Vazir', 'Tahoma', system-ui, -apple-system, sans-serif;

/* فونت‌های انگلیسی */
font-family: 'Inter', 'Roboto', 'Segoe UI', system-ui, sans-serif;
```

### **سایزهای فونت**

```css
/* سایزهای متن */
--text-xs: 0.75rem;      /* 12px - متن‌های کوچک */
--text-sm: 0.875rem;     /* 14px - متن‌های معمولی */
--text-base: 1rem;       /* 16px - متن اصلی */
--text-lg: 1.125rem;     /* 18px - متن بزرگ */
--text-xl: 1.25rem;      /* 20px - عنوان‌های کوچک */
--text-2xl: 1.5rem;      /* 24px - عنوان‌های متوسط */
--text-3xl: 1.875rem;    /* 30px - عنوان‌های بزرگ */
--text-4xl: 2.25rem;     /* 36px - عنوان‌های اصلی */
```

### **وزن‌های فونت**

```css
--font-normal: 400;      /* معمولی */
--font-medium: 500;      /* متوسط */
--font-semibold: 600;    /* نیمه‌ضخیم */
--font-bold: 700;        /* ضخیم */
```

---

## 🧩 کامپوننت‌های UI

### **1. دکمه‌ها (Buttons)**

#### **دکمه اصلی (Primary Button)**
```css
.btn-primary {
    background: var(--primary);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-primary:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
```

#### **دکمه ثانویه (Secondary Button)**
```css
.btn-secondary {
    background: transparent;
    color: var(--primary);
    border: 2px solid var(--primary);
    padding: 10px 22px;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-secondary:hover {
    background: var(--primary-subtle);
}
```

#### **دکمه خطر (Danger Button)**
```css
.btn-danger {
    background: var(--danger);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-danger:hover {
    background: #B91C1C;
}
```

### **2. فیلدهای ورودی (Input Fields)**

#### **فیلد متنی (Text Input)**
```css
.form-control {
    width: 100%;
    height: 44px;
    padding: 12px 16px;
    border: 2px solid var(--border);
    border-radius: 12px;
    background: var(--bg-surface);
    font-size: 14px;
    transition: all 0.2s ease;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-subtle);
}

.form-control::placeholder {
    color: var(--text-muted);
}
```

#### **برچسب فیلد (Label)**
```css
.form-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.form-label.required::after {
    content: " *";
    color: var(--danger);
}
```

### **3. کارت‌ها (Cards)**

```css
.card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
}

.card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.card-header {
    border-bottom: 1px solid var(--divider);
    padding-bottom: 16px;
    margin-bottom: 16px;
}

.card-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}
```

### **4. نوار ناوبری (Navigation)**

```css
.navbar {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    padding: 0 24px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
}

.nav-links {
    display: flex;
    gap: 32px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-link {
    color: var(--text-secondary);
    text-decoration: none;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.nav-link:hover,
.nav-link.active {
    color: var(--primary);
    background: var(--primary-subtle);
}
```

---

## 📱 طراحی ریسپانسیو

### **Breakpoint ها**

```css
/* موبایل */
@media (max-width: 640px) {
    .container { padding: 16px; }
    .card { padding: 16px; }
    .btn-primary { padding: 10px 20px; }
}

/* تبلت */
@media (min-width: 641px) and (max-width: 1024px) {
    .container { padding: 24px; }
    .grid { grid-template-columns: repeat(2, 1fr); }
}

/* دسکتاپ */
@media (min-width: 1025px) {
    .container { max-width: 1200px; margin: 0 auto; }
    .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### **اصول طراحی ریسپانسیو**

1. **Mobile First**: طراحی ابتدا برای موبایل
2. **Flexible Grid**: استفاده از Grid و Flexbox
3. **Responsive Images**: تصاویر با اندازه متغیر
4. **Touch-Friendly**: دکمه‌ها و لینک‌های مناسب برای لمس

---

## 🌍 پشتیبانی از زبان‌های RTL

### **تنظیمات RTL**

```css
/* تنظیمات کلی */
html[dir="rtl"] {
    direction: rtl;
    text-align: right;
}

/* فاصله‌گذاری RTL */
.rtl-space-x > * + * {
    margin-right: 0.5rem;
    margin-left: 0;
}

.rtl-space-x-reverse > * + * {
    margin-left: 0.5rem;
    margin-right: 0;
}

/* آیکون‌های RTL */
.rtl-icon {
    transform: scaleX(-1);
}
```

---

## ⚡ انیمیشن‌ها و ترانزیشن‌ها

### **انیمیشن‌های پایه**

```css
/* ترانزیشن‌های نرم */
.transition-smooth {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* انیمیشن hover */
.hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* انیمیشن fade */
.fade-in {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* انیمیشن slide */
.slide-in-right {
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
```

---

## 🎯 اصول UX

### **1. قابلیت استفاده (Usability)**

- **سادگی**: رابط کاربری باید ساده و قابل فهم باشد
- **ثبات**: استفاده از الگوهای یکسان در تمام بخش‌ها
- **بازخورد**: ارائه بازخورد مناسب به کاربر
- **کنترل کاربر**: امکان لغو و بازگشت عملیات

### **2. دسترسی‌پذیری (Accessibility)**

```css
/* فوکوس قابل مشاهده */
.focus-visible:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}

/* کنتراست مناسب */
.high-contrast {
    color: var(--text-primary);
    background: var(--bg-surface);
}

/* اندازه مناسب برای لمس */
.touch-target {
    min-height: 44px;
    min-width: 44px;
}
```

### **3. عملکرد (Performance)**

- **Lazy Loading**: بارگذاری تدریجی تصاویر و محتوا
- **Code Splitting**: تقسیم کد برای بارگذاری سریع‌تر
- **Caching**: استفاده از کش برای بهبود عملکرد
- **Optimization**: بهینه‌سازی تصاویر و فایل‌ها

---

## 📊 سیستم Grid و Layout

### **Grid System**

```css
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

.grid {
    display: grid;
    gap: 24px;
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Responsive Grid */
@media (max-width: 768px) {
    .grid-cols-2,
    .grid-cols-3,
    .grid-cols-4 {
        grid-template-columns: 1fr;
    }
}
```

### **Flexbox Utilities**

```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 1rem; }
.gap-8 { gap: 2rem; }
```

---

## 🎨 Dark Mode Support

### **تنظیمات Dark Mode**

```css
/* متغیرهای Dark Mode */
:root[data-theme="dark"] {
    --bg-primary: #0F172A;
    --bg-surface: #1E293B;
    --text-primary: #F8FAFC;
    --text-secondary: #CBD5E1;
    --border: #334155;
    --primary: #60A5FA;
    --primary-hover: #3B82F6;
}

/* تابع تغییر تم */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
```

---

## 📋 چک‌لیست طراحی

### **قبل از شروع طراحی**

- [ ] تعریف هدف و مخاطبان پروژه
- [ ] انتخاب پالت رنگ مناسب
- [ ] تعریف سیستم تایپوگرافی
- [ ] طراحی Wireframe و Mockup
- [ ] تعریف کامپوننت‌های مورد نیاز

### **در حین طراحی**

- [ ] رعایت اصول طراحی بصری
- [ ] استفاده از Grid System
- [ ] پیاده‌سازی Responsive Design
- [ ] اضافه کردن انیمیشن‌های مناسب
- [ ] تست در دستگاه‌های مختلف

### **بعد از طراحی**

- [ ] تست قابلیت استفاده
- [ ] بررسی دسترسی‌پذیری
- [ ] بهینه‌سازی عملکرد
- [ ] تست در مرورگرهای مختلف
- [ ] جمع‌آوری بازخورد کاربران

---

## 🛠️ ابزارهای پیشنهادی

### **طراحی**
- **Figma**: طراحی UI/UX و Prototyping
- **Adobe XD**: طراحی رابط کاربری
- **Sketch**: طراحی برای Mac
- **InVision**: Prototyping و Collaboration

### **توسعه**
- **Tailwind CSS**: Framework CSS
- **Styled Components**: CSS-in-JS
- **Sass/SCSS**: Preprocessor CSS
- **PostCSS**: Post-processor CSS

### **تست و بهینه‌سازی**
- **Lighthouse**: تست عملکرد و SEO
- **WebPageTest**: تست سرعت
- **Accessibility Insights**: تست دسترسی‌پذیری
- **BrowserStack**: تست Cross-browser

---

## 📚 منابع و مراجع

### **مقالات مفید**
- [Material Design Guidelines](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Web Content Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### **کتاب‌های پیشنهادی**
- "Don't Make Me Think" - Steve Krug
- "The Design of Everyday Things" - Don Norman
- "Atomic Design" - Brad Frost

---

## 🎯 نتیجه‌گیری

این راهنما شامل اصول و الگوهای طراحی UI/UX است که می‌تواند در پروژه‌های مختلف استفاده شود. نکته مهم این است که:

1. **سادگی** همیشه بهتر از پیچیدگی است
2. **کاربر** در مرکز تمام تصمیمات طراحی قرار دارد
3. **ثبات** در طراحی باعث بهبود تجربه کاربری می‌شود
4. **تست** مداوم با کاربران واقعی ضروری است
5. **بهینه‌سازی** مداوم برای بهبود عملکرد

با رعایت این اصول و استفاده از الگوهای ارائه شده، می‌توانید رابط‌های کاربری زیبا، کاربردی و قابل دسترس ایجاد کنید.

---

*این راهنما بر اساس تجربه توسعه سیستم‌های وب مدرن و بهترین practices صنعت تهیه شده است و می‌تواند در پروژه‌های مختلف مورد استفاده قرار گیرد.*







