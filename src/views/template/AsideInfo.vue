<template>
  <div class="aside-info">
    <div class="nav">
      <div
        v-for="item in tabList"
        :key="item.key"
        :class="['one ellipsis', now === item.key && 'now']"
        @click="tabChange(item.key)">{{ $t(item.tab) }}</div>
    </div>
    <div class="content">
      <info-messages v-if="now === 0" />
      <info-robot-list v-if="now === 1" />
      <info-terminal-list v-if="now === 2" />
    </div>
  </div>
</template>

<script>
import infoMessages from './InfoMessages.vue';
import infoRobotList from './InfoRobotList.vue';
import infoTerminalList from './InfoTerminalList.vue';

export default {
  name: 'AsideInfo',
  components: {
    infoMessages,
    infoRobotList,
    infoTerminalList,
  },
  data() {
    return {
      now: 0,
      tabList: [
        { tab: 'Messages', key: 0 },
        { tab: 'RobotList', key: 1 },
        { tab: 'TerminalList', key: 2 },
      ],
    };
  },
  methods: {
    tabChange(key) {
      this.now = key;
    },
  },
};
</script>

<style lang="less" scoped>
.aside-info {
  border: 0;
}
.nav {
  display: flex;
  border-top: solid 1px #ddd;
  justify-content: space-between;
  .one {
    width: 33%;
    height: 40px;
    padding: 0 10px;
    cursor: pointer;
    color: #909399;
    line-height: 40px;
    text-align: center;
    background: #F5F7FA;
    border-left: solid 1px #ddd;
    border-bottom: solid 1px #ddd;
    &:last-child { border-right: solid 1px #ddd; }
    &.now {
      color: #E20028;
      border-bottom: 0;
      background: #fff;
    }
  }
}
.content {
  overflow: auto;
  padding: 0 15px;
  border: solid 1px #ddd;
  border-top: 0;
}
</style>
