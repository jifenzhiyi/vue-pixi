<template>
  <header>
    <img
      class="logo"
      src="logo.png" />
    <div class="title">{{$t('SCADA')}} v{{$version}}</div>
    <div class="line" />
    <!--仓库选择-->
    <a-select
      class="select"
      v-if="warehouseIds.length > 0"
      :value="warehouseId"
      @change="warehouseChange">
      <a-select-option
        v-for="item in warehouseIds"
        :key="item"
        :value="item"> {{ item }}</a-select-option>
    </a-select>
    <!--用户设置-->
    <a-dropdown class="setting">
      <a
        class="ant-dropdown-link"
        @click="e => e.preventDefault()">
        <a-icon
          slot="icon"
          type="user" />{{ username }}
      </a>
      <a-menu slot="overlay">
        <a-menu-item>
          <a @click="logout">
            <a-icon
              slot="icon"
              type="logout" />{{$t('Logout')}}</a>
        </a-menu-item>
      </a-menu>
    </a-dropdown>
    <!--语言设置-->
    <toggle-language />
  </header>
</template>

<script>
import role from '@/mixins/role.js';
import ToggleLanguage from 'comps/ToggleLanguage/index.vue';

export default {
  name: 'ScadaHeader',
  mixins: [role],
  components: {
    ToggleLanguage,
  },
};
</script>

<style lang="less" scoped>
header {
  height: 44px;
  display: flex;
  padding: 0 10px;
  align-items: center;
  .logo { height: 40px; }
  .title { padding-left: 10px; }
  .line { flex: 1; }
  .select { width: 100px; }
  .setting { padding: 0 20px; color: #666 !important; }
}
.anticon { padding-right: 5px; }
</style>
