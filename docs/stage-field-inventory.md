# فهرست فیلدها و گزارش شکاف‌ها (Field Inventory & Gap Report)

این سند خلاصه‌ای از وضعیت فعلی فرم‌های FR-01-01، FR-01-02، FR-01-03، FR-01-10، FR-01-12، FR-01-28 و وضعیت گزارش حادثه است. اطلاعات از کد موجود در app/forms، lib/formEntry و backend/hse استخراج شد.

---

## FR-01-01 — اقدام اصلاحی/پیشگیرانه/تغییرات

### جدول فیلدهای موجود (خلاصه‌شده بر اساس بخش)

| بخش | فیلدهای شاخص | نوع یا کامپوننت | الزام | یادداشت‌های کلیدی |
|-----|---------------|----------------|--------|-------------------|
| اطلاعات کلی | projectId، date، requesterName، requesterUnit، actionNumber | Select، DateInput، TextInput | پروژه، تاریخ و نام‌ها الزامی | پروژه از API projects و شماره اقدام بعد از ذخیره برمی‌گردد. |
| دسته‌بندی اقدام | requestType، actionSource | RadioGroup، CheckboxGroup | هر دو الزامی | گزینه‌های ثابت به enum های RequestType و sources نگاشت می‌شوند. |
| شرح و تحلیل | nonConformityDescription، rootCauseObjective | Textarea | الزامی | پیام‌های خطا در صفحه به صورت کاراکترهای نامشخص ثبت شده‌اند. |
| مدیریت ریسک | riskAssessmentUpdate، riskAssessmentDate، newKnowledgeExperience | RadioGroup، DateInput | پرسش به‌روزرسانی الزامی، تاریخ شرطی | نگاشت بولی و تاریخ به فیلدهای سرور؛ کنترل محدوده ندارد. |
| اقدامات و گزارش‌ها | requiredActions، گزارش مرتبه اول و دوم، effectivenessStatus، newActionNumber | RowRepeater، RadioGroup، DateInput، TextInput | اقدامات باید دارای ردیف معتبر باشند؛ شماره جدید در حالت عدم اثربخشی اجباری است | داده‌ها از طریق createActionItem، submitExecutionReport و submitEffectiveness ارسال می‌شوند. |

### نکات و شکاف‌ها

- state شامل فیلد affectedDocuments است که در UI و API استفاده نمی‌شود.
- پیام‌های خطا در فایل app/forms/fr-01-01/page.tsx به صورت کاراکتر نامشخص نمایش داده می‌شوند و باید بازنویسی شوند.
- تجربه کاربری جدول RowRepeater در موبایل ضعیف است و پیشنهاد می‌شود چیدمان عمودی یا کارت محور شود.

### اتصالات

- وابسته به توابع fetchProjects، createActionForm، createActionItem در lib hse برای ثبت و بازیابی داده است.
- شناسه اقدام خروجی در فرم‌های پیگیری FR-01-02، تغییر FR-01-03 و ریسک FR-01-28 مصرف می‌شود.

---

## FR-01-02 — پیگیری اقدام اصلاحی/پیشگیرانه

| field_key | نوع یا کامپوننت | الزام | نکات اصلی |
|-----------|---------------|--------|-------------|
| actionId | Select | بلی | داده از API actions و در حالت ویرایش مقدار فعلی prepend می‌شود. |
| actionSource | Select | خیر | در UI اختیاری است ولی بک‌اند انتظار مقدار دارد؛ پیشنهاد الزام یا پیام راهنما. |
| issueDesc، actionDesc | Textarea | بلی | اعتبارسنجی در تابع validateState انجام می‌شود. |
| deadline | DateInput | بلی | نگاشت به due_date در ActionTracking. |
| resolutionStatus، isKnowledge، isEffective | RadioGroup | خیر | نگاشت به Boolean؛ گزینه‌ها ثابت هستند. |
| newActionNumber | TextInput | خیر | در صورت نیاز به اقدام جدید استفاده می‌شود. |

- Select موجود prop disabled را پشتیبانی نمی‌کند و باعث خطای typecheck می‌شود.
- منبع اقدام بهتر است الزام یا راهنمای واضح داشته باشد.
- گزارش بازبینی‌ها فقط ثبت می‌شود و خلاصه‌ای به کاربر نمایش داده نمی‌شود.

---

## FR-01-03 — ثبت و پیگیری تغییرات

| field_key | نوع یا کامپوننت | الزام | نکات |
|-----------|---------------|--------|-------|
| actionId | Select | بلی | دریافت از لیست اقدامات؛ در حالت ویرایش مقدار فعلی اضافه می‌شود. |
| registrationDate، implementationDate | DateInput | بلی | نگاشت مستقیم به تاریخ‌های ثبت و اجرا. |
| requiredActions | RowRepeater | بلی | ستون‌ها سریال‌سازی می‌شوند؛ نیازمند راهنمای بهتر برای وضعیت اقدام. |

- پیام‌های خطا در صفحه باید بازنویسی شوند (حروف نامشخص).
- برای ستون وضعیت اقدام راهنمای متنی یا مثال لازم است.

---

## FR-01-10 (PR-01-07-01) — ثبت جلسه TBM

| field_key | نوع یا کامپوننت | الزام | نکات |
|-----------|---------------|--------|-------|
| projectId | Select | بلی | داده از API projects. |
| tbmNumber | TextInput | بلی | باید یکتا باشد؛ سرور کنترل می‌کند. |
| projectLocation | TextInput | بلی | به بک‌اند ارسال می‌شود ولی serializer فعلی آن را نمی‌پذیرد و داده از دست می‌رود. |
| date، subject، instructor | DateInput، TextInput | بلی | نگاشت به date، topic_text و trainer_text. |
| attendees | RowRepeater | بلی | role_text و signature_text هر دو از ستون امضا پر می‌شوند؛ نقش مستقل ثبت نمی‌شود. |
| notes | Textarea | خیر | به notes_text ارسال می‌شود اما serializer آن را نادیده می‌گیرد. |

- serializer بک‌اند نیازمند افزودن فیلدهای location و notes یا حذف ارسال از فرانت است.
- پیشنهاد می‌شود نقش در RowRepeater جدا از امضا جمع‌آوری شود.

---

## FR-01-12 — تشکیل تیم همیاران HSE

| field_key | نوع یا کامپوننت | الزام | نکات |
|-----------|---------------|--------|-------|
| projectId | Select | بلی | داده از API projects. |
| preparer، approver | TextInput | بلی | نگاشت به prepared_by_name و approved_by_name. |
| teamMembers | RowRepeater | بلی | هر ردیف پیمانکار، واحد و بخش را به صورت متنی می‌گیرد و در صورت نبود، رکورد جدید می‌سازد (ریسک داده تکراری). |

- پیشنهاد می‌شود انتخاب‌گر جست‌وجوپذیر برای پیمانکار، واحد و بخش استفاده شود.
- پیام‌های خطا نیازمند بازنویسی فارسی است.

---

## FR-01-28 — ارزیابی ریسک

| بخش | فیلدهای شاخص | نوع یا کامپوننت | الزام | نکات |
|-----|---------------|----------------|--------|-------|
| اطلاعات پایه | projectId، unitId، sectionId | Select | پروژه و واحد الزامی، بخش اختیاری | داده‌ها از سرویس‌های مرجع پروژه و واحد تامین می‌شود. |
| شرح فعالیت | processTitle، activityDesc، hazardDesc، consequenceDesc، controlsDesc | TextInput و Textarea | اغلب الزامی | پیام‌های خطا عمومی است و به کاربر بازخورد جزئی نمی‌دهد. |
| کنترل حقوقی | legalRequirement، legalStatus، riskType | Textarea، RadioGroup | الزامات جزئی | legalStatus در تعیین پذیرش نهایی نقش دارد. |
| امتیازدهی | A، B، C، S، D و مقادیر بازبینی | NumberInput | امتیازات اولیه الزامی؛ بازبینی اختیاری | هیچ محدودیت عددی سمت فرانت اعمال نشده و نتایج محاسبه شده به کاربر نمایش داده نمی‌شود. |
| اتصال اقدام | actionNumber، reevalActionNumber | TextInput | اختیاری مگر پذیرش نامطلوب | کاربر باید شماره اقدام FR-01-01 را دستی وارد کند. |

- نمایش نتایج محاسبه شده (E، P، RPN، acceptance) پیشنهاد می‌شود.
- لازم است بازه اعداد معتبر (۱ تا ۱۰) سمت فرانت کنترل شود.

---

## گزارش حادثه (Incident Report)

- هیچ صفحه یا آداپتر فعالی برای گزارش حادثه در مخزن یافت نشد؛ فرم گزارش حادثه عملاً غایب است.

---

## اتصالات بین فرم‌ها

- شناسه اقدام تولیدی در FR-01-01 در فرم‌های FR-01-02، FR-01-03 و FR-01-28 استفاده می‌شود.
- شماره TBM حاصل از PR-01-07-01 به صورت متنی در FR-01-12 ثبت می‌شود.
- همه فرم‌ها در حالت ویرایش از مسیر FormEntryView بهره می‌گیرند.

---

## Self-check

- npm run lint → شکست (۲۶ خطای lint شامل قوانین any و react-hooks).
- npm run typecheck → شکست (ناسازگاری تایپ Select و FormEntryResponse).
- ./venv/Scripts/python.exe manage.py test → موفق (۱۱ تست پاس).

---

## JSON (خروجی ساختاریافته)


JSON:

    [
      {"form_code": "FR-01-01", "status": "exists", "present_fields_count": 7, "missing_fields": [{"field_key": "affectedDocuments", "reason": "no_ui"}], "responsive_status": "needs_work"},
      {"form_code": "FR-01-02", "status": "exists", "present_fields_count": 6, "missing_fields": [{"field_key": "actionSource", "reason": "validation_mismatch"}], "responsive_status": "ok"},
      {"form_code": "FR-01-03", "status": "exists", "present_fields_count": 5, "missing_fields": [], "responsive_status": "ok"},
      {"form_code": "PR-01-07-01", "status": "exists", "present_fields_count": 6, "missing_fields": [{"field_key": "projectLocation", "reason": "serializer_mismatch"}], "responsive_status": "needs_work"},
      {"form_code": "FR-01-12", "status": "exists", "present_fields_count": 3, "missing_fields": [{"field_key": "contactInfo", "reason": "not_implemented"}], "responsive_status": "needs_work"},
      {"form_code": "FR-01-28", "status": "exists", "present_fields_count": 15, "missing_fields": [{"field_key": "acceptanceDisplay", "reason": "no_ui"}], "responsive_status": "needs_work"},
      {"form_code": "Incident-Report", "status": "missing", "present_fields_count": 0, "missing_fields": [{"field_key": "all", "reason": "not_implemented"}], "responsive_status": "needs_work"}
    ]

