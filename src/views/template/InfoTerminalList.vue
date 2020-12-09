<template>
<div class="info-main">
  <div class="info-list">
    <div class="info-one">
      <div
        class="ellipsis"
        v-for="item in list"
        :key="item">{{ $t(item) }}</div>
    </div>
    <div
      class="info-one"
      v-for="item in terminalMapList"
      :key="item.terminalId">
      <span>{{ item.terminalId }}</span>
      <span>{{ item.posX }}</span>
      <span>{{ item.posY }}</span>
      <span>{{ item.posZ }}</span>
      <span :class="`s${item.status}`">{{ $t(item.statusName) }}</span>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'InfoTerminalList',
  computed: {
    ...mapState({
      terminalMap: (state) => state.factory.factoryConfig.terminalMap,
    }),
    terminalMapList() {
      return Object.keys(this.terminalMap).map((key) => {
        this.terminalMap[key].status === 0 && (this.terminalMap[key].statusName = 'Offline');
        this.terminalMap[key].status === 1 && (this.terminalMap[key].statusName = 'Run');
        this.terminalMap[key].status === 2 && (this.terminalMap[key].statusName = 'Pausing');
        return this.terminalMap[key];
      });
    },
  },
  data() {
    return {
      list: ['Terminal', 'Column', 'Row', 'Layer', 'Status'],
    };
  },
};
</script>

<style lang="less" scoped>
.info-main {
  padding: 10px 0;
  .info-list {
    display: flex;
    flex-direction: column;
    border: solid 1px #ddd;
    .info-one {
      height: 30px;
      display: flex;
      align-items: center;
      border-bottom: solid 1px #ddd;
      .ellipsis {
        width: 20%;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
      }
      &:last-child { border: 0; }
      span {
        width: 20%;
        height: 30px;
        display: flex;
        font-size: 12px;
        align-items: center;
        justify-content: center;
        &.s1 { color: rgb(54, 171, 74); }
        &.s2 { color: rgb(255, 89, 109); }
      }
    }
  }
}
</style>
