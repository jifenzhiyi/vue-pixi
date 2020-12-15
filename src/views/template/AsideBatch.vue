<template>
  <div class="aside-info">
    <div class="info-edit">
      <div class="edit-one">
        <div class="title">{{$t('editContainer')}}</div>
      </div>
    </div>
    <div class="info-edit">
      <div class="edit-one">
        <div class="title">{{$t('ContainerPlace')}}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AsideBatch',
};
</script>

<style lang="less" scoped>
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
  }
  &:last-child .edit-one { border: 0; }
}
</style>
