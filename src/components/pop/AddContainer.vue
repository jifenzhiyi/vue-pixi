<template>
<div
  v-if="popShowAddContainer"
  class="base-pop">
  <div class="pop-box middle">
    <a
      class="abs close"
      @click="popHide">x</a>
    <div class="title">{{$t('AddContainer')}}</div>
    <div class="layer">
      <div class="label">{{$t('spaceId')}}：</div>
      <a-input
        :disabled="true"
        :value="hoverSpaceInfo.spaceId" />
    </div>
    <div class="layer">
      <div class="label">{{$t('ContainerId')}}：</div>
      <a-input
        :value="hoverSpaceInfo.config.object"
        @keyup="inputChange" />
    </div>
    <div class="layer">
      <div class="label">{{$t('Type')}}：</div>
      <a-select
        :default-value="hoverSpaceInfo.config.priority"
        @change="selectChange">
        <a-select-option value="0">0</a-select-option>
        <a-select-option value="1">1</a-select-option>
      </a-select>
    </div>
    <div class="btn">
      <a-button @click="popHide">{{$t('cancel')}}</a-button>
      <a-button
        type="primary"
        @click="save">{{$t('save')}}</a-button>
    </div>
  </div>
</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'AddContainer',
  computed: {
    ...mapState(['popShowAddContainer', 'application']),
    floorDirection() {
      return this.$store.state.factory.params.floorDirection;
    },
    hoverSpaceInfo() {
      return this.$store.state.factory.hoverSpaceInfo;
    },
  },
  methods: {
    popHide() {
      this.$store.commit('SET_ADD_CONTAINER');
    },
    async save() {
      this.popHide();
      const res = this.$store.dispatch('AddContainer');
      res && this.$message.success(this.$t('TaskReceivedMsg'));
    },
    inputChange(e) {
      this.$store.commit('UPDATE_ADD_CONTAINER_CONFIG', { key: 'object', value: e.target.value });
    },
    selectChange(value) {
      this.$store.commit('UPDATE_ADD_CONTAINER_CONFIG', { key: 'priority', value });
    },
  },
};
</script>

<style lang="less" scoped>
.pop-box {
  width: 300px;
  .title {
    font-size: 20px;
  }
}
.label {
  width: 100px !important;
  justify-content: flex-end;
}
</style>
