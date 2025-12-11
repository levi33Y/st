<script setup lang="ts"></script>

<template>
  <div class="meeting-skeleton">
    <div class="video-area">
      <el-skeleton :rows="0" animated>
        <template #template>
          <div class="user-avatar">
            <el-skeleton-item variant="circle" class="avatar" />
            <el-skeleton-item variant="text" class="username" />
          </div>
        </template>
      </el-skeleton>
    </div>

    <div class="bottom-bar">
      <el-skeleton :rows="0" animated>
        <template #template>
          <div class="control-buttons">
            <div class="media">
              <el-skeleton-item variant="button" />
              <el-skeleton-item variant="button" />
            </div>
            <el-skeleton-item variant="button" class="end-btn" />
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.meeting-skeleton {
  width: 100vw;
  height: 100vh;
  background-color: white;
  display: flex;
  flex-direction: column;

  .header {
    flex: 1;
  }

  .video-area {
    height: calc(100vh - 143px);
    margin: 16px 16px 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f8fc;

    .user-avatar {
      display: flex;
      flex-direction: column;
      align-items: center;

      .avatar {
        width: 72px;
        height: 72px;
        margin-bottom: 12px;
      }

      .username {
        width: 60px;
        height: 16px;
      }
    }
  }

  .bottom-bar {
    background: #fff;
    padding: 12px 24px;

    .control-buttons {
      height: 66px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;

      .media {
        display: flex;
        column-gap: 20px;
      }

      .end-btn {
        width: 98px;
      }
    }
  }
}
</style>
