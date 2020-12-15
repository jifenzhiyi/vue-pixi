<template>
<div
  v-if="popShowUpdateContainerOrit"
  class="base-pop">
  <div class="pop-box middle">
    <a
      class="abs close"
      @click="popHide">x</a>
    <div class="title">{{$t('updateContainerOrit')}}</div>
    <div class="layer">
      <div class="label">{{$t('ContainerId')}}：</div>
      <div class="text">{{ hoverSpaceInfo.containerId }}</div>
    </div>
    <div class="orientation">
      <img
        class="middle cimg"
        src="img/container.png"
        :style="{ transform: `translate(-50%, -50%) rotateZ(${orientation * 90}deg)` }" />
      <img
        class="abs simg"
        src="img/orientation.png" />
      <img
        class="middle bimg"
        src="img/revolve.png"
        @click="rotate" />
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
  name: 'UpdateContainerOrit',
  computed: {
    ...mapState(['popShowUpdateContainerOrit']),
    hoverSpaceInfo() {
      return this.$store.state.factory.hoverSpaceInfo;
    },
    factoryConfig() {
      return this.$store.state.factory.factoryConfig;
    },
  },
  watch: {
    popShowUpdateContainerOrit() {
      if (this.popShowUpdateContainerOrit) {
        const container = this.factoryConfig.containerMap[this.hoverSpaceInfo.containerId];
        this.orientation = container.orientation;
        if (this.orientation === 1) this.orientation = 3;
        else if (this.orientation === 3) this.orientation = 1;
      }
    },
  },
  data() {
    return {
      orientation: 0,
    };
  },
  methods: {
    popHide() {
      this.$store.commit('SET_CONTAINER_ORIT');
    },
    async save() {
      this.popHide();
      let parameter = this.orientation % 4;
      if (parameter === 1) parameter = 3;
      else if (parameter === 3) parameter = 1;
      this.$store.dispatch('updateContainerOrit', parameter);
    },
    rotate() {
      this.orientation += 1;
    },
  },
};
</script>

<style lang="less" scoped>
.pop-box {
  width: 400px;
  align-items: center;
  .title {
    font-size: 20px;
  }
  .orientation {
    width: 350px;
    height: 350px;
    margin-top: 10px;
    position: relative;
    border: dashed 1px #ccc;
    .cimg {
      width: 50%;
      transition: all 300ms;
    }
    .simg {
      top: 10px;
      right: 10px;
      width: 70px;
    }
    .bimg {
      width: 52px;
      cursor: pointer;
    }
  }
}
.layer {
  padding: 0;
  justify-content: center;
  .label {
    width: auto !important;
    justify-content: flex-end;
  }
}
</style>
