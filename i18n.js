// Local catalogs only: no remote translation service or network requests.
(function (scope) {
  'use strict';
  const catalogs = scope.SILVER_TRANSLATIONS;
  const supported = ['en', 'zh-CN', 'zh-TW', 'ja', 'ru'];
  let locale = 'en';
  const api = {
    get locale() { return locale; },
    setLocale(value) { locale = supported.includes(value) ? value : 'en'; },
    t(key, values = {}) {
      const message = catalogs[locale]?.[key] ?? catalogs.en[key] ?? key;
      return message.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(values, name) ? String(values[name]) : match);
    },
    apply(document) {
      document.documentElement.lang = locale;
      for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = api.t(node.dataset.i18n);
      for (const attribute of ['title', 'aria-label', 'alt']) {
        for (const node of document.querySelectorAll('[data-i18n-' + attribute + ']')) {
          node.setAttribute(attribute, api.t(node.getAttribute('data-i18n-' + attribute)));
        }
      }
    }
  };
  scope.SilverI18n = api;
})(typeof window === 'undefined' ? globalThis : window);
