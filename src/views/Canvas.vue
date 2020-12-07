<template>
  <div class="main">
    <div class="top">
      <div class="time">{{ formatTime }}</div>
      <div :class="['status', `s${systemStatus}`]">{{ $t(statusMap.title) }}</div>
    </div>
  </div>
</template>

<script>
import role from '@/mixins/role';

export default {
  name: 'ScadaCanvas',
  mixins: [role],
};
</script>

<style lang="less" scoped>
.main {
  flex: 1;
  border: solid 1px #dcdfe6;
  .top {
    height: 30px;
    display: flex;
    padding: 0 10px;
    align-items: center;
    justify-content: space-between;
    .status {
      position: relative;
      padding-left: 15px;
      &::before {
        left: 0;
        top: 5px;
        width: 10px;
        height: 10px;
        content: ' ';
        border-radius: 5px;
        position: absolute;
      }
      &.s0::before { background: #808099; }
      &.s1::before { background: #e1021d; }
      &.s2::before { background: #037aff; }
      &.s3::before { background: #009e63; }
    }
  }
}
</style>
