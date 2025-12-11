import { FormInstance, FormRules } from "element-plus";
import { clone } from "lodash";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import DialogWindow from "../../components/dialog-window/index.vue";
import { CustomFrequencyTypeEnum } from "../../services/apis/meeting/types";
import {
  ScheduleMeetingChannelMessageEnum,
  ScheduleMeetingChannelMessageProps,
} from "../schedule-meeting/props";
import { IScheduleMeetingCycleFormProps } from "./props";

export const useAction = () => {
  const { query } = useRoute();

  const formModelConst: IScheduleMeetingCycleFormProps = {
    frequency: CustomFrequencyTypeEnum.Daily,
    weeklyOption: [],
    monthlyOption: [],
    cycleTimes: 1,
    endDate: "",
  };

  const dialogWindowRef = ref<InstanceType<typeof DialogWindow>>();

  const formRef = ref<FormInstance>();

  const formState = ref<IScheduleMeetingCycleFormProps>({
    frequency: CustomFrequencyTypeEnum.Daily,
    weeklyOption: [],
    monthlyOption: [],
    cycleTimes: 1,
    endDate: "",
  });

  const rules = reactive<FormRules>({
    cycleFrequency: [
      {
        required: true,
        validator: (rule, value, callback) => {
          let isValid = false;

          switch (formState.value.frequency) {
            case CustomFrequencyTypeEnum.Weekly:
              isValid = !(formState.value.weeklyOption.length > 0);
              break;
            case CustomFrequencyTypeEnum.Monthly:
              isValid = !(formState.value.monthlyOption.length > 0);
              break;
            default:
              break;
          }

          !isValid ? callback() : callback(new Error("頻率不能為空"));
        },
      },
    ],
  });

  const formData = ref<ScheduleMeetingChannelMessageProps>({
    type: ScheduleMeetingChannelMessageEnum.ScheduleMeetingCycle,
    content: null,
  });

  const handleUpdateRouteQuery = () => {
    const hosts = (
      query?.cycleData ? JSON.parse(query.cycleData as string) : formModelConst
    ) as IScheduleMeetingCycleFormProps;

    formState.value = {
      frequency: Number(hosts.frequency),
      weeklyOption: hosts.weeklyOption,
      monthlyOption: hosts.monthlyOption,
      cycleTimes: Number(hosts.cycleTimes),
      endDate: hosts.endDate,
    };
  };

  const onClose = () => {
    formData.value = {
      ...formData.value,
      content: null,
    };

    dialogWindowRef.value?.onConfirm("/schedule-meeting-cycle");
  };

  const onConfirm = () => {
    formRef.value?.validate((valid) => {
      if (!valid) {
        return;
      }

      formData.value = {
        ...formData.value,
        content: {
          frequency: formState.value.frequency,
          weeklyOption: clone(formState.value.weeklyOption),
          monthlyOption: clone(formState.value.monthlyOption),
          cycleTimes: formState.value.cycleTimes,
          endDate: formState.value.endDate,
        },
      };

      dialogWindowRef.value?.onConfirm("/schedule-meeting-cycle");
    });
  };

  onMounted(() => {
    handleUpdateRouteQuery();
  });

  return {
    dialogWindowRef,
    formModelConst,
    formData,
    formState,
    formRef,
    rules,
    onClose,
    onConfirm,
  };
};
