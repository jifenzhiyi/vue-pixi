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
    <div class="info-one"><p>暂无数据</p></div>
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
      let arr = [];
      if (this.terminalMap) {
        arr = Object.keys(this.terminalMap).map((key) => {
          this.terminalMap[key].status === 0 && (this.terminalMap[key].statusName = 'Offline');
          this.terminalMap[key].status === 1 && (this.terminalMap[key].statusName = 'Run');
          this.terminalMap[key].status === 2 && (this.terminalMap[key].statusName = 'Pausing');
          return this.terminalMap[key];
        });
      }
      return arr;
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
  .info-list .info-one .ellipsis { width: 20%; }
  .info-one p {
    margin: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
