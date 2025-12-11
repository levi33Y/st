<template>
  <Header
    :title="`參會人（${list.length}）`"
    :hide-maximizable="true"
    :is-destroy="true"
  />
  <div class="container">
    <el-input
      class="search-meeting"
      placeholder="搜索"
      v-model="searchQuery"
      :suffix-icon="Search"
    />
    <el-scrollbar height="550px">
      <div class="member-list">
        <div
          class="member-item"
          v-for="(member, index) in filteredList"
          :key="index"
        >
          <div class="member-item-label">
            <Avatar :size="40" :name="member.userName" :src="member.url" />
          </div>
          <div class="member-item-info">
            <div>{{ member.userName }}</div>
            <div class="designated-moderator-label">
              {{ member.isHost ? "指定主持人" : "" }}
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import Avatar from "@components/avatar/index.vue";
import Header from "@components/header/index.vue";
import { Search } from "@element-plus/icons-vue";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

const { query } = useRoute();

const searchQuery = ref("");

const list = JSON.parse((query.participants as string) ?? "") ?? [];

const filteredList = computed(() => {
  if (!searchQuery.value) {
    return list;
  }
  return list.filter((member: any) =>
    member?.userName?.toLowerCase()?.includes(searchQuery.value?.toLowerCase()),
  );
});
</script>

<style scoped lang="scss">
.container {
  .search-meeting {
    padding: 16px 24px;
    height: 70px;
  }

  .member-list {
    padding: 0 var(--spacing-medium-plus);

    .member-item {
      height: 64px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--border-color-light);

      .member-item-label {
        width: 56px;
        flex-shrink: 0;
      }

      .designated-moderator-label {
        color: #737489;
      }

      .member-item-info {
        display: flex;
        flex-direction: column;
        row-gap: var(--spacing-tiny);
      }
    }
  }
}
</style>
