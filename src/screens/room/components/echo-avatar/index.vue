<template>
  <div class="echo-avatar">
    <div class="header">
      <img src="../../../../assets/images/echo-avatar.png" />
    </div>

    <div class="settings">
      <p class="title">音色與語種設置</p>
      <div class="settings-item">
        <p class="item-title">我的音色設置：</p>
        <div>
          <el-select
            class="item-select"
            v-model="currentVoice"
            placeholder="克隆音色"
            size="large"
            @change="setCurrentVoiceSettings"
          >
            <el-option label="系統音色" :value="true" />

            <el-option
              :disabled="!isShowRecordList"
              label="克隆音色"
              :value="false"
            />
          </el-select>
        </div>
      </div>
      <div class="settings-item">
        <p class="item-title">我說話的語種設置：</p>
        <div>
          <el-select
            class="item-select"
            :model-value="state.speechLanguageType"
            placeholder="說話的語種"
            size="large"
            @change="setSpeechSettings"
          >
            <el-option
              v-for="language in choiceCloneLanguages"
              :key="language.value"
              :label="language.label"
              :value="language.value"
            />
          </el-select>
        </div>
      </div>
      <div class="settings-item">
        <p class="item-title">我聽到的語種設置：</p>
        <div>
          <el-select
            class="item-select"
            :model-value="state.targetLanguageType"
            placeholder="聽到的語種"
            size="large"
            @change="setTargetSettings"
          >
            <el-option
              v-for="language in choiceCloneLanguages"
              :key="language.value"
              :label="language.label"
              :value="language.value"
            />
          </el-select>
        </div>
      </div>
    </div>

    <div class="translate">
      <p class="title">同聲傳譯</p>
    </div>

    <div class="chat-list" v-loading="isNewSpeech">
      <el-scrollbar ref="scrollbar">
        <div class="chat-container">
          <template v-for="item in meetingSpeechList">
            <Chat
              :isSelf="appStore.userInfo.id === item.userId"
              :meetingSpeech="item"
              @updateStatus="updateStatus"
              @cancelStatus="cancelStatus"
            />
          </template>
        </div>
      </el-scrollbar>
    </div>

    <Footer
      :isSpeaking="isSpeaking"
      :countdown="countdown"
      :click="onSpeaking"
    />
  </div>
</template>

<script setup lang="ts">
import Chat from "./components/chat/index.vue";
import Footer from "./components/footer/index.vue";
import { useAction } from "./hooks";
import { EchoAvatarProps } from "./props";

const props = defineProps<EchoAvatarProps>();

const {
  appStore,
  scrollbar,
  state,
  targetLanguages,
  listenedLanguages,
  isSpeaking,
  countdown,
  meetingSpeechList,
  currentVoice,
  isShowRecordList,
  isNewSpeech,
  choiceCloneLanguages,
  onSpeaking,
  setSpeechSettings,
  setTargetSettings,
  setCurrentVoiceSettings,
  getList,
  updateStatus,
  cancelStatus,
} = useAction(props);

defineExpose({
  getList,
});
</script>

<style scoped lang="scss">
@use "./index";
</style>
