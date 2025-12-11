<script setup lang="ts"></script>

<template>
  <div class="echo-avatar-container">
    <div class="echo-avatar-pre">
      <img src="../../assets/images/icon-ea.png" :style="`width:${32}px;`" />
    </div>
    <div class="echo-avatar-sub">
      <img
        class="echo-avatar-logo"
        :style="`width:${75}px;`"
        src="../../assets/images/echo-avatar.png"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./index.scss";
</style>
