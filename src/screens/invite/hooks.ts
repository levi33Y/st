import { ElMessage } from "element-plus";
import { useAppStore } from "../../stores/useAppStore";
import { useToggle } from "@vueuse/core";
import { useRoute } from "vue-router";
import { ref, reactive, onMounted } from "vue";
import { getInviteApi } from "../../services";
interface MeetingInviteData {
  userName: string;
  moderatorName: string;
  meetingNumber: string;
  title: string;
  passWard: string;
  url: string;
}
export const useAction = () => {
  const appStore = useAppStore();
  const { query } = useRoute();
  const meetingId = ref(query.meetingId as string);
  const [visible, onToggle] = useToggle();
  const inviteData = reactive<MeetingInviteData>({
    userName: "",
    moderatorName: "",
    meetingNumber: "",
    title: "",
    passWard: "",
    url: "",
  });
  const onCopyAll = () => {
    const isPassword = inviteData.passWard
      ? `密码: ${inviteData.passWard}`
      : "";
    window.clipboard.writeText(
      `${inviteData.userName} 邀請您加入${appStore.appInfo.name}會議\n\r會議主題: ${inviteData.title}\n\r會議號: ${inviteData.meetingNumber}\n\r會議鏈接: ${inviteData.url}\n\r${isPassword}`,
    );
    ElMessage({
      offset: 28,
      message: "會議邀請已複製到剪切板",
      type: "success",
    });
  };

  const onCopyMeeting = () => {
    window.clipboard.writeText(
      `#${appStore.appInfo.name}：${inviteData.meetingNumber}`,
    );
    ElMessage({
      offset: 28,
      message: "會議號已複製到粘貼板",
      type: "success",
    });
  };
  const onCopyUrl = () => {
    window.clipboard.writeText(`${inviteData.url}`);
    ElMessage({
      offset: 28,
      message: "會議鏈接已複製到粘貼板",
      type: "success",
    });
  };
  const getMeetingData = async () => {
    const result = await getInviteApi(meetingId.value);
    if (result.code === 200) {
      inviteData.title = result?.data?.title;
      inviteData.userName = result?.data?.sender;
      inviteData.moderatorName = result?.data?.sender;
      inviteData.meetingNumber = result?.data?.meetingNumber;
      inviteData.passWard = result?.data?.password;
      inviteData.url = result?.data?.url;
    }
  };
  onMounted(() => {
    getMeetingData();
  });
  return {
    onCopyAll,
    onCopyMeeting,
    visible,
    onToggle,
    appStore,
    getMeetingData,
    onCopyUrl,
    inviteData,
  };
};
