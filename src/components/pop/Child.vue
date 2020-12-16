<template>
  <div class="tabs_one">
    <div class="title">{{title}}</div>
    <div class="one">
      <div
        class="layer"
        v-for="item in list"
        :key="item.label">
        <div class="label">
          {{$t(item.label)}}
          <p v-if="!item.param">(功能待添加)</p>
        </div>
        <div class="text">
          <a-switch
            v-if="item.type === 'switch'"
            v-model="item.value"
            @focus="focus(item.param)"
            @change="switchChange" />
          <a-input
            v-if="item.type === 'input'"
            :value="item.value"
            :suffix="item.unit"
            @focus="focus(item.param)"
            onkeyup="value=value.replace(/[^\d]/g,'')"
            @change="inputChange" />
          <a-input
            v-if="item.type === 'input_num'"
            :value="item.value"
            @focus="focus(item.param)"
            onkeyup="value=value.replace(/[^.\d]/g,'')"
            @change="inputChange2">
            <a-icon
              slot="addonBefore"
              type="plus"
              @click="plus" />
            <a-icon
              slot="addonAfter"
              type="minus" 
              @click="minus"/>
          </a-input>
          <a-radio-group
            v-if="item.type === 'radio'"
            :default-value="item.value"
            @change="radioChange">
            <a-radio
              v-for="o in item.options"
              :key="o.value"
              :value="o.value"
              @focus="focus(item.param)">{{$t(o.label)}}</a-radio>
          </a-radio-group>
        </div>
        <div
          class="desc"
          v-if="item.desc"><a-icon type="question-circle" /> {{$t(item.desc)}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'PopChild',
  props: ['title', 'list'],
  computed: {
    ...mapState({
      application: (state) => state.application,
    }),
  },
  data() {
    return {
      param: '',
    };
  },
  methods: {
    radioChange(e) {
      const value = e.target.value;
      if (this.param === 'showContainersType') {
        this.$store.commit('SET_PARAMS', { key: 'showContainersType', value });
        this.application && this.application.showContainersType(value);
      } else {
        this.$store.commit('SET_THEMES_ID', value);
        window.location.reload();
      }
    },
    inputChange(e) {
      const value = Number(e.target.value.replace(/[^\d]/g, ''));
      value && this.$store.commit('SET_PARAMS', { key: this.param, value });
    },
    inputChange2(e) {
      const value = Number(e.target.value.replace(/[^.\d]/g, ''));
      value && this.$store.commit('SET_PARAMS', { key: this.param, value });
    },
    plus() {
      const item = this.list.find((one) => one.param === 'moveSpeed');
      item.value = (item.value * 1000 + item.num * 1000) / 1000;
      this.$store.commit('SET_PARAMS', { key: 'moveSpeed', value: item.value });
    },
    minus() {
      const item = this.list.find((one) => one.param === 'moveSpeed');
      item.value = (item.value * 1000 - item.num * 1000) / 1000;
      item.value = item.value > 0 ? item.value : 0;
      this.$store.commit('SET_PARAMS', { key: 'moveSpeed', value: item.value });
    },
    focus(param) {
      this.param = param;
    },
    switchChange(value) {
      if (this.param) {
        this.$store.commit('SET_PARAMS', { key: this.param, value });
        this.application && this.application[this.param](value);
      } else {
        console.log('该功能正在开发。。。请稍后');
      }
    },
  },
};
</script>
