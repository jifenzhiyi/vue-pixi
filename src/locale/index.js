import Vue from 'vue';
import VueI18n from 'vue-i18n';
import storage from '@/utils/storage.js';
import zhCN from './lang/zh-CN.js';
import enUS from './lang/en-US.js';
import jaJP from './lang/ja-JP.js';

Vue.use(VueI18n);

export const defaultLang = storage.get('scada_lang') || 'zh-CN';
const messages = {
  'zh-CN': { ...zhCN },
  'en-US': { ...enUS },
  'ja-JP': { ...jaJP },
};

const i18n = new VueI18n({
  locale: defaultLang,
  messages,
});

function setI18nLanguage(lang) {
  i18n.locale = lang;
  return lang;
}

export const defaultLanguage = zhCN;

export function getLocaleMessage(lang) {
  return messages[lang];
}

export function loadLanguageAsync(lang = defaultLang) {
  return new Promise((resolve) => {
    if (i18n.locale !== lang) {
      return resolve(setI18nLanguage(lang));
    }
    return resolve(lang);
  });
}

export function i18nRender(key) {
  return i18n.t(`${key}`);
}

export default i18n;
