<template>
  <div class="abs aside-info">
    <div class="info-edit">
      <div
        class="edit-one"
        v-for="(item, idx) in list"
        :key="item.title">
        <div class="title">{{$t(item.title)}}</div>
        <div class="one">
          <div class="label">{{$t('ID')}}：</div>
          <a-input
            :placeholder="$t('PleaseEnterID', { param: $t(item.desc) })"
            :value="hoverSpaceInfo[item.param]"
            @focus="focus(item.param)"
            @keyup="inputChange" />
        </div>
        <div class="one">
          <div class="label">{{$t('Position')}}：</div>
          <div class="text">{{ hoverSpaceInfo[item.param] ? `X ${hoverSpaceInfo.posX}，Y ${hoverSpaceInfo.posY}` : 'X -，Y -' }}</div>
        </div>
        <div
          v-show="idx === 0"
          class="btn">
          <a-button
            v-if="buttonTypeList.updateContainer"
            :disabled="!(hoverSpaceInfo[item.param] && toSpaceInfo.spaceId)"
            @click="actionTask(buttonTypeList.updateContainer, { code: 1, object: hoverSpaceInfo[item.param] })">{{$t('Update')}}</a-button>
          <a-button
            v-if="buttonTypeList.moveContainer"
            :disabled="!(hoverSpaceInfo[item.param] && toSpaceInfo.spaceId)"
            @click="actionTask(buttonTypeList.moveContainer, { code: 2, object: hoverSpaceInfo[item.param] })">{{$t('MoveContainer')}}</a-button>
          <a-button
            v-if="buttonTypeList.deleteContainer"
            :disabled="!hoverSpaceInfo[item.param]"
            @click="removeContainer(buttonTypeList.deleteContainer, { code: 16, object: hoverSpaceInfo[item.param] })">{{$t('RemoveContainer')}}</a-button>
          <a-button
            v-if="buttonTypeList.updateContainerDirection"
            :disabled="!hoverSpaceInfo[item.param]">{{$t('updateContainerOrit')}}</a-button>
        </div>
        <div
          v-show="idx === 1"
          class="btn">
          <a-button
            v-if="buttonTypeList.moveRobot"
            :disabled="!(hoverSpaceInfo[item.param] && toSpaceInfo.spaceId)">{{$t('MoveRobot')}}</a-button>
          <a-button
            v-if="buttonTypeList.restartRobot"
            :disabled="!hoverSpaceInfo[item.param]">{{$t('ResetRobot')}}</a-button>
        </div>
        <!-- <div
          v-show="idx === 2"
          class="btn"></div> -->
        <div
          v-show="idx === 3"
          class="btn">
          <a-button
            v-if="buttonTypeList.addContainer"
            :disabled="!hoverSpaceInfo.spaceId"
            @click="addContainer(buttonTypeList.addContainer, { code: 15, spaceId: hoverSpaceInfo.spaceId })">{{$t('AddContainer')}}</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { taskAdd, maxContainerId } from '@/views/api.js';

export default {
  name: 'AsideEdit',
  computed: {
    ...mapState({
      hoverSpaceInfo: (state) => state.factory.hoverSpaceInfo,
      toSpaceInfo: (state) => state.factory.toSpaceInfo,
      factoryConfig: (state) => state.factory.factoryConfig,
      application: (state) => state.application,
      menuList: (state) => state.menuList,
    }),
    buttonTypeList() {
      const obj = {};
      this.menuList.forEach((item) => {
        obj[item.buttonType] = item.url;
      });
      return obj;
    },
  },
  data() {
    return {
      param: '',
      list: [
        { title: 'ContainerPlace', desc: 'Container', param: 'containerId' },
        { title: 'RobotInfo', desc: 'Robot', param: 'robotId' },
        { title: 'TerminalInfo', desc: 'Terminal', param: 'terminalId' },
        { title: 'SpacePlace', desc: 'Space', param: 'spaceId' },
      ],
    };
  },
  methods: {
    focus(param) {
      this.param = param;
    },
    inputChange(e) {
      let space;
      const value = e.target.value;
      if (this.param === 'containerId') {
        const container = this.factoryConfig.containerMap[value];
        if (!container) return;
        const { spaceId } = container;
        space = this.factoryConfig.spaceMap[spaceId];
      }
      if (this.param === 'robotId') {
        const robot = this.factoryConfig.robotMap[value];
        if (!robot) return;
        const { spaceId } = robot;
        space = this.factoryConfig.spaceMap[spaceId];
      }
      if (this.param === 'terminalId') {
        const terminal = this.factoryConfig.terminalMap[value];
        if (!terminal) return;
        const { spaceId } = terminal;
        space = this.factoryConfig.spaceMap[spaceId];
      }
      if (this.param === 'spaceId') {
        space = this.factoryConfig.spaceMap[value];
        if (!space) return;
      }
      this.application.spaceUp(space, this.application);
    },
    async actionTask(url, obj) {
      obj.objectId = obj.object;
      !obj.spaceId && (obj.spaceId = this.toSpaceInfo.spaceId);
      const res = await taskAdd(url, obj);
      if (res) {
        this.$message.success(this.$t('TaskReceivedMsg'));
        if (url === '/deleteContainer') {
          this.$store.commit('SET_HOVER_SPACE_INFO_ONE', { key: 'containerId', value: null });
          this.application.removeContainer(obj.object, this.application); // TODO 手动删除货架
        }
      }
    },
    removeContainer(url, obj) {
      this.$notice_confirm({
        minfo: this.$t('RemoveContainerTipInfo', { containerId: obj.object }),
        func: () => {
          obj.spaceId = this.hoverSpaceInfo.spaceId;
          this.actionTask(url, obj);
        },
      });
    },
    async addContainer(url, obj) {
      const res = await maxContainerId();
      if (res) {
        obj.url = url;
        obj.priority = 0;
        obj.object = `C${res.data.rows[0]}`;
        this.$store.commit('ADD_CONTAINER_CONFIG', obj);
        this.$store.commit('SET_ADD_CONTAINER');
      }
    },
  },
};
</script>

<style lang="less" scoped>
.aside-info {
  overflow: auto;
  border: solid 1px #ddd;
}
.info-edit {
  display: flex;
  padding: 0 15px;
  border-radius: 4px;
  flex-direction: column;
  .edit-one {
    padding-bottom: 15px;
    border-bottom: solid 1px #ddd;
    .title {
      color: #333;
      padding-top: 15px;
      font-weight: bold;
    }
    .one {
      display: flex;
      font-size: 13px;
      padding-top: 10px;
      align-items: center;
      .label { width: 50px; }
      .ant-input { flex: 1; }
    }
    .btn {
      .ant-btn {
        height: 30px;
        font-size: 12px;
        padding: 0 13px;
        margin-top: 10px;
        margin-right: 10px;
      }
    }
    &:last-child { border: 0; }
  }
}
</style>
