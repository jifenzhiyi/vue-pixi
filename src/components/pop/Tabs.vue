<template>
  <div class="pop_tabs">
    <div class="nav">
      <div
        v-for="item in tabList"
        :key="item.key"
        :class="['one ellipsis', tabKey === item.key && 'now']"
        @click="tabChange(item.key)">{{ $t(item.tab) }}</div>
    </div>
    <div class="content">
      <pop-child
        v-for="item in tabList"
        v-show="tabKey === item.key"
        :key="item.tab"
        :title="$t(item.tab)"
        :list="item.list" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import storage from '@/utils/storage';
import PopChild from './Child.vue';

export default {
  name: 'PopTabs',
  computed: {
    ...mapState(['themes']),
  },
  watch: {
    themes: {
      immediate: true,
      handler() {
        this.tabList[4].list[1].options = this.themes;
      },
    },
  },
  components: {
    PopChild,
  },
  data() {
    return {
      tabKey: 0,
      tabList: [
        {
          key: 0,
          tab: 'Space',
          list: [
            { label: 'SpacePlace', param: 'showSpaces', value: storage.get('scada_params_showSpaces'), type: 'switch' },
            { label: 'LinkPlace', param: 'showLinks', value: storage.get('scada_params_showLinks'), type: 'switch' },
            { label: 'ContainerSlot', param: 'showContainerBerth', value: storage.get('scada_params_showContainerBerth'), type: 'switch' },
            { label: 'InvalidSpace', param: 'showInvalidSpace', value: storage.get('scada_params_showInvalidSpace'), type: 'switch' },
            { label: 'waitingSpace', param: 'showWaitingSpace', value: storage.get('scada_params_showWaitingSpace'), type: 'switch' },
            { label: 'SafeSpace', param: 'showSafeSpace', value: storage.get('scada_params_showSafeSpace'), type: 'switch' },
            { label: 'spaceId', param: 'showSpaceId', value: storage.get('scada_params_showSpaceId') || false, type: 'switch', desc: 'TipOfStuck' },
          ],
        },
        {
          key: 1,
          tab: 'Robot',
          list: [
            { label: 'Robot', param: 'showRobots', value: storage.get('scada_params_showRobots'), type: 'switch' },
            { label: 'OfflineRobot', param: 'showOfflineRobots', value: storage.get('scada_params_showOfflineRobots') || false, type: 'switch' },
            { label: 'robotPath', param: 'showRobotsPath', value: storage.get('scada_params_showRobotsPath'), type: 'switch' },
            { label: 'robotId', param: 'showRobotsId', value: storage.get('scada_params_showRobotsId') || false, type: 'switch' },
            { label: 'robotMoveSpeed', param: 'moveSpeed', value: storage.get('scada_params_moveSpeed') || 1.5, type: 'input_num', num: 0.1 },
            { label: 'RobotTimeout', param: 'RobotTimeout', value: storage.get('scada_params_RobotTimeout') || 60, type: 'input', unit: '秒' },
            { label: 'AbnormalAlarm', param: 'showRobotError', value: storage.get('scada_params_showRobotError'), type: 'switch' },
            { label: 'AbnormalTimeout', param: 'ErrRobotTimeout', value: storage.get('scada_params_ErrRobotTimeout') || 10, type: 'input', unit: '秒' },
          ],
        },
        {
          key: 2,
          tab: 'Container', 
          list: [
            { label: 'ContainerPlace', param: 'showContainers', value: storage.get('scada_params_showContainers'), type: 'switch' },
            { label: 'ContainerId', param: 'showContainerId', value: storage.get('scada_params_showContainerId') || false, type: 'switch' },
            {
              label: 'ShowTypeOfContainer',
              param: 'showContainersType',
              value: 'frequence',
              type: 'radio',
              options: [
                { label: 'Frequently', value: 'frequence' },
                { label: 'Type', value: 'type' },
              ], // 货架显示方式 frequence热度 type类型
            },
          ],
        },
        { key: 3, tab: 'Terminal', list: [{ label: 'Terminal', param: 'showTerminals', value: storage.get('scada_params_showTerminals'), type: 'switch' }] },
        {
          key: 4,
          tab: 'Others',
          list: [
            { label: 'Marker', param: 'showMarker', value: storage.get('scada_params_showMarker'), type: 'switch' },
            {
              label: 'tempColor',
              param: 'themeId',
              value: storage.get('scada_themeId') || 0,
              type: 'radio',
              options: [],
            },
          ],
        },
      ],
    };
  },
  methods: {
    tabChange(key) {
      this.tabKey = key;
    },
  },
};
</script>

<style lang="less" scoped>
.pop_tabs {
  flex: 1;
  display: flex;
  overflow: hidden;
  margin-top: 20px;
  border-radius: 5px;
  flex-direction: column;
  border: solid 1px #ddd;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.12), 0 0 6px 0 rgba(0, 0, 0, 0.04);
  .nav {
    display: flex;
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
    flex: 1;
    overflow: auto;
    padding: 0 15px;
    border: solid 1px #ddd;
    border-top: 0;
  }
}
</style>
