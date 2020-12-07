<template>
  <div class="error">
    <img src="@/assets/401.gif" />
    <p>页面丢失。。。</p>
    <div class="btn">
      <a @click="back">返回首页</a>
      <a @click="reset">重新登录 🔙</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'error',
  methods: {
    back() {
      this.$router.push('/scada');
    },
    reset() {
      this.$storage.clear();
      this.$router.push('/login');
    },
  },
};
</script>

<style lang="less" scoped>
.error {
  height: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  p {
    font-size: 24px;
    padding-top: 20px;
  }
  .btn {
    width: 300px;
    display: flex;
    justify-content: space-between;
    a {
      padding: 0 20px;
      font-size: 20px;
      border-radius: 5px;
      border: solid 2px #f00;
    }
  }
}
</style>
