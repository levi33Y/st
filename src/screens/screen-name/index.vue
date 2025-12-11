<template>
  <div class="screen-name" v-if="!isOneScreen">
    {{ query?.index ?? "" }}
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref } from "vue";
import { onMounted } from "vue";

const { query } = useRoute();

const isOneScreen = ref<boolean>(true);

onMounted(() => {
  checkOnlyOneScreen();
});

const checkOnlyOneScreen = async () => {
  const allDisplays = await window.electronAPI.allDisplays();

  isOneScreen.value = allDisplays.length === 1;
};
</script>

<style scoped lang="scss">
.screen-name {
  width: 100%;
  height: 100%;
  font-size: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2d313c;
  opacity: 1;
  color: white;
}
</style>
