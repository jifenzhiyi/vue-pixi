<template>
  <div id="app">
    <a-config-provider :locale="antLocale">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import role from '@/mixins/role.js';
import { getLocaleMessage, defaultLanguage } from '@/locale/index.js';

export default {
  name: 'App',
  data() {
    return {
      locale: {},
    };
  },
  mixins: [role],
  computed: {
    ...mapState(['language']),
    antLocale() {
      return getLocaleMessage(this.language).antLocale || defaultLanguage;
    },
  },
};
</script>
