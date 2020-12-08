<template>
  <aside>
    <div :class="['status', `s${systemStatus}`]">
      <h3>系统状态</h3>
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
    <aside-info />
  </aside>
</template>

<script>
import role from '@/mixins/role';
import asideInfo from './AsideInfo';

export default {
  name: 'ScadaAside',
  mixins: [role],
  components: {
    asideInfo,
  },
};
</script>

<style lang="less" scoped>
aside {
  width: 320px;
  display: flex;
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
}
.radio_css { color: #ccc; }
</style>
