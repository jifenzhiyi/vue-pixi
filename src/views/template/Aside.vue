<template>
  <aside>
    <div :class="['status', `s${systemStatus}`]">
      <h3>{{ $t('SystemStatus') }}</h3>
      <a-radio-group
        class="radio_group"
        :value="systemStatus"
        @change="radioChange">
        <a-radio
          v-for="item in systemStatusMap"
          :class="['radio_css', systemStatus === item.value && `s${item.value}`]"
          :key="item.value"
          :value="item.value">{{ $t(item.title) }}</a-radio>
      </a-radio-group>
    </div>
    <div class="aside-main">
      <aside-info v-show="modeStatus === 'view' || modeStatus === 'mark'" />
      <aside-edit v-show="modeStatus === 'edit'" />
      <aside-batch v-show="modeStatus === 'batch'" />
    </div>
  </aside>
</template>

<script>
import { mapState } from 'vuex';
import role from '@/mixins/role.js';
import asideInfo from './AsideInfo.vue';
import asideEdit from './AsideEdit.vue';
import asideBatch from './AsideBatch.vue';

export default {
  name: 'ScadaAside',
  computed: {
    ...mapState(['modeStatus']),
  },
  mixins: [role],
  components: {
    asideInfo,
    asideEdit,
    asideBatch,
  },
};
</script>
    AsideBatch

<style lang="less" scoped>
aside {
  width: 320px;
  height: 100%;
  display: flex;
  overflow: hidden;
  margin-left: 10px;
  flex-direction: column;
  .status {
    height: 90px;
    padding: 10px;
    display: flex;
    overflow: hidden;
    border-radius: 4px;
    flex-direction: column;
    justify-content: space-around;
    &.s0 { background: #808099; }
    &.s1 { background: #e1021d; }
    &.s2 { background: #037aff; }
    &.s3 { background: #009e63; }
    h3 { color: #fff; }
    .radio_group {
      display: flex;
      justify-content: space-between;
    }
  }
  .aside-main {
    flex: 1;
    width: 100%;
    display: flex;
    overflow: auto;
    margin-top: 10px;
    border-radius: 4px;
    flex-direction: column;
  }
}
.radio_css { color: #ccc; }
</style>
