<template>
  <div class="container">
    <div class="circle" />
    <div class="text">您正在共享屏幕</div>
  </div>
</template>

<style scoped lang="scss">
body {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  overflow: hidden;
}
.container {
  width: 100vw;
  height: 100vh;
  background-color: #474a4f;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: rgb(221, 218, 218);
  position: absolute;
  left: 50%;
  transform: translate(-50%);
}
.circle {
  width: 12px;
  height: 12px;
  background-color: red;
  border-radius: 50%;
  margin-right: 10px;
  animation: blink 2s infinite;
}
@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
.text {
  font-size: 12px;
}
</style>
