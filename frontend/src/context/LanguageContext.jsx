import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

// Scope note: this covers the customer app's navigation and the Settings
// page itself (where the switcher lives), which is what the language
// switcher requirement is centered on. It is NOT a full app-wide i18n
// pass — food names/descriptions (which come from the database, entered
// by restaurant staff) and most page copy stay in Uzbek regardless of
// the selected language. Extending coverage further is straightforward
// (add keys to TRANSLATIONS and call t() where needed) but is a larger,
// separate effort than what was asked for here.
const TRANSLATIONS = {
  uz: {
    profile: "Profil",
    profileInfo: "Profil ma'lumotlari",
    name: "Ism",
    namePlaceholder: "Ismingizni kiriting",
    surname: "Familiya",
    surnamePlaceholder: "Familiyangizni kiriting",
    phone: "Telefon",
    address: "Manzil",
    addressPlaceholder: "Manzilingizni kiriting",
    detectLocation: "Joylashuvimni aniqlash",
    detectingLocation: "Joylashuv aniqlanmoqda...",
    locationDetected: "Joylashuv aniqlandi",
    saveProfile: "Profilni saqlash",
    clearProfile: "Profil ma'lumotlarini tozalash",
    locationNotSupported: "Bu qurilmada joylashuv aniqlash qo'llab-quvvatlanmaydi.",
    locationPermissionDenied: "Joylashuvga ruxsat berilmadi.",
    locationUnavailable: "Joylashuvni aniqlab bo'lmadi.",
    locationTimeout: "Joylashuvni aniqlash vaqti tugadi.",
    home: 'Bosh sahifa',
    myOrders: 'Buyurtmalarim',
    cart: 'Savat',
    settings: 'Sozlamalar',
    welcome: 'Salom',
    language: 'Til',
    restaurantInfo: 'Restoran haqida',
    restaurantPhone: 'Telefon',
    restaurantAddress: 'Manzil',
    selectedBrand: 'Tanlangan brend',
    deliveryConditions: 'Yetkazib berish shartlari',
    deliveryConditionsText: "Buyurtmalar odatda 30-60 daqiqada yetkaziladi. Yetkazib berish narxi hudud bo'yicha farq qilishi mumkin.",
    paymentMethods: "To'lov usullari",
    paymentMethodsText: "Naqd pul, plastik karta va onlayn to'lov qabul qilinadi.",
    termsOfUse: 'Foydalanish shartlari',
    privacyPolicy: 'Maxfiylik siyosati',
    noBrandSelected: "Hali brend tanlanmagan"
  },
  ru: {
    profile: "Профиль",
    profileInfo: "Данные профиля",
    name: "Имя",
    namePlaceholder: "Введите ваше имя",
    surname: "Фамилия",
    surnamePlaceholder: "Введите вашу фамилию",
    phone: "Телефон",
    address: "Адрес",
    addressPlaceholder: "Введите ваш адрес",
    detectLocation: "Определить моё местоположение",
    detectingLocation: "Определяем местоположение...",
    locationDetected: "Местоположение определено",
    saveProfile: "Сохранить профиль",
    clearProfile: "Очистить данные профиля",
    locationNotSupported: "Определение местоположения не поддерживается на этом устройстве.",
    locationPermissionDenied: "Доступ к местоположению запрещён.",
    locationUnavailable: "Не удалось определить местоположение.",
    locationTimeout: "Время ожидания определения местоположения истекло.",
    home: 'Главная',
    myOrders: 'Мои заказы',
    cart: 'Корзина',
    settings: 'Настройки',
    welcome: 'Привет',
    language: 'Язык',
    restaurantInfo: 'О ресторане',
    restaurantPhone: 'Телефон',
    restaurantAddress: 'Адрес',
    selectedBrand: 'Выбранный бренд',
    deliveryConditions: 'Условия доставки',
    deliveryConditionsText: 'Заказы обычно доставляются за 30-60 минут. Стоимость доставки может отличаться в зависимости от района.',
    paymentMethods: 'Способы оплаты',
    paymentMethodsText: 'Принимаются наличные, банковская карта и онлайн-оплата.',
    termsOfUse: 'Условия использования',
    privacyPolicy: 'Политика конфиденциальности',
    noBrandSelected: 'Бренд ещё не выбран'
  },
  en: {
    profile: "Profile",
    profileInfo: "Profile information",
    name: "Name",
    namePlaceholder: "Enter your name",
    surname: "Surname",
    surnamePlaceholder: "Enter your surname",
    phone: "Phone",
    address: "Address",
    addressPlaceholder: "Enter your address",
    detectLocation: "Detect my location",
    detectingLocation: "Detecting location...",
    locationDetected: "Location detected",
    saveProfile: "Save profile",
    clearProfile: "Clear profile data",
    locationNotSupported: "Location detection is not supported on this device.",
    locationPermissionDenied: "Location permission was denied.",
    locationUnavailable: "Unable to determine your location.",
    locationTimeout: "Location detection timed out.",
    home: 'Home',
    myOrders: 'My Orders',
    cart: 'Cart',
    settings: 'Settings',
    welcome: 'Hello',
    language: 'Language',
    restaurantInfo: 'About the restaurant',
    restaurantPhone: 'Phone',
    restaurantAddress: 'Address',
    selectedBrand: 'Selected brand',
    deliveryConditions: 'Delivery conditions',
    deliveryConditionsText: 'Orders are typically delivered within 30-60 minutes. Delivery cost may vary by area.',
    paymentMethods: 'Payment methods',
    paymentMethodsText: 'Cash, card, and online payment are accepted.',
    termsOfUse: 'Terms of Use',
    privacyPolicy: 'Privacy Policy',
    noBrandSelected: 'No brand selected yet'
  }
};

const STORAGE_KEY = 'customerLanguage';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'uz');

  function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }

  function t(key) {
    return (TRANSLATIONS[language] && TRANSLATIONS[language][key]) || TRANSLATIONS.uz[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, available: Object.keys(TRANSLATIONS) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
