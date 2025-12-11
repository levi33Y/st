import { armsService } from "@components/arms/ArmsService";
import { ElLoading, ElMessage, FormInstance, FormRules } from "element-plus";
import { nextTick, onMounted, reactive, ref, toRaw } from "vue";
import { useNavigation } from "../../hooks/useNavigation";
import { LoginApi } from "../../services";
import { useAppStore } from "../../stores/useAppStore";

export const useAction = () => {
  const appStore = useAppStore();

  const navigation = useNavigation();

  const formRef = ref<FormInstance>();

  const loaded = ref(false);

  const userinfo = reactive({
    grant_type: "password",
    username: "",
    password: "",
  });

  const errorDescription = ref("");

  const rules = reactive<FormRules>({
    username: [
      { required: true, message: "UserName is Required", trigger: "blur" },
    ],
    password: [
      { required: true, message: "Password is Required", trigger: "blur" },
    ],
  });

  const onLogin = () => {
    errorDescription.value = "";
    formRef.value?.validate(async (valid) => {
      if (valid) {
        const loading = ElLoading.service({ fullscreen: true });
        try {
          const response = await LoginApi(toRaw(userinfo)).catch((error) => {
            armsService.addApi(
              JSON.stringify({
                code: "LOGIN ERROR",
                data: "Username:" + userinfo.username,
                msg: error?.toString(),
              }),
              false,
            );

            errorDescription.value = error?.toString();
          });
          if (response?.access_token) {
            appStore.login(response);
            gotoHome();
          }
        } finally {
          loading.close();
        }
      }
    });
  };

  const gotoHome = () => navigation.close("/").navigate("/home");

  const gotoSettings = () => navigation.navigate("/settings");

  const onDevelopingTip = () => {
    ElMessage({
      customClass: "login-message-box",
      offset: 36,
      message: "開發中",
      type: "warning",
    });
  };

  onMounted(() => {
    nextTick(() => {
      if (appStore.expires) {
        if (+new Date(appStore.expires) > +new Date()) {
          setTimeout(() => {
            gotoHome();
          }, 500);
          return;
        }
      }
      loaded.value = true;
    });
  });

  return {
    loaded,
    formRef,
    userinfo,
    rules,
    errorDescription,
    appStore,
    onLogin,
    gotoSettings,
    onDevelopingTip,
  };
};
