import config from "@/config";
import { handlerPathParams } from "@/utils/utils";
import { watchOnce } from "@vueuse/core";
import Docxtemplater from "docxtemplater";
import { ElLoading, ElMessage, ElMessageBox } from "element-plus";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import { camelCase, debounce, isEmpty, isNil } from "lodash";
import moment from "moment-timezone";
import PizZip from "pizzip";
import { h, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { sourcehansansk } from "../../assets/locales/sourcehansansk";
import { useNavigation } from "../../hooks/useNavigation";
import {
  deleteMeetingRecord,
  getRecordDetailApi,
  meetingSummaryApi,
  translationSummaryApi,
} from "../../services";
import {
  MeetingLanguageEnum,
  SummaryStatusEnum,
} from "../../services/apis/meeting/types";
import { useAppStore } from "../../stores/useAppStore";
import { dayDiffByTimeStamp } from "../../utils/moment";
import { getApprovedUrls } from "../../utils/utils";
import MenuButton from "./conotosanssclightmponents/intelligent-menu-button/index.vue";
import {
  ExportTypeEnum,
  IIntelligentDetailStateProps,
  IMenuButtonProps,
  ISummaryStateProps,
  ISummaryTextAbstractProps,
  ISummaryTextProps,
  ITranslateStateProps,
  SegmentedEnum,
} from "./props";

export const useAction = () => {
  const navigation = useNavigation();

  const appStore = useAppStore();

  const { query } = useRoute();

  const router = useRouter();

  const state = reactive<IIntelligentDetailStateProps>({
    recordNumber: query.recordNumber as string,
    title: query.title as string,
    meetingNumber: query.meetingNumber as string,
    startDate: query.startTime as string,
    endDate: query.endTime as string,
    meetingRecordId: query.meetingRecordId as string,
    meetingId: query.meetingId as string,
    videoUrl: "",
    exportType: 1,
    segmented: SegmentedEnum.Recording,
    approvedUrl: "",
  });

  const translateState = reactive<ITranslateStateProps>({
    options: [
      {
        label: "原文（不翻譯）",
      },
      {
        label: "中文",
        value: MeetingLanguageEnum.ZH,
      },
      {
        label: "英文",
        value: MeetingLanguageEnum.EN,
      },
      {
        label: "西文",
        value: MeetingLanguageEnum.ES,
      },
      {
        label: "韓文",
        value: MeetingLanguageEnum.KO,
      },
    ],
    recordDetail: null,
    loading: false,
    timeoutId: null,
  });

  const menuButtonState = reactive<IMenuButtonProps>({
    visible: false,
    data: [
      {
        label: "導出視頻",
        value: ExportTypeEnum.Video,
      },
      {
        label: "導出轉寫內容",
        children: [
          {
            label: "Word",
            value: ExportTypeEnum.TranslateWord,
          },
          {
            label: "PDF",
            value: ExportTypeEnum.TranSlatePdf,
          },
        ],
      },
      {
        label: "導出紀要內容",
        children: [
          {
            label: "Word",
            value: ExportTypeEnum.SummaryWord,
          },
          {
            label: "PDF",
            value: ExportTypeEnum.SummaryPdf,
          },
        ],
      },
    ],
  });

  const summaryState = reactive<ISummaryStateProps>({});

  const menuButtonRef = ref<InstanceType<typeof MenuButton>>();

  const detailVideoRef = ref<any>();

  const onIntelligentList = () => {
    navigation.navigate("/intelligent-list");
    navigation.destroy("/intelligent-detail");
  };

  const handleGetIntelligentDetail = async (language?: number | undefined) => {
    const { data, code, msg } = await getRecordDetailApi(
      state.meetingRecordId,
      language,
    );

    return code === 200 ? data : null;
  };

  const onExport = debounce((value: any[] = []) => {
    const _exportByWord = async (
      data: string[] | ISummaryTextProps,
      type?: "result" | "summary",
    ) => {
      let templateDoc: string = "",
        docData;

      try {
        if (type === "result") {
          templateDoc = "result.docx";

          docData = {
            list: (data as string[]).map((item) => ({
              content: item,
            })),
          };
        } else if (type == "summary") {
          templateDoc = "summary.docx";

          const summaryData = data as ISummaryTextProps;

          docData = {
            result: summaryData.abstract.map((item) => ({
              title: item?.abstractTitle ?? "",
              content: item?.abstractContent ?? "",
            })),
            summary: summaryData.meetingTodoItems.map((item) => ({
              todo: item ?? "",
            })),
          };
        }

        if (!templateDoc || !docData) {
          throw new Error("templateDoc is not defined");
        }

        const response = await fetch(templateDoc);

        const blob = await response.blob();

        const arrayBuffer = await blob.arrayBuffer();

        const zip = new PizZip(arrayBuffer);

        const doc = new Docxtemplater().loadZip(zip);

        doc.setOptions({
          nullGetter: function () {
            return "";
          },
        });

        doc.setData(docData);

        doc.render();

        const out = doc.getZip().generate({
          type: "blob",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        saveAs(out, `${state.title}.docx`);
      } catch (e) {
        ElMessage({
          message: "導出失敗",
          type: "error",
        });
      }
    };

    const _exportByPdf = (
      data: string[] | ISummaryTextProps,
      type: "result" | "summary",
    ) => {
      const doc = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      doc.addFileToVFS("extend", sourcehansansk);

      doc.addFont("extend", "ex", "normal");

      doc.setFont("ex");

      const startX = 10,
        startY = 10,
        lineHeight = 10;

      const pageWidth = doc.internal.pageSize.getWidth() - startX * 2;

      const pageHeight = doc.internal.pageSize.getHeight();

      let nowY = startY;

      try {
        if (type === "result") {
          const resultData = (data as string[]).join("\n");

          const lines = doc.splitTextToSize(resultData, pageWidth, {
            wordwrap: true,
          });

          lines.forEach((line: string, index: number) => {
            if (nowY > pageHeight) {
              doc.addPage();

              nowY = startY;
            }

            doc.text(line, startX, nowY);

            nowY += lineHeight;
          });
        } else if (type == "summary") {
          const summaryTextData = data as ISummaryTextProps;

          const titleTopics = "會議摘要";

          doc.setFontSize(20);

          doc.text(titleTopics, startX, nowY);

          nowY += lineHeight * 2;

          doc.setFontSize(16);

          summaryTextData.abstract?.forEach((topic) => {
            if (nowY > pageHeight) {
              doc.addPage();

              nowY = startY;
            }

            const topicTitle = topic?.abstractTitle ?? "";

            const topicDescription = topic?.abstractContent ?? "";

            doc.text(topicTitle, startX, nowY);

            nowY += lineHeight;

            const lines = doc.splitTextToSize(topicDescription, pageWidth, {
              wordwrap: true,
            });

            lines.forEach((line: string) => {
              doc.text(line, startX, nowY);
              nowY += lineHeight;
            });

            nowY += lineHeight;
          });

          const titleActionItems = "會議待辦";

          doc.setFontSize(20);

          doc.text(titleActionItems, startX, nowY);

          nowY += lineHeight * 2;

          doc.setFontSize(16);

          summaryTextData.meetingTodoItems?.forEach((actionItem) => {
            if (nowY > pageHeight) {
              doc.addPage();

              nowY = startY;
            }
            const formattedActionItem = `• ${actionItem ?? ""}`;

            const lines = doc.splitTextToSize(formattedActionItem, pageWidth, {
              wordwrap: true,
            });

            lines.forEach((line: string) => {
              doc.text(line, startX, nowY);

              nowY += lineHeight;
            });

            nowY += lineHeight;
          });
        }

        doc.save(`${state.title}.pdf`);
      } catch (err) {
        ElMessage({
          message: "導出失敗",
          type: "error",
        });
      }
    };

    const _notExport = () => {
      ElMessage({
        message: "無導出對象",
        type: "warning",
      });
    };

    const _recordTextFormat = (): string[] =>
      translateState.recordDetail?.meetingRecordDetails.map((item) => {
        const content =
          (isNil(state.language)
            ? item.originalContent
            : item.originalTranslationContent) ?? "";

        return `${item.username}(${item?.timePoint}): ${
          content.endsWith("\n") ? content : content + "\n"
        }`;
      }) ?? [];

    const _downloadVideo = async (url: string[]) => {
      const approvedUrl = await getApprovedUrls(url);

      const res = await window.electronAPI.downloadVideo(approvedUrl);

      if (!res.success) {
        throw new Error("導出失敗");
      }

      ElMessage({
        message: h("div", { style: "line-height: 1; font-size: 14px" }, [
          h("span", null, "導出成功，"),
          h(
            "span",
            {
              style: "color: teal; cursor: pointer",
              onClick: async () => {
                await window.fileSystem.openDirectory(res.directory);
              },
            },
            "查看文件",
          ),
        ]),
        type: "success",
      });
    };

    menuButtonRef?.value && menuButtonRef.value.hide();

    switch (value.at(-1) as ExportTypeEnum) {
      case ExportTypeEnum.SummaryPdf:
        summaryState.summaryText
          ? _exportByPdf(summaryState.summaryText, "summary")
          : _notExport();
        break;
      case ExportTypeEnum.SummaryWord:
        summaryState.summaryText
          ? _exportByWord(summaryState.summaryText, "summary")
          : _notExport();
        break;
      case ExportTypeEnum.TranslateWord:
        let targetWord = _recordTextFormat();

        !isEmpty(targetWord)
          ? _exportByWord(targetWord, "result")
          : _notExport();
        break;
      case ExportTypeEnum.TranSlatePdf:
        let targetPdf = _recordTextFormat();

        !isEmpty(targetPdf) ? _exportByPdf(targetPdf, "result") : _notExport();
        break;
      case ExportTypeEnum.Video:
        _downloadVideo([state?.approvedUrl]).catch(() => {
          _notExport();
        });

        break;
    }
  }, 300);

  const onTranslate = async (language?: number) => {
    translateState.loading = true;

    try {
      const { data } = await translationSummaryApi(
        state.meetingRecordId,
        language,
      );

      const speakInfos =
        data?.meetingRecordDetails?.map((item) => {
          return {
            id: item?.id,
            userName: item?.username,
            speakContent: item?.originalContent,
            speakTranslationContent: item?.originalTranslationContent,
            speakTime: item?.speakEndTime - item?.speakStartTime,
          };
        }) ?? [];

      if (!isEmpty(speakInfos) && !isNil(language)) {
        await meetingSummaryApi({
          language: language,
          meetingRecordId: data.id,
          meetingNumber: data.meetingNumber,
          speakInfos: speakInfos,
        });
      }

      state.language = language;

      handleTranslate(language);
    } catch (err) {
      translateState.loading = false;

      ElMessage({
        message: "翻譯失敗",
        type: "error",
      });
    }
  };

  const handleTranslate = (language?: number) => {
    translateState.timeoutId && clearTimeout(translateState.timeoutId);

    handleGetIntelligentDetail(language)
      .then(async (data) => {
        const summary = data?.summary;

        const isComputed = data?.meetingRecordDetails?.some((item) => {
          return isNil(language)
            ? isNil(item?.originalContent)
            : isNil(item?.originalTranslationContent);
        });

        state.approvedUrl = data?.url ?? "";

        if (
          !isComputed &&
          (!summary || summary?.status === SummaryStatusEnum.Completed)
        ) {
          const record = moment(
            query.startTime as string,
            "YYYY-MM-DD HH:mm:ss",
          ).unix();

          translateState.recordDetail = data && {
            ...data,
            meetingRecordDetails:
              data?.meetingRecordDetails.map((item) => ({
                ...item,
                timePoint: dayDiffByTimeStamp(
                  record ?? 0,
                  item.speakStartTime ?? 0,
                ),
              })) ?? [],
          };

          if (data && summary) {
            summaryState.summaryText = {
              abstract:
                (summary.summaryDto?.abstract.map((item) =>
                  Object.fromEntries(
                    Object.entries(item).map(([key, value]) => [
                      camelCase(key),
                      value,
                    ]),
                  ),
                ) as ISummaryTextAbstractProps[]) ?? [],
              meetingTodoItems:
                (summary.summaryDto?.meeting_todo_items?.map(
                  ({ meeting_todo_item }) => meeting_todo_item,
                ) as string[]) ?? [],
            };

            summaryState.targetLanguage = summary.targetLanguage;
          } else {
            summaryState.summaryText = undefined;
          }

          translateState.timeoutId && clearTimeout(translateState.timeoutId);

          translateState.loading = false;
        } else {
          translateState.timeoutId = setTimeout(() => {
            handleTranslate(language);
          }, 3000);
        }
      })
      .catch((err) => {
        ElMessage({
          message: "操作失敗",
          type: "error",
        });

        translateState.loading = false;
      });
  };

  const onRemoveRecord = async () => {
    ElMessageBox.confirm("是否確認執行操作?", {
      confirmButtonText: "是",
      cancelButtonText: "否",
      showClose: false,
      center: true,
      // customClass: "el-message-box",
    }).then(async () => {
      const loading = ElLoading.service({ fullscreen: true });
      try {
        const { status } = await deleteMeetingRecord([state.meetingRecordId]);

        if (status === 200) {
          ElMessage({
            offset: 50,
            message: "操作成功",
            type: "success",
          });
        } else {
          ElMessage({
            offset: 50,
            message: "操作失敗",
            type: "error",
          });
        }
      } finally {
        loading.close();
        navigation.destroy("/intelligent-detail");
      }
    });
  };

  const onJumpTime = async (targetTime: number) => {
    if (targetTime >= 0 && detailVideoRef.value) {
      // 使用 Video.js 组件的 setCurrentTime 方法
      detailVideoRef.value.setCurrentTime(Math.floor(targetTime));
    }
  };

  const handleUpdateVideoUrl = async () => {
    if (isEmpty(state.approvedUrl)) {
      return;
    }

    const res = await getApprovedUrls([state.approvedUrl]);

    state.videoUrl = typeof res === "string" ? res : res.at(0) ?? "";
  };

  const isEditVideo = ref(false);

  const onCutVideo = () => {
    if (!state.videoUrl) {
      ElMessage.warning("資源未加載");

      return;
    }

    isEditVideo.value = true;
  };

  const copyRecordLink = () => {
    try {
      window.clipboard.writeText(
        `${config.recordShareBasicUrl}?${handlerPathParams(query)}`,
      );

      ElMessage({
        offset: 28,
        message: "已複製鏈接 ",
        type: "success",
      });
    } catch (err) {
      ElMessage({
        offset: 28,
        message: "複製失敗",
        type: "error",
      });
    }
  };

  watchOnce(
    () => state.approvedUrl,
    () => {
      handleUpdateVideoUrl();
    },
  );

  onMounted(async () => {
    // if (query.url) {
    //   state.approvedUrl = await getApprovedUrls([query.url as string]);
    // }

    onTranslate();

    window.winEvents.onLoad(async (arg) => {
      const params = Object.fromEntries(
        new URLSearchParams(arg.path.split("?")[1] ?? ""),
      );

      await router.replace({ query: params });

      if (params.recordNumber !== query.recordNumber) {
        window.electronAPI.onLoadWindow();
      }
    });
  });

  return {
    appStore,
    state,
    translateState,
    menuButtonState,
    summaryState,
    menuButtonRef,
    detailVideoRef,
    isEditVideo,
    onTranslate,
    onIntelligentList,
    onRemoveRecord,
    onExport,
    onJumpTime,
    handleUpdateVideoUrl,
    onCutVideo,
    copyRecordLink,
  };
};
