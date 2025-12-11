<template>
  <Screen>
    <arms>
      <router-view />
    </arms>
  </Screen>
</template>

<script setup lang="ts">
import Arms from "@components/arms/index.vue";
import Screen from "@components/screen/index.vue";
</script>
