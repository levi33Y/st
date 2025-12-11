<template>
  <div class="home-user-info">
    <el-popover
      popper-class="user-info-popover"
      placement="bottom"
      :width="340"
      :show-arrow="false"
      trigger="click"
    >
      <template #reference>
        <div class="user-info">
          <Avatar
            :size="36"
            cursor="pointer"
            :name="appStore.userName"
            :src="appStore.userInfo.url"
          />
          <p class="nickname">{{ appStore.userName }}</p>
        </div>
      </template>
      <div class="user-info-bg">
        <div class="user-info-container">
          <p class="user-info-title">個人中心</p>
          <div class="user-info">
            <div
              class="avatar-wrapper"
              @mouseenter="showEditIcon = true"
              @mouseleave="showEditIcon = false"
              @click="handleAvatarClick"
            >
              <Avatar
                :size="42"
                :name="appStore.userName"
                :src="appStore.userInfo.url"
              />
              <div v-if="showEditIcon" class="edit-overlay">
                <el-icon :size="24" color="#fff">
                  <EditSvg />
                </el-icon>
              </div>
            </div>
            <span class="nickname">{{ appStore.userName }}</span>
          </div>
        </div>
        <div class="logout-btn">
          <el-button type="primary" plain @click="onLogout">退出登錄</el-button>
        </div>
      </div>
    </el-popover>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { UploadAvatar } from "@/services/apis/home";
import EditSvg from "@icon/edit/index.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ref } from "vue";
import Avatar from "../../../../components/avatar/index.vue";
import { useAppStore } from "../../../../stores/useAppStore";

interface Emits {
  (event: "logout"): void;
}

const emits = defineEmits<Emits>();

const appStore = useAppStore();

const showEditIcon = ref(false);

const fileInputRef = ref<HTMLInputElement>();

const isUploading = ref(false);

const handleAvatarClick = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;

  const file = target.files?.[0];

  if (!file) return;

  try {
    if (!file.type.startsWith("image/")) {
      throw new Error("請選擇圖片文件");
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error("圖片大小不能超過 2MB");
    }

    isUploading.value = true;

    const formData = new FormData();

    formData.append("file", file);

    const result = await UploadAvatar(formData);

    if (!result?.url) {
      throw new Error("頭像上傳失敗");
    }

    appStore.updateUserInfo({
      ...appStore.userInfo,
      url: result.url,
    });

    ElMessage.success("修改成功");
  } catch (error: any) {
    ElMessage.error(error?.message ?? "頭像上傳失敗");
  } finally {
    isUploading.value = false;

    if (target) {
      target.value = "";
    }
  }
};

const onLogout = () => {
  ElMessageBox.confirm("是否確認執行操作?", {
    confirmButtonText: "是",
    cancelButtonText: "否",
    showClose: false,
    center: true,
    // customClass: "el-message-box",
  }).then(async () => {
    emits("logout");
  });
};
</script>

<style lang="scss">
@use "./index";
</style>
