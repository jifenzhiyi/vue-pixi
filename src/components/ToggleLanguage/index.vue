<template>
  <a-dropdown class="language">
    <a
      class="ant-dropdown-link"
      @click="e => e.preventDefault()">
      <svg-icon iconClass="fa-language" />
    </a>
    <a-menu slot="overlay">
      <a-menu-item @click="menuSelect('zh-CN')">🇨🇳 简体中文</a-menu-item>
      <a-menu-item @click="menuSelect('en-US')">🇺🇸 English</a-menu-item>
    </a-menu>
  </a-dropdown>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'ToggleLanguage',
  computed: mapState(['language']),
  methods: {
    menuSelect(lang) {
      this.$store.dispatch('SetLang', lang);
    },
  },
};
</script>

<style lang="less" scoped>
.language {
  color: #666 !important;
  padding-right: 10px;
}
.svg-icon {
  font-size: 20px !important;
}
</style>
