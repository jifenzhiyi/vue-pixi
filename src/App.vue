<template>
  <div id="app">
    <a-config-provider :locale="antLocale">
      <router-view />
    </a-config-provider>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import role from '@/mixins/role';
import { getLocaleMessage, defaultLanguage } from '@/locale';

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
  watch: {
    language() {
      this.appInit();
    },
  },
  created() {
    if (this.$route.name !== 'login' && this.$route.name !== 'error') {
      this.appInit();
    }
  },
  methods: {
    appInit() {
      console.log('页面初始化');
    },
  },
};
</script>
