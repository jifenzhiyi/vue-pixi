<template>
  <div class="aside-info">
    <div class="info-edit">
      <div class="edit-one">
        <div class="title">{{ $t("editContainer") }}</div>
        <div class="layer">
          <div class="label">{{ $t("containerType") }}：</div>
          <a-select
            :allow-clear="true"
            :placeholder="`请选择${$t('containerType')}`"
            @change="selectChange">
            <a-select-option value="0">0</a-select-option>
            <a-select-option value="1">1</a-select-option>
          </a-select>
        </div>
        <div class="layer">
          <div class="label">{{ $t("originDirection") }}：</div>
          <a-radio-group v-model="value">
            <a-radio :value="2">上</a-radio>
            <a-radio :value="0">下</a-radio>
            <a-radio :value="3">左</a-radio>
            <a-radio :value="1">右</a-radio>
          </a-radio-group>
        </div>
        <div class="btn">
          <a-button
            v-if="buttonTypeList.updateContainer"
            :disabled="!(selectedContainers.length > 0 && !!this.type)"
            @click="updateContainerType">{{ $t("updateSpec") }}</a-button>
          <a-button
            v-if="buttonTypeList.updateContainerZone"
            :disabled="true"
            @click="updateContainerZone">{{$t('updateArea')}}
          </a-button>
          <a-button
            v-if="buttonTypeList.deleteContainer"
            :disabled="selectedContainers.length === 0"
            @click="deleteContainer">{{ $t("RemoveContainer") }}</a-button>
          <a-button
            v-if="buttonTypeList.updateContainerDirection"
            :disabled="selectedContainers.length === 0"
            @click="updateContainerDirection">{{ $t("updateContainerOrit") }}</a-button>
        </div>
      </div>
    </div>
    <div class="info-edit">
      <div class="edit-one">
        <div class="title">{{ $t("ContainerPlace") }}</div>
        <a-button
          size="small"
          icon="delete"
          class="abs clear"
          :disabled="selectedContainers.length === 0"
          @click="clear">{{ $t("clear") }}</a-button>
      </div>
      <div class="info-list">
        <div class="info-one">
          <div
            class="ellipsis"
            v-for="item in list"
            :key="item">
            {{ $t(item) }}
          </div>
        </div>
        <div
          class="info-one"
          v-for="item in selectedContainers"
          :key="item.containerId">
          <span>{{ item.containerId }}</span>
          <span>{{ item.type }}</span>
          <span>{{ item.zoneId }}</span>
        </div>
      </div>
      <div class="line" />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { taskAdd, operation } from '@/views/api.js';

export default {
  name: 'AsideBatch',
  computed: {
    ...mapState({
      application: (state) => state.application,
      menuList: (state) => state.menuList,
      selectedContainers: (state) => state.factory.selectedContainers,
      objectIdList: (state) => state.factory.selectedContainers.map((one) => one.containerId),
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
      type: null,
      value: 2,
      list: ['ContainerId', 'containerType', 'containerArea'],
    };
  },
  methods: {
    selectChange(val) {
      this.type = val;
    },
    clear() {
      this.application && this.application.resetSelectedContainers();
      this.$store.commit('SET_SELECT_CONTAINERS', []);
    },
    async updateContainerType() {
      const objectIdList = this.selectedContainers.map((one) => one.containerId);
      const obj = {
        code: 5,
        parameter: this.type,
        objectIdList,
      };
      const res = await operation(obj, '/updateContainerType');
      if (res) {
        this.$message.success(this.$t('TaskReceivedMsg'));
        this.clear();
      }
    },
    updateContainerZone() {
      console.log('修改片区');
    },
    async actionTask() {
      const objectIdList = this.selectedContainers.map((one) => ({
        objectId: one.containerId,
        spaceId: one.spaceId,
      }));
      const obj = {
        code: 16,
        objectIdList,
      };
      const res = await taskAdd('/deleteContainer', obj);
      if (res) {
        this.$message.success(this.$t('TaskReceivedMsg'));
        objectIdList.forEach((item) => {
          this.application.removeContainer(item.objectId, this.application); // TODO 手动删除货架
        });
        this.clear();
      }
    },
    deleteContainer() {
      this.$notice_confirm({
        minfo: this.$t('RemoveAllContainer'),
        func: () => this.actionTask(),
      });
    },
    async updateContainerDirection() {
      const objectIdList = this.selectedContainers.map((one) => one.containerId);
      const obj = {
        code: 22,
        parameter: this.value,
        objectIdList,
      };
      const res = await operation(obj, '/updateContainerDirection');
      res && this.$message.success(this.$t('TaskReceivedMsg'));
    },
  },
};
</script>

<style lang="less" scoped>
.info-edit {
  display: flex;
  padding: 0 15px;
  border-radius: 4px;
  flex-direction: column;
  .edit-one {
    position: relative;
    padding-bottom: 15px;
    border-bottom: solid 1px #ddd;
    .title {
      color: #333;
      padding-top: 15px;
      font-weight: bold;
    }
    .label {
      width: 70px;
    }
    .clear {
      right: 0;
      top: 14px;
    }
  }
  .btn {
    display: flex;
    justify-content: space-between;
    .ant-btn {
      height: 30px;
      font-size: 12px;
      padding: 0 13px;
      margin-top: 20px;
      &:last-child {
        margin-right: 0;
      }
    }
  }
  &:last-child .edit-one {
    border: 0;
  }
}
.info-list .info-one {
  .ellipsis, span {
    width: 33%;
  }
}
.line {
  height: 20px;
}
</style>
