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
      v-for="item in robotMapList"
      :key="item.robotMapList">
      <span>{{ item.robotId }}</span>
      <span>{{ item.posX }}</span>
      <span>{{ item.posY }}</span>
      <span>{{ item.posZ }}</span>
      <span :class="`s${item.status}`">{{ $t(item.statusName) }}</span>
      <span>{{ item.voltageNew }}</span>
    </div>
    <div
      v-if="robotMapList.length === 0"
      class="info-one"><p>暂无数据</p></div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'InfoRobotList',
  computed: {
    ...mapState({
      robotMap: (state) => state.factory.factoryConfig.robotMap,
      chargerMap: (state) => state.factory.factoryConfig.chargerMap,
    }),
    robotMapList() {
      return Object.keys(this.robotMap).map((key) => {
        const robot = this.robotMap[key];
        const { status, voltage, spaceId } = robot;
        status === -1 && (robot.statusName = 'Offline');
        status === 0 && (robot.statusName = 'Idle');
        status === 1 && (robot.statusName = 'Load');
        status === 99 && (robot.statusName = 'Problem');
        if (status === 3) {
          const charger = this.chargerMap[spaceId];
          robot.statusName = charger ? 'Charging' : 'ToBeCharged';
        }
        robot.voltageNew = `${parseInt(voltage * 100, 10)}%`;
        return robot;
      });
    },
  },
  data() {
    return {
      list: ['Robot', 'Column', 'Row', 'Layer', 'Status', 'voltage'],
    };
  },
};
</script>

<style lang="less" scoped>
.info-main {
  padding: 10px 0;
  .info-list .info-one .ellipsis {
    flex: 1;
    padding: 10px 0;
    border-right: solid 1px #ccc;
    &:last-child { border-right: 0; }
  }
}
</style>
