// Admin-interface translations — this is about the language THIS APP's own
// Shopify admin pages (Dashboard/Settings/Billing) render in for the
// merchant using it. Completely separate from the "Storefront language"
// setting on the Settings page, which controls what shoppers see in the
// try-on widget itself (limited to whatever @lumiframe/sdk actually has
// translations for: en/uk/ru — not this app's own list).
//
// Plain lookup table, no external i18n library: keeps this dependency-free
// and easy for a non-developer merchant's requests ("add Polish", "drop
// Russian") to map directly onto editing this one file.

export const ADMIN_LANGUAGES = ["en", "uk", "pl", "cs", "de"];

export const ADMIN_LANGUAGE_NAMES = {
  en: "English",
  uk: "Українська",
  pl: "Polski",
  cs: "Čeština",
  de: "Deutsch",
};

const en = {
  "nav.dashboard": "Dashboard",
  "nav.settings": "Settings",
  "nav.billing": "Billing",

  "dashboard.connectBannerTitle": "Connect to Lumi Frame to go live",
  "dashboard.connectBannerBody":
    "This app forwards try-on requests to Lumi Frame — it doesn't run its own AI. Go to Settings to connect (automatic, nothing to paste) and turn the storefront widget on.",
  "dashboard.goToSettings": "Go to Settings",
  "dashboard.subtitle": "Last 30 days",
  "dashboard.statTryOns": "Try-ons",
  "dashboard.statUniqueVisitors": "Unique visitors",
  "dashboard.statOrdersAttributed": "Orders attributed",
  "dashboard.topProducts": "Top products",
  "dashboard.topProductsRow": "{title} — {tryOns} try-ons",
  "dashboard.noTryOnsYet":
    'No try-ons yet. Add the "AI Glasses Try-On" block to your product template from the theme editor to start collecting data.',

  "billing.trialBanner": "First {limit} try-ons free, no plan needed",
  "billing.trialBannerBody":
    "Prices here are placeholders for launch — edit them in app/billing.js before submitting to the App Store.",
  "billing.currentPlanBadge": "Current plan",
  "billing.perMonth": "/ month",
  "billing.upToQuota": "Up to {quota} try-ons / month",
  "billing.active": "Active",
  "billing.choosePlan": "Choose plan",
  "billing.manualStepTitle": "One manual step after subscribing",
  "billing.manualStepBody":
    "Shopify billing controls what the merchant pays here — it doesn't touch Lumi Frame's own quota. Lumi Frame has no self-serve plan API; after a plan change, assign the matching plan to this merchant's Lumi Frame account yourself, in Lumi Frame's own admin console.",
  "billing.needsReloadTitle": "One-time reset needed",
  "billing.needsReloadBody":
    "Found a stale session for this store and cleared it. Please fully reload this page (Cmd/Ctrl+R, not just clicking a link) so Shopify re-authenticates the app from scratch, then try again.",

  "settings.savedTitle": "Saved",
  "settings.savedBody": "Your settings were saved.",
  "settings.saveFailedTitle": "Couldn't save",
  "settings.lumiFrameAccount": "Lumi Frame account",
  "settings.connectedBadge": "Connected",
  "settings.connectedBody": "This store is connected to Lumi Frame. Nothing to paste — it was set up automatically.",
  "settings.connectBody":
    "Sets up try-on for this store automatically — creates a Lumi Frame account and store behind the scenes. Nothing to copy or paste.",
  "settings.connectButton": "Connect to Lumi Frame",
  "settings.planTitle": "Plan",
  "settings.planCurrent": "Current plan: {plan}",
  "settings.planNone": "No active plan — the widget can't be enabled until you choose one.",
  "settings.managePlan": "Manage plan",
  "settings.choosePlan": "Choose a plan",
  "settings.designTitle": "Design and integration",
  "settings.designSubtitle": 'Configure how the "Try on" button looks on your site.',

  "settings.storefrontLanguage": "Storefront language",
  "settings.storefrontLanguageHelp": "Auto-detect follows each shopper's own storefront language.",
  "settings.appLanguage": "App language",
  "settings.appLanguageHelp": "The language this admin screen itself is shown in — not the storefront widget.",
  "settings.saveLanguage": "Save",

  "langOpt.auto": "Auto-detect (recommended)",
  "langOpt.alwaysEn": "Always English",
  "langOpt.alwaysUk": "Always Ukrainian",
  "langOpt.alwaysRu": "Always Russian",

  "tab.button": "Button",
  "tab.modal": "Try-on window",
  "tab.card": "Mini-card button",
  "tab.visibility": "Which products",

  "settings.buttonText": "Button text",
  "settings.autoMatchTheme": "Automatically match my store's theme",
  "settings.autoMatchThemeHelp":
    'Copies the color and shape of your theme\'s own "Add to cart" button — the fields below are ignored while this is on.',
  "settings.fill": "Fill",
  "settings.colorGradientStart": "Color (gradient start)",
  "settings.color": "Color",
  "settings.colorGradientEnd": "Color (gradient end)",
  "settings.textColor": "Text color",
  "settings.buttonSize": "Button size — {pct}%",
  "settings.buttonWidth": "Button width — {pct}%",
  "settings.shape": "Shape",
  "settings.animation": "Animation",
  "settings.placement": "Placement",
  "settings.glowEffect": "Glow effect",

  "fillOpt.gradient": "Gradient",
  "fillOpt.solid": "Solid",
  "fillOpt.outline": "Outline",
  "shapeOpt.rounded": "Rounded",
  "shapeOpt.rectangular": "Rectangular",
  "animOpt.none": "None",
  "animOpt.pulse": "Pulse",
  "animOpt.shimmer": "Shimmer",
  "posOpt.before": "Before add to cart",
  "posOpt.after": "After add to cart",
  "posOpt.floating": "Floating",

  "settings.heading": "Heading",
  "settings.subheading": "Subheading",
  "settings.accentColorStart": "Accent color (start)",
  "settings.accentColorStartHelp": "Leave blank to reuse the button's colors.",
  "settings.accentColorEnd": "Accent color (end)",
  "settings.accentTextColor": "Accent text color",
  "settings.layout": "Layout",
  "settings.showTryAnother": 'Show "Try another photo" button',
  "settings.showBack": "Show back button",

  "layoutOpt.split": "Split (full-page)",
  "layoutOpt.compact": "Compact (floating card)",

  "settings.cardEnable": "Also show a Try On button on product cards in your catalog/collection pages",
  "settings.cardStyle": "Card button style",
  "settings.cardReuse": "Reuses the button colors/style set on the Button tab.",

  "cardOpt.corner": "Corner",
  "cardOpt.drawer": "Drawer",
  "cardOpt.scrim": "Scrim",

  "settings.showOn": "Show the button on",
  "visOpt.all": "All products",
  "visOpt.collection": "Only a specific collection",
  "visOpt.products": "Only specific products",

  "settings.changeCollection": "Change collection",
  "settings.chooseCollection": "Choose collection",
  "settings.collectionOnly": 'Only products in this collection will show the "Try on" button.',
  "settings.changeProducts": "Change products",
  "settings.chooseProducts": "Choose products",
  "settings.productsOnly":
    'Only the products picked here will show the "Try on" button — every other product on your site keeps it hidden.',
  "settings.visibilityCardNote":
    "Note: this only controls the button on the product page. The mini-card button on catalog pages (previous tab) doesn't filter by product yet — ask if you'd like that added too.",

  "settings.enableWidget": "Enable the try-on widget on your storefront",
  "settings.save": "Save",

  "settings.livePreview": "Live preview",
  "settings.livePreviewHelp": "Updates as you change settings on the left — not saved yet, and not what shoppers see until you press Save.",

  "preview.autoMatchNote":
    'Auto-match is on — the button will copy your theme\'s real "Add to cart" button color and shape on your actual store. This preview can\'t show that here (it only sees this settings page, not your storefront) — check the button on the real product page instead.',
  "preview.addToCart": "Add to cart",
  "preview.productPhoto": "Product photo",
  "preview.aviatorSunglasses": "Aviator Sunglasses",
  "preview.dropPhoto": "Drop a photo here",
  "preview.generateTryOn": "Generate try-on",
  "preview.backToProduct": "Back to product",
  "preview.tryAnotherPhoto": "Try another photo",
  "preview.cardEnableFirst": "Turn on the checkbox above to preview the mini-card button.",
  "preview.tryOn": "Try on",
  "preview.productName": "Product name",
  "preview.collectionOnlyPreview": "Only products in {collection} will show the button.",
  "preview.pickCollectionFirst": "Pick a collection to see it summarized here.",
  "preview.productsOnlyPreview": "The button will only show on these {count} product(s).",
  "preview.pickProductFirst":
    'Pick at least one product — until then the button shows everywhere, same as "All products".',
  "preview.allProducts": "The button will show on every product page.",

  "settings.addToTheme": "Add the button to your theme",
  "settings.addToThemeBody":
    'Open the theme editor → Product template → Add block → look for "AI Glasses Try-On", then place it near the price or Add to cart button.',

  "err.malformedData": "Malformed appearance data — please reload and try again.",
  "err.connectFirst": "Connect to Lumi Frame before enabling the widget.",
  "err.choosePlanFirst": "Choose a plan on the Billing page before enabling the widget.",
  "err.couldNotConnect": "Could not connect to Lumi Frame: {error}",

  "billing.unavailableTitle": "Billing isn't available yet",
  "billing.unavailableBody":
    "Shopify only opens up its Billing API to a Public app once it's been reviewed and approved for the App Store — this store can't subscribe to a plan until then. The widget itself keeps working in the meantime; nothing here is broken, it's a normal step before launch.",
  "billing.checkoutFailedTitle": "Couldn't start checkout",
  "err.billingUnavailable":
    "Shopify billing isn't available for this app yet — it only opens up after the app has been reviewed for the App Store.",
};

const uk = {
  "nav.dashboard": "Головна",
  "nav.settings": "Налаштування",
  "nav.billing": "Оплата",

  "dashboard.connectBannerTitle": "Підключіться до Lumi Frame, щоб запустити віджет",
  "dashboard.connectBannerBody":
    "Цей додаток передає запити на примірку в Lumi Frame — власного ШІ в нього немає. Перейдіть у Налаштування, щоб підключитися (автоматично, нічого вставляти не потрібно) і увімкнути віджет на вітрині.",
  "dashboard.goToSettings": "Перейти до налаштувань",
  "dashboard.subtitle": "За останні 30 днів",
  "dashboard.statTryOns": "Примірки",
  "dashboard.statUniqueVisitors": "Унікальні відвідувачі",
  "dashboard.statOrdersAttributed": "Пов'язані замовлення",
  "dashboard.topProducts": "Топ товарів",
  "dashboard.topProductsRow": "{title} — {tryOns} примірок",
  "dashboard.noTryOnsYet":
    'Ще немає примірок. Додайте блок "AI Glasses Try-On" до шаблону товару в редакторі теми, щоб почати збирати дані.',

  "billing.trialBanner": "Перші {limit} примірок безкоштовно, тариф не потрібен",
  "billing.trialBannerBody":
    "Ціни тут — заглушки для запуску, змініть їх у app/billing.js перед публікацією в App Store.",
  "billing.currentPlanBadge": "Поточний тариф",
  "billing.perMonth": "/ місяць",
  "billing.upToQuota": "До {quota} примірок на місяць",
  "billing.active": "Активний",
  "billing.choosePlan": "Обрати тариф",
  "billing.manualStepTitle": "Один ручний крок після оформлення підписки",
  "billing.manualStepBody":
    "Оплата Shopify визначає, скільки платить продавець тут — на власну квоту Lumi Frame це не впливає. У Lumi Frame немає окремого API для тарифів; після зміни тарифу призначте відповідний тариф цьому продавцю вручну, у власній адмінці Lumi Frame.",
  "billing.needsReloadTitle": "Потрібне одноразове скидання",
  "billing.needsReloadBody":
    "Знайдено застарілу сесію для цього магазину — її очищено. Будь ласка, повністю перезавантажте цю сторінку (Cmd/Ctrl+R, а не просто клік по посиланню), щоб Shopify заново авторизував додаток, і спробуйте ще раз.",

  "settings.savedTitle": "Збережено",
  "settings.savedBody": "Ваші налаштування збережено.",
  "settings.saveFailedTitle": "Не вдалося зберегти",
  "settings.lumiFrameAccount": "Обліковий запис Lumi Frame",
  "settings.connectedBadge": "Підключено",
  "settings.connectedBody": "Цей магазин підключено до Lumi Frame. Нічого вставляти не потрібно — все налаштовано автоматично.",
  "settings.connectBody":
    "Автоматично налаштовує примірку для цього магазину — створює обліковий запис і магазин у Lumi Frame за лаштунками. Нічого копіювати чи вставляти.",
  "settings.connectButton": "Підключити до Lumi Frame",
  "settings.planTitle": "Тариф",
  "settings.planCurrent": "Поточний тариф: {plan}",
  "settings.planNone": "Немає активного тарифу — увімкнути віджет можна лише після його вибору.",
  "settings.managePlan": "Керувати тарифом",
  "settings.choosePlan": "Обрати тариф",
  "settings.designTitle": "Дизайн і інтеграція",
  "settings.designSubtitle": 'Налаштуйте, як кнопка "Приміряти" виглядає на вашому сайті.',

  "settings.storefrontLanguage": "Мова вітрини",
  "settings.storefrontLanguageHelp": "Автовизначення підлаштовується під мову вітрини для кожного покупця.",
  "settings.appLanguage": "Мова додатку",
  "settings.appLanguageHelp": "Мова цього екрана адмінки — не вітрини магазину.",
  "settings.saveLanguage": "Зберегти",

  "langOpt.auto": "Автовизначення (рекомендовано)",
  "langOpt.alwaysEn": "Завжди англійська",
  "langOpt.alwaysUk": "Завжди українська",
  "langOpt.alwaysRu": "Завжди російська",

  "tab.button": "Кнопка",
  "tab.modal": "Вікно примірки",
  "tab.card": "Кнопка на мінікартці",
  "tab.visibility": "На яких товарах",

  "settings.buttonText": "Текст кнопки",
  "settings.autoMatchTheme": "Автоматично підлаштувати під тему магазину",
  "settings.autoMatchThemeHelp":
    'Копіює колір і форму кнопки "Додати в кошик" вашої теми — поля нижче ігноруються, поки це увімкнено.',
  "settings.fill": "Заливка",
  "settings.colorGradientStart": "Колір (початок градієнта)",
  "settings.color": "Колір",
  "settings.colorGradientEnd": "Колір (кінець градієнта)",
  "settings.textColor": "Колір тексту",
  "settings.buttonSize": "Розмір кнопки — {pct}%",
  "settings.buttonWidth": "Ширина кнопки — {pct}%",
  "settings.shape": "Форма",
  "settings.animation": "Анімація",
  "settings.placement": "Розташування",
  "settings.glowEffect": "Ефект світіння",

  "fillOpt.gradient": "Градієнт",
  "fillOpt.solid": "Суцільний",
  "fillOpt.outline": "Контур",
  "shapeOpt.rounded": "Заокруглена",
  "shapeOpt.rectangular": "Прямокутна",
  "animOpt.none": "Немає",
  "animOpt.pulse": "Пульсація",
  "animOpt.shimmer": "Мерехтіння",
  "posOpt.before": "Перед «Додати в кошик»",
  "posOpt.after": "Після «Додати в кошик»",
  "posOpt.floating": "Плаваюча",

  "settings.heading": "Заголовок",
  "settings.subheading": "Підзаголовок",
  "settings.accentColorStart": "Акцентний колір (початок)",
  "settings.accentColorStartHelp": "Залиште порожнім, щоб використати колір кнопки.",
  "settings.accentColorEnd": "Акцентний колір (кінець)",
  "settings.accentTextColor": "Акцентний колір тексту",
  "settings.layout": "Розташування",
  "settings.showTryAnother": 'Показувати кнопку "Спробувати інше фото"',
  "settings.showBack": "Показувати кнопку «Назад»",

  "layoutOpt.split": "На весь екран",
  "layoutOpt.compact": "Компактне (плаваюча картка)",

  "settings.cardEnable": "Також показувати кнопку примірки на картках товарів у каталозі/колекціях",
  "settings.cardStyle": "Стиль кнопки на картці",
  "settings.cardReuse": "Використовує колір/стиль кнопки з вкладки «Кнопка».",

  "cardOpt.corner": "У кутку",
  "cardOpt.drawer": "Висувна панель",
  "cardOpt.scrim": "Затемнення",

  "settings.showOn": "Показувати кнопку на",
  "visOpt.all": "Усіх товарах",
  "visOpt.collection": "Лише певній колекції",
  "visOpt.products": "Лише певних товарах",

  "settings.changeCollection": "Змінити колекцію",
  "settings.chooseCollection": "Обрати колекцію",
  "settings.collectionOnly": 'Кнопка "Приміряти" з\'явиться лише на товарах цієї колекції.',
  "settings.changeProducts": "Змінити товари",
  "settings.chooseProducts": "Обрати товари",
  "settings.productsOnly":
    'Кнопка "Приміряти" з\'явиться лише на обраних товарах — на решті товарів сайту вона прихована.',
  "settings.visibilityCardNote":
    "Примітка: це стосується лише кнопки на сторінці товару. Кнопка на мінікартках у каталозі (попередня вкладка) поки що не фільтрується за товаром — напишіть, якщо потрібно додати й це.",

  "settings.enableWidget": "Увімкнути віджет примірки на вітрині",
  "settings.save": "Зберегти",

  "settings.livePreview": "Попередній перегляд",
  "settings.livePreviewHelp": "Оновлюється під час зміни налаштувань зліва — ще не збережено і не те, що бачать покупці, поки ви не натиснете «Зберегти».",

  "preview.autoMatchNote":
    'Автопідлаштування увімкнено — кнопка скопіює колір і форму справжньої кнопки "Додати в кошик" вашої теми. Тут це показати не можна (видно лише цю сторінку налаштувань, не вітрину) — перевірте кнопку на реальній сторінці товару.',
  "preview.addToCart": "Додати в кошик",
  "preview.productPhoto": "Фото товару",
  "preview.aviatorSunglasses": "Окуляри-авіатори",
  "preview.dropPhoto": "Перетягніть фото сюди",
  "preview.generateTryOn": "Створити примірку",
  "preview.backToProduct": "Назад до товару",
  "preview.tryAnotherPhoto": "Спробувати інше фото",
  "preview.cardEnableFirst": "Увімкніть галочку вище, щоб побачити попередній перегляд кнопки на картці.",
  "preview.tryOn": "Приміряти",
  "preview.productName": "Назва товару",
  "preview.collectionOnlyPreview": "Кнопка з'явиться лише на товарах у {collection}.",
  "preview.pickCollectionFirst": "Оберіть колекцію, щоб побачити підсумок тут.",
  "preview.productsOnlyPreview": "Кнопка з'явиться лише на цих {count} товарах.",
  "preview.pickProductFirst":
    'Оберіть хоча б один товар — доти кнопка показується всюди, як і в режимі "Усі товари".',
  "preview.allProducts": "Кнопка з'явиться на сторінці кожного товару.",

  "settings.addToTheme": "Додайте кнопку до вашої теми",
  "settings.addToThemeBody":
    'Відкрийте редактор теми → Шаблон товару → Додати блок → знайдіть "AI Glasses Try-On" і розмістіть його біля ціни або кнопки "Додати в кошик".',

  "err.malformedData": "Пошкоджені дані оформлення — перезавантажте сторінку і спробуйте ще раз.",
  "err.connectFirst": "Підключіться до Lumi Frame перед увімкненням віджета.",
  "err.choosePlanFirst": "Оберіть тариф на сторінці «Оплата», перш ніж вмикати віджет.",
  "err.couldNotConnect": "Не вдалося підключитися до Lumi Frame: {error}",

  "billing.unavailableTitle": "Оплата поки що недоступна",
  "billing.unavailableBody":
    "Shopify відкриває Billing API для публічного додатку лише після проходження ревʼю App Store — до того цей магазин не може оформити тариф. Сам віджет тим часом продовжує працювати; нічого не зламано, це звичайний етап перед запуском.",
  "billing.checkoutFailedTitle": "Не вдалося почати оформлення",
  "err.billingUnavailable":
    "Оплата Shopify для цього додатку поки що недоступна — вона відкриється після проходження ревʼю App Store.",
};

const pl = {
  "nav.dashboard": "Panel",
  "nav.settings": "Ustawienia",
  "nav.billing": "Płatności",

  "dashboard.connectBannerTitle": "Połącz się z Lumi Frame, aby uruchomić widżet",
  "dashboard.connectBannerBody":
    "Ta aplikacja przekazuje żądania przymierzania do Lumi Frame — nie ma własnej AI. Przejdź do Ustawień, aby się połączyć (automatycznie, nic nie trzeba wklejać) i włącz widżet na sklepie.",
  "dashboard.goToSettings": "Przejdź do ustawień",
  "dashboard.subtitle": "Ostatnie 30 dni",
  "dashboard.statTryOns": "Przymierzenia",
  "dashboard.statUniqueVisitors": "Unikalni odwiedzający",
  "dashboard.statOrdersAttributed": "Powiązane zamówienia",
  "dashboard.topProducts": "Najlepsze produkty",
  "dashboard.topProductsRow": "{title} — {tryOns} przymierzeń",
  "dashboard.noTryOnsYet":
    'Jeszcze brak przymierzeń. Dodaj blok "AI Glasses Try-On" do szablonu produktu w edytorze motywu, aby zacząć zbierać dane.',

  "billing.trialBanner": "Pierwsze {limit} przymierzeń za darmo, bez planu",
  "billing.trialBannerBody":
    "Ceny tutaj to zastępcze wartości na start — zmień je w app/billing.js przed wysłaniem do App Store.",
  "billing.currentPlanBadge": "Aktualny plan",
  "billing.perMonth": "/ miesiąc",
  "billing.upToQuota": "Do {quota} przymierzeń miesięcznie",
  "billing.active": "Aktywny",
  "billing.choosePlan": "Wybierz plan",
  "billing.manualStepTitle": "Jeden ręczny krok po zasubskrybowaniu",
  "billing.manualStepBody":
    "Rozliczenia Shopify decydują o tym, ile płaci tutaj sprzedawca — nie dotyczy to własnego limitu Lumi Frame. Lumi Frame nie ma samoobsługowego API planów; po zmianie planu przypisz odpowiedni plan temu sprzedawcy ręcznie, we własnym panelu Lumi Frame.",
  "billing.needsReloadTitle": "Wymagany jednorazowy reset",
  "billing.needsReloadBody":
    "Znaleziono nieaktualną sesję dla tego sklepu i ją wyczyszczono. Odśwież całkowicie tę stronę (Cmd/Ctrl+R, nie samo kliknięcie linku), aby Shopify ponownie uwierzytelnił aplikację, a następnie spróbuj ponownie.",

  "settings.savedTitle": "Zapisano",
  "settings.savedBody": "Twoje ustawienia zostały zapisane.",
  "settings.saveFailedTitle": "Nie udało się zapisać",
  "settings.lumiFrameAccount": "Konto Lumi Frame",
  "settings.connectedBadge": "Połączono",
  "settings.connectedBody": "Ten sklep jest połączony z Lumi Frame. Nic nie trzeba wklejać — skonfigurowano automatycznie.",
  "settings.connectBody":
    "Automatycznie konfiguruje przymierzanie dla tego sklepu — tworzy konto i sklep w Lumi Frame w tle. Nic do kopiowania ani wklejania.",
  "settings.connectButton": "Połącz z Lumi Frame",
  "settings.planTitle": "Plan",
  "settings.planCurrent": "Aktualny plan: {plan}",
  "settings.planNone": "Brak aktywnego planu — widżetu nie można włączyć, dopóki go nie wybierzesz.",
  "settings.managePlan": "Zarządzaj planem",
  "settings.choosePlan": "Wybierz plan",
  "settings.designTitle": "Wygląd i integracja",
  "settings.designSubtitle": 'Skonfiguruj, jak przycisk "Przymierz" wygląda na Twojej stronie.',

  "settings.storefrontLanguage": "Język sklepu",
  "settings.storefrontLanguageHelp": "Automatyczne wykrywanie dopasowuje się do języka sklepu każdego kupującego.",
  "settings.appLanguage": "Język aplikacji",
  "settings.appLanguageHelp": "Język tego ekranu administracyjnego — nie widżetu w sklepie.",
  "settings.saveLanguage": "Zapisz",

  "langOpt.auto": "Automatyczne wykrywanie (zalecane)",
  "langOpt.alwaysEn": "Zawsze angielski",
  "langOpt.alwaysUk": "Zawsze ukraiński",
  "langOpt.alwaysRu": "Zawsze rosyjski",

  "tab.button": "Przycisk",
  "tab.modal": "Okno przymierzania",
  "tab.card": "Przycisk na mini-karcie",
  "tab.visibility": "Które produkty",

  "settings.buttonText": "Tekst przycisku",
  "settings.autoMatchTheme": "Automatycznie dopasuj do motywu mojego sklepu",
  "settings.autoMatchThemeHelp":
    'Kopiuje kolor i kształt przycisku "Dodaj do koszyka" z Twojego motywu — poniższe pola są ignorowane, gdy ta opcja jest włączona.',
  "settings.fill": "Wypełnienie",
  "settings.colorGradientStart": "Kolor (początek gradientu)",
  "settings.color": "Kolor",
  "settings.colorGradientEnd": "Kolor (koniec gradientu)",
  "settings.textColor": "Kolor tekstu",
  "settings.buttonSize": "Rozmiar przycisku — {pct}%",
  "settings.buttonWidth": "Szerokość przycisku — {pct}%",
  "settings.shape": "Kształt",
  "settings.animation": "Animacja",
  "settings.placement": "Umiejscowienie",
  "settings.glowEffect": "Efekt poświaty",

  "fillOpt.gradient": "Gradient",
  "fillOpt.solid": "Jednolity",
  "fillOpt.outline": "Kontur",
  "shapeOpt.rounded": "Zaokrąglony",
  "shapeOpt.rectangular": "Prostokątny",
  "animOpt.none": "Brak",
  "animOpt.pulse": "Pulsowanie",
  "animOpt.shimmer": "Migotanie",
  "posOpt.before": "Przed „Dodaj do koszyka”",
  "posOpt.after": "Po „Dodaj do koszyka”",
  "posOpt.floating": "Pływający",

  "settings.heading": "Nagłówek",
  "settings.subheading": "Podtytuł",
  "settings.accentColorStart": "Kolor akcentu (początek)",
  "settings.accentColorStartHelp": "Pozostaw puste, aby użyć kolorów przycisku.",
  "settings.accentColorEnd": "Kolor akcentu (koniec)",
  "settings.accentTextColor": "Kolor tekstu akcentu",
  "settings.layout": "Układ",
  "settings.showTryAnother": 'Pokaż przycisk "Wypróbuj inne zdjęcie"',
  "settings.showBack": "Pokaż przycisk wstecz",

  "layoutOpt.split": "Pełny ekran",
  "layoutOpt.compact": "Kompaktowe (pływająca karta)",

  "settings.cardEnable": "Pokazuj też przycisk przymierzania na kartach produktów w katalogu/kolekcjach",
  "settings.cardStyle": "Styl przycisku na karcie",
  "settings.cardReuse": "Wykorzystuje kolory/styl przycisku ustawione w zakładce „Przycisk”.",

  "cardOpt.corner": "W rogu",
  "cardOpt.drawer": "Wysuwany pasek",
  "cardOpt.scrim": "Przyciemnienie",

  "settings.showOn": "Pokazuj przycisk na",
  "visOpt.all": "Wszystkich produktach",
  "visOpt.collection": "Tylko wybranej kolekcji",
  "visOpt.products": "Tylko wybranych produktach",

  "settings.changeCollection": "Zmień kolekcję",
  "settings.chooseCollection": "Wybierz kolekcję",
  "settings.collectionOnly": 'Przycisk "Przymierz" pojawi się tylko na produktach z tej kolekcji.',
  "settings.changeProducts": "Zmień produkty",
  "settings.chooseProducts": "Wybierz produkty",
  "settings.productsOnly":
    'Przycisk "Przymierz" pojawi się tylko na wybranych tu produktach — na pozostałych pozostaje ukryty.',
  "settings.visibilityCardNote":
    "Uwaga: dotyczy to tylko przycisku na stronie produktu. Przycisk na mini-kartach w katalogu (poprzednia zakładka) nie filtruje jeszcze po produkcie — daj znać, jeśli chcesz to również dodać.",

  "settings.enableWidget": "Włącz widżet przymierzania na stronie sklepu",
  "settings.save": "Zapisz",

  "settings.livePreview": "Podgląd na żywo",
  "settings.livePreviewHelp": "Aktualizuje się przy zmianie ustawień po lewej — jeszcze nie zapisane i nie to, co widzą kupujący, dopóki nie klikniesz „Zapisz”.",

  "preview.autoMatchNote":
    'Auto-dopasowanie jest włączone — przycisk skopiuje prawdziwy kolor i kształt przycisku "Dodaj do koszyka" Twojego motywu. Ten podgląd nie może tego pokazać (widzi tylko tę stronę ustawień, nie Twój sklep) — sprawdź przycisk na prawdziwej stronie produktu.',
  "preview.addToCart": "Dodaj do koszyka",
  "preview.productPhoto": "Zdjęcie produktu",
  "preview.aviatorSunglasses": "Okulary Aviator",
  "preview.dropPhoto": "Upuść zdjęcie tutaj",
  "preview.generateTryOn": "Wygeneruj przymierzenie",
  "preview.backToProduct": "Powrót do produktu",
  "preview.tryAnotherPhoto": "Wypróbuj inne zdjęcie",
  "preview.cardEnableFirst": "Włącz pole wyboru powyżej, aby zobaczyć podgląd przycisku na karcie.",
  "preview.tryOn": "Przymierz",
  "preview.productName": "Nazwa produktu",
  "preview.collectionOnlyPreview": "Przycisk pojawi się tylko na produktach w {collection}.",
  "preview.pickCollectionFirst": "Wybierz kolekcję, aby zobaczyć podsumowanie tutaj.",
  "preview.productsOnlyPreview": "Przycisk pojawi się tylko na tych {count} produktach.",
  "preview.pickProductFirst":
    'Wybierz co najmniej jeden produkt — do tego czasu przycisk pokazuje się wszędzie, tak jak w trybie "Wszystkie produkty".',
  "preview.allProducts": "Przycisk pojawi się na każdej stronie produktu.",

  "settings.addToTheme": "Dodaj przycisk do swojego motywu",
  "settings.addToThemeBody":
    'Otwórz edytor motywu → Szablon produktu → Dodaj blok → znajdź "AI Glasses Try-On" i umieść go przy cenie lub przycisku Dodaj do koszyka.',

  "err.malformedData": "Uszkodzone dane wyglądu — odśwież stronę i spróbuj ponownie.",
  "err.connectFirst": "Połącz się z Lumi Frame, zanim włączysz widżet.",
  "err.choosePlanFirst": "Wybierz plan na stronie Płatności, zanim włączysz widżet.",
  "err.couldNotConnect": "Nie udało się połączyć z Lumi Frame: {error}",

  "billing.unavailableTitle": "Płatności nie są jeszcze dostępne",
  "billing.unavailableBody":
    "Shopify udostępnia Billing API aplikacji publicznej dopiero po przejściu weryfikacji do App Store — do tego czasu ten sklep nie może wykupić planu. Sam widżet nadal działa w tym czasie; nic tu nie jest zepsute, to normalny etap przed uruchomieniem.",
  "billing.checkoutFailedTitle": "Nie udało się rozpocząć płatności",
  "err.billingUnavailable":
    "Rozliczenia Shopify nie są jeszcze dostępne dla tej aplikacji — otworzą się po przejściu weryfikacji do App Store.",
};

const cs = {
  "nav.dashboard": "Přehled",
  "nav.settings": "Nastavení",
  "nav.billing": "Fakturace",

  "dashboard.connectBannerTitle": "Připojte se k Lumi Frame a spusťte widget",
  "dashboard.connectBannerBody":
    "Tato aplikace přeposílá požadavky na zkoušení do Lumi Frame — vlastní AI nemá. Přejděte do Nastavení a připojte se (automaticky, nic se nevkládá) a zapněte widget na e-shopu.",
  "dashboard.goToSettings": "Přejít do nastavení",
  "dashboard.subtitle": "Posledních 30 dní",
  "dashboard.statTryOns": "Zkoušení",
  "dashboard.statUniqueVisitors": "Unikátní návštěvníci",
  "dashboard.statOrdersAttributed": "Přiřazené objednávky",
  "dashboard.topProducts": "Nejlepší produkty",
  "dashboard.topProductsRow": "{title} — {tryOns} zkoušení",
  "dashboard.noTryOnsYet":
    'Zatím žádná zkoušení. Přidejte blok "AI Glasses Try-On" do šablony produktu v editoru šablon a začněte sbírat data.',

  "billing.trialBanner": "Prvních {limit} zkoušení zdarma, bez plánu",
  "billing.trialBannerBody":
    "Ceny zde jsou zástupné pro spuštění — upravte je v app/billing.js před odesláním do App Store.",
  "billing.currentPlanBadge": "Aktuální plán",
  "billing.perMonth": "/ měsíc",
  "billing.upToQuota": "Až {quota} zkoušení měsíčně",
  "billing.active": "Aktivní",
  "billing.choosePlan": "Vybrat plán",
  "billing.manualStepTitle": "Jeden ruční krok po objednání",
  "billing.manualStepBody":
    "Fakturace Shopify řídí, kolik zde obchodník platí — nedotýká se vlastní kvóty Lumi Frame. Lumi Frame nemá samoobslužné API plánů; po změně plánu přiřaďte odpovídající plán tomuto obchodníkovi ručně, ve vlastní administraci Lumi Frame.",
  "billing.needsReloadTitle": "Je potřeba jednorázový reset",
  "billing.needsReloadBody":
    "Byla nalezena zastaralá relace pro tento obchod a byla vymazána. Prosím, znovu úplně načtěte tuto stránku (Cmd/Ctrl+R, ne jen kliknutí na odkaz), aby Shopify aplikaci znovu autorizoval, a zkuste to znovu.",

  "settings.savedTitle": "Uloženo",
  "settings.savedBody": "Vaše nastavení bylo uloženo.",
  "settings.saveFailedTitle": "Uložení se nezdařilo",
  "settings.lumiFrameAccount": "Účet Lumi Frame",
  "settings.connectedBadge": "Připojeno",
  "settings.connectedBody": "Tento obchod je připojen k Lumi Frame. Nic se nevkládá — nastaveno automaticky.",
  "settings.connectBody":
    "Automaticky nastaví zkoušení pro tento obchod — na pozadí vytvoří účet a obchod v Lumi Frame. Nic se nekopíruje ani nevkládá.",
  "settings.connectButton": "Připojit k Lumi Frame",
  "settings.planTitle": "Plán",
  "settings.planCurrent": "Aktuální plán: {plan}",
  "settings.planNone": "Žádný aktivní plán — widget nelze zapnout, dokud nějaký nevyberete.",
  "settings.managePlan": "Spravovat plán",
  "settings.choosePlan": "Vybrat plán",
  "settings.designTitle": "Vzhled a integrace",
  "settings.designSubtitle": 'Nastavte, jak tlačítko "Vyzkoušet" vypadá na vašem webu.',

  "settings.storefrontLanguage": "Jazyk e-shopu",
  "settings.storefrontLanguageHelp": "Automatická detekce se řídí jazykem e-shopu daného zákazníka.",
  "settings.appLanguage": "Jazyk aplikace",
  "settings.appLanguageHelp": "Jazyk této administrátorské obrazovky — ne widgetu na e-shopu.",
  "settings.saveLanguage": "Uložit",

  "langOpt.auto": "Automatická detekce (doporučeno)",
  "langOpt.alwaysEn": "Vždy anglicky",
  "langOpt.alwaysUk": "Vždy ukrajinsky",
  "langOpt.alwaysRu": "Vždy rusky",

  "tab.button": "Tlačítko",
  "tab.modal": "Okno zkoušení",
  "tab.card": "Tlačítko na mini-kartě",
  "tab.visibility": "Které produkty",

  "settings.buttonText": "Text tlačítka",
  "settings.autoMatchTheme": "Automaticky přizpůsobit šabloně mého obchodu",
  "settings.autoMatchThemeHelp":
    'Zkopíruje barvu a tvar vlastního tlačítka "Přidat do košíku" vaší šablony — pole níže jsou ignorována, dokud je toto zapnuté.',
  "settings.fill": "Výplň",
  "settings.colorGradientStart": "Barva (začátek přechodu)",
  "settings.color": "Barva",
  "settings.colorGradientEnd": "Barva (konec přechodu)",
  "settings.textColor": "Barva textu",
  "settings.buttonSize": "Velikost tlačítka — {pct} %",
  "settings.buttonWidth": "Šířka tlačítka — {pct} %",
  "settings.shape": "Tvar",
  "settings.animation": "Animace",
  "settings.placement": "Umístění",
  "settings.glowEffect": "Efekt záře",

  "fillOpt.gradient": "Přechod",
  "fillOpt.solid": "Plná barva",
  "fillOpt.outline": "Obrys",
  "shapeOpt.rounded": "Zaoblené",
  "shapeOpt.rectangular": "Obdélníkové",
  "animOpt.none": "Žádná",
  "animOpt.pulse": "Pulzování",
  "animOpt.shimmer": "Záblesk",
  "posOpt.before": "Před „Přidat do košíku“",
  "posOpt.after": "Za „Přidat do košíku“",
  "posOpt.floating": "Plovoucí",

  "settings.heading": "Nadpis",
  "settings.subheading": "Podnadpis",
  "settings.accentColorStart": "Akcentní barva (začátek)",
  "settings.accentColorStartHelp": "Ponechte prázdné pro použití barev tlačítka.",
  "settings.accentColorEnd": "Akcentní barva (konec)",
  "settings.accentTextColor": "Akcentní barva textu",
  "settings.layout": "Rozvržení",
  "settings.showTryAnother": 'Zobrazit tlačítko "Zkusit jinou fotku"',
  "settings.showBack": "Zobrazit tlačítko zpět",

  "layoutOpt.split": "Celá obrazovka",
  "layoutOpt.compact": "Kompaktní (plovoucí karta)",

  "settings.cardEnable": "Zobrazit tlačítko zkoušení i na kartách produktů v katalogu/kolekcích",
  "settings.cardStyle": "Styl tlačítka na kartě",
  "settings.cardReuse": "Používá barvy/styl tlačítka nastavené na kartě „Tlačítko“.",

  "cardOpt.corner": "V rohu",
  "cardOpt.drawer": "Vysouvací lišta",
  "cardOpt.scrim": "Ztmavení",

  "settings.showOn": "Zobrazit tlačítko na",
  "visOpt.all": "Všech produktech",
  "visOpt.collection": "Pouze konkrétní kolekci",
  "visOpt.products": "Pouze konkrétních produktech",

  "settings.changeCollection": "Změnit kolekci",
  "settings.chooseCollection": "Vybrat kolekci",
  "settings.collectionOnly": 'Tlačítko "Vyzkoušet" se zobrazí pouze u produktů v této kolekci.',
  "settings.changeProducts": "Změnit produkty",
  "settings.chooseProducts": "Vybrat produkty",
  "settings.productsOnly":
    'Tlačítko "Vyzkoušet" se zobrazí pouze u zde vybraných produktů — u ostatních zůstane skryté.',
  "settings.visibilityCardNote":
    "Poznámka: toto ovlivňuje pouze tlačítko na stránce produktu. Tlačítko na mini-kartách v katalogu (předchozí karta) zatím podle produktu nefiltruje — dejte vědět, pokud to chcete přidat i tam.",

  "settings.enableWidget": "Zapnout widget zkoušení na e-shopu",
  "settings.save": "Uložit",

  "settings.livePreview": "Živý náhled",
  "settings.livePreviewHelp": "Aktualizuje se při změně nastavení vlevo — zatím neuloženo a není to, co vidí zákazníci, dokud nestisknete „Uložit“.",

  "preview.autoMatchNote":
    'Automatické přizpůsobení je zapnuto — tlačítko zkopíruje skutečnou barvu a tvar tlačítka "Přidat do košíku" vaší šablony. Tento náhled to zde nemůže zobrazit (vidí jen tuto stránku nastavení, ne váš e-shop) — zkontrolujte tlačítko na skutečné stránce produktu.',
  "preview.addToCart": "Přidat do košíku",
  "preview.productPhoto": "Fotka produktu",
  "preview.aviatorSunglasses": "Sluneční brýle Aviator",
  "preview.dropPhoto": "Sem přetáhněte fotku",
  "preview.generateTryOn": "Vygenerovat zkoušení",
  "preview.backToProduct": "Zpět na produkt",
  "preview.tryAnotherPhoto": "Zkusit jinou fotku",
  "preview.cardEnableFirst": "Zapněte zaškrtávací pole výše pro náhled tlačítka na kartě.",
  "preview.tryOn": "Vyzkoušet",
  "preview.productName": "Název produktu",
  "preview.collectionOnlyPreview": "Tlačítko se zobrazí pouze u produktů v {collection}.",
  "preview.pickCollectionFirst": "Vyberte kolekci, aby se zde zobrazilo shrnutí.",
  "preview.productsOnlyPreview": "Tlačítko se zobrazí pouze u těchto {count} produktů.",
  "preview.pickProductFirst":
    'Vyberte alespoň jeden produkt — do té doby se tlačítko zobrazuje všude, stejně jako u "Všech produktů".',
  "preview.allProducts": "Tlačítko se zobrazí na každé stránce produktu.",

  "settings.addToTheme": "Přidejte tlačítko do své šablony",
  "settings.addToThemeBody":
    'Otevřete editor šablon → Šablona produktu → Přidat blok → najděte "AI Glasses Try-On" a umístěte jej vedle ceny nebo tlačítka Přidat do košíku.',

  "err.malformedData": "Poškozená data vzhledu — obnovte stránku a zkuste to znovu.",
  "err.connectFirst": "Před zapnutím widgetu se připojte k Lumi Frame.",
  "err.choosePlanFirst": "Před zapnutím widgetu vyberte plán na stránce Fakturace.",
  "err.couldNotConnect": "Nepodařilo se připojit k Lumi Frame: {error}",

  "billing.unavailableTitle": "Fakturace zatím není dostupná",
  "billing.unavailableBody":
    "Shopify zpřístupní Billing API veřejné aplikaci až po schválení pro App Store — do té doby si tento obchod nemůže vybrat plán. Widget samotný mezitím dál funguje; nic zde není rozbité, jde o běžný krok před spuštěním.",
  "billing.checkoutFailedTitle": "Platbu se nepodařilo zahájit",
  "err.billingUnavailable":
    "Fakturace Shopify pro tuto aplikaci zatím není dostupná — zpřístupní se po schválení pro App Store.",
};

const de = {
  "nav.dashboard": "Dashboard",
  "nav.settings": "Einstellungen",
  "nav.billing": "Abrechnung",

  "dashboard.connectBannerTitle": "Mit Lumi Frame verbinden, um live zu gehen",
  "dashboard.connectBannerBody":
    "Diese App leitet Anprobe-Anfragen an Lumi Frame weiter — sie hat keine eigene KI. Gehen Sie zu Einstellungen, um sich zu verbinden (automatisch, nichts einfügen) und das Widget im Shop zu aktivieren.",
  "dashboard.goToSettings": "Zu den Einstellungen",
  "dashboard.subtitle": "Letzte 30 Tage",
  "dashboard.statTryOns": "Anproben",
  "dashboard.statUniqueVisitors": "Einzigartige Besucher",
  "dashboard.statOrdersAttributed": "Zugeordnete Bestellungen",
  "dashboard.topProducts": "Top-Produkte",
  "dashboard.topProductsRow": "{title} — {tryOns} Anproben",
  "dashboard.noTryOnsYet":
    'Noch keine Anproben. Fügen Sie den Block "AI Glasses Try-On" im Theme-Editor zu Ihrer Produktvorlage hinzu, um mit dem Sammeln von Daten zu beginnen.',

  "billing.trialBanner": "Die ersten {limit} Anproben kostenlos, ohne Plan",
  "billing.trialBannerBody":
    "Die Preise hier sind Platzhalter für den Start — bearbeiten Sie sie in app/billing.js, bevor Sie im App Store einreichen.",
  "billing.currentPlanBadge": "Aktueller Plan",
  "billing.perMonth": "/ Monat",
  "billing.upToQuota": "Bis zu {quota} Anproben pro Monat",
  "billing.active": "Aktiv",
  "billing.choosePlan": "Plan wählen",
  "billing.manualStepTitle": "Ein manueller Schritt nach dem Abschluss",
  "billing.manualStepBody":
    "Shopify-Abrechnung steuert, was der Händler hier zahlt — betrifft nicht das eigene Kontingent von Lumi Frame. Lumi Frame hat keine Self-Service-Plan-API; weisen Sie nach einer Planänderung diesem Händler den passenden Plan manuell in der eigenen Lumi-Frame-Admin-Oberfläche zu.",
  "billing.needsReloadTitle": "Einmaliger Reset erforderlich",
  "billing.needsReloadBody":
    "Eine veraltete Sitzung für diesen Shop wurde gefunden und gelöscht. Bitte laden Sie diese Seite vollständig neu (Cmd/Strg+R, nicht nur ein Link-Klick), damit Shopify die App neu authentifiziert, und versuchen Sie es erneut.",

  "settings.savedTitle": "Gespeichert",
  "settings.savedBody": "Ihre Einstellungen wurden gespeichert.",
  "settings.saveFailedTitle": "Speichern fehlgeschlagen",
  "settings.lumiFrameAccount": "Lumi-Frame-Konto",
  "settings.connectedBadge": "Verbunden",
  "settings.connectedBody": "Dieser Shop ist mit Lumi Frame verbunden. Nichts einzufügen — wurde automatisch eingerichtet.",
  "settings.connectBody":
    "Richtet die Anprobe für diesen Shop automatisch ein — erstellt im Hintergrund ein Konto und einen Shop in Lumi Frame. Nichts zu kopieren oder einzufügen.",
  "settings.connectButton": "Mit Lumi Frame verbinden",
  "settings.planTitle": "Plan",
  "settings.planCurrent": "Aktueller Plan: {plan}",
  "settings.planNone": "Kein aktiver Plan — das Widget kann erst aktiviert werden, wenn Sie einen wählen.",
  "settings.managePlan": "Plan verwalten",
  "settings.choosePlan": "Plan wählen",
  "settings.designTitle": "Design und Integration",
  "settings.designSubtitle": 'Legen Sie fest, wie die Schaltfläche "Anprobieren" auf Ihrer Website aussieht.',

  "settings.storefrontLanguage": "Shop-Sprache",
  "settings.storefrontLanguageHelp": "Die automatische Erkennung folgt der Shop-Sprache jedes Käufers.",
  "settings.appLanguage": "App-Sprache",
  "settings.appLanguageHelp": "Die Sprache dieses Admin-Bildschirms — nicht des Widgets im Shop.",
  "settings.saveLanguage": "Speichern",

  "langOpt.auto": "Automatisch erkennen (empfohlen)",
  "langOpt.alwaysEn": "Immer Englisch",
  "langOpt.alwaysUk": "Immer Ukrainisch",
  "langOpt.alwaysRu": "Immer Russisch",

  "tab.button": "Schaltfläche",
  "tab.modal": "Anprobe-Fenster",
  "tab.card": "Karten-Schaltfläche",
  "tab.visibility": "Welche Produkte",

  "settings.buttonText": "Schaltflächentext",
  "settings.autoMatchTheme": "Automatisch an mein Shop-Theme anpassen",
  "settings.autoMatchThemeHelp":
    'Übernimmt Farbe und Form der eigenen "Warenkorb"-Schaltfläche Ihres Themes — die Felder unten werden ignoriert, solange dies aktiviert ist.',
  "settings.fill": "Füllung",
  "settings.colorGradientStart": "Farbe (Verlaufsanfang)",
  "settings.color": "Farbe",
  "settings.colorGradientEnd": "Farbe (Verlaufsende)",
  "settings.textColor": "Textfarbe",
  "settings.buttonSize": "Schaltflächengröße — {pct} %",
  "settings.buttonWidth": "Schaltflächenbreite — {pct} %",
  "settings.shape": "Form",
  "settings.animation": "Animation",
  "settings.placement": "Platzierung",
  "settings.glowEffect": "Leuchteffekt",

  "fillOpt.gradient": "Farbverlauf",
  "fillOpt.solid": "Einfarbig",
  "fillOpt.outline": "Umriss",
  "shapeOpt.rounded": "Abgerundet",
  "shapeOpt.rectangular": "Rechteckig",
  "animOpt.none": "Keine",
  "animOpt.pulse": "Pulsieren",
  "animOpt.shimmer": "Schimmern",
  "posOpt.before": "Vor „In den Warenkorb“",
  "posOpt.after": "Nach „In den Warenkorb“",
  "posOpt.floating": "Schwebend",

  "settings.heading": "Überschrift",
  "settings.subheading": "Unterüberschrift",
  "settings.accentColorStart": "Akzentfarbe (Anfang)",
  "settings.accentColorStartHelp": "Leer lassen, um die Farben der Schaltfläche zu übernehmen.",
  "settings.accentColorEnd": "Akzentfarbe (Ende)",
  "settings.accentTextColor": "Akzent-Textfarbe",
  "settings.layout": "Layout",
  "settings.showTryAnother": 'Schaltfläche "Anderes Foto versuchen" anzeigen',
  "settings.showBack": "Zurück-Schaltfläche anzeigen",

  "layoutOpt.split": "Vollbild",
  "layoutOpt.compact": "Kompakt (schwebende Karte)",

  "settings.cardEnable": "Anprobe-Schaltfläche auch auf Produktkarten in Katalog-/Kollektionsseiten anzeigen",
  "settings.cardStyle": "Stil der Kartenschaltfläche",
  "settings.cardReuse": "Verwendet die Farben/den Stil der Schaltfläche vom Tab „Schaltfläche“.",

  "cardOpt.corner": "In der Ecke",
  "cardOpt.drawer": "Ausziehbare Leiste",
  "cardOpt.scrim": "Abdunkelung",

  "settings.showOn": "Schaltfläche anzeigen bei",
  "visOpt.all": "Allen Produkten",
  "visOpt.collection": "Nur einer bestimmten Kollektion",
  "visOpt.products": "Nur bestimmten Produkten",

  "settings.changeCollection": "Kollektion ändern",
  "settings.chooseCollection": "Kollektion wählen",
  "settings.collectionOnly": 'Die Schaltfläche "Anprobieren" erscheint nur bei Produkten dieser Kollektion.',
  "settings.changeProducts": "Produkte ändern",
  "settings.chooseProducts": "Produkte wählen",
  "settings.productsOnly":
    'Die Schaltfläche "Anprobieren" erscheint nur bei den hier ausgewählten Produkten — bei allen anderen bleibt sie ausgeblendet.',
  "settings.visibilityCardNote":
    "Hinweis: Dies betrifft nur die Schaltfläche auf der Produktseite. Die Karten-Schaltfläche auf Katalogseiten (vorheriger Tab) filtert noch nicht nach Produkt — sagen Sie Bescheid, wenn Sie das auch möchten.",

  "settings.enableWidget": "Anprobe-Widget im Shop aktivieren",
  "settings.save": "Speichern",

  "settings.livePreview": "Live-Vorschau",
  "settings.livePreviewHelp": "Aktualisiert sich bei Änderungen links — noch nicht gespeichert und nicht das, was Käufer sehen, bis Sie „Speichern“ drücken.",

  "preview.autoMatchNote":
    'Auto-Anpassung ist aktiviert — die Schaltfläche übernimmt die echte Farbe und Form der "Warenkorb"-Schaltfläche Ihres Themes. Diese Vorschau kann das hier nicht zeigen (sie sieht nur diese Einstellungsseite, nicht Ihren Shop) — prüfen Sie die Schaltfläche auf der echten Produktseite.',
  "preview.addToCart": "In den Warenkorb",
  "preview.productPhoto": "Produktfoto",
  "preview.aviatorSunglasses": "Pilotenbrille",
  "preview.dropPhoto": "Foto hier ablegen",
  "preview.generateTryOn": "Anprobe erstellen",
  "preview.backToProduct": "Zurück zum Produkt",
  "preview.tryAnotherPhoto": "Anderes Foto versuchen",
  "preview.cardEnableFirst": "Aktivieren Sie das Kontrollkästchen oben, um die Kartenschaltfläche in der Vorschau zu sehen.",
  "preview.tryOn": "Anprobieren",
  "preview.productName": "Produktname",
  "preview.collectionOnlyPreview": "Die Schaltfläche erscheint nur bei Produkten in {collection}.",
  "preview.pickCollectionFirst": "Wählen Sie eine Kollektion, um hier eine Zusammenfassung zu sehen.",
  "preview.productsOnlyPreview": "Die Schaltfläche erscheint nur bei diesen {count} Produkten.",
  "preview.pickProductFirst":
    'Wählen Sie mindestens ein Produkt — bis dahin erscheint die Schaltfläche überall, wie bei "Alle Produkte".',
  "preview.allProducts": "Die Schaltfläche erscheint auf jeder Produktseite.",

  "settings.addToTheme": "Schaltfläche zu Ihrem Theme hinzufügen",
  "settings.addToThemeBody":
    'Öffnen Sie den Theme-Editor → Produktvorlage → Block hinzufügen → suchen Sie "AI Glasses Try-On" und platzieren Sie ihn bei Preis oder Warenkorb-Schaltfläche.',

  "err.malformedData": "Fehlerhafte Darstellungsdaten — bitte Seite neu laden und erneut versuchen.",
  "err.connectFirst": "Verbinden Sie sich mit Lumi Frame, bevor Sie das Widget aktivieren.",
  "err.choosePlanFirst": "Wählen Sie auf der Abrechnungsseite einen Plan, bevor Sie das Widget aktivieren.",
  "err.couldNotConnect": "Verbindung zu Lumi Frame fehlgeschlagen: {error}",

  "billing.unavailableTitle": "Abrechnung noch nicht verfügbar",
  "billing.unavailableBody":
    "Shopify öffnet die Billing-API für eine öffentliche App erst nach erfolgreicher App-Store-Prüfung — bis dahin kann dieser Shop keinen Plan abonnieren. Das Widget selbst funktioniert in der Zwischenzeit weiter; hier ist nichts kaputt, das ist ein normaler Schritt vor dem Launch.",
  "billing.checkoutFailedTitle": "Bezahlvorgang konnte nicht gestartet werden",
  "err.billingUnavailable":
    "Die Shopify-Abrechnung ist für diese App noch nicht verfügbar — sie öffnet sich nach erfolgreicher App-Store-Prüfung.",
};

const dictionaries = { en, uk, pl, cs, de };

export function createTranslator(lang) {
  const table = dictionaries[lang] || en;
  return function t(key, vars) {
    let s = table[key] ?? en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.replaceAll(`{${k}}`, String(v));
      }
    }
    return s;
  };
}
