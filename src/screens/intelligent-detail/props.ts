import {
  MeetingLanguageEnum,
  MeetingRecordDetail,
  RecordDetailResponse,
} from "../../services/apis/meeting/types";

export enum SegmentedEnum {
  Recording = "轉寫",
  Summary = "紀要",
}

export enum ExportTypeEnum {
  Video,
  TranslateWord,
  TranSlatePdf,
  SummaryWord,
  SummaryPdf,
}

export interface IIntelligentDetailStateProps {
  recordNumber: string;
  title: string;
  meetingNumber: string;
  startDate: string;
  endDate: string;
  meetingRecordId: string;
  meetingId: string;
  videoUrl: string;
  language?: number;
  exportType: number;
  segmented: string;
  approvedUrl: string;
}

export interface IMeetingRecordDetailsProps extends MeetingRecordDetail {
  timePoint: string;
}

export interface ITranslateStateRecordDetailProps extends RecordDetailResponse {
  meetingRecordDetails: IMeetingRecordDetailsProps[];
}

export interface ITranslateStateProps {
  options: { label: string; value?: number }[];
  recordDetail: ITranslateStateRecordDetailProps | null;
  loading: boolean;
  timeoutId: NodeJS.Timeout | null;
}

export interface IMenuButtonDataProps {
  label: string;
  value?: ExportTypeEnum;
  children?: IMenuButtonDataProps[];
}

export interface IMenuButtonProps {
  visible: boolean;
  data: IMenuButtonDataProps[];
}

export interface ISummaryTextAbstractProps {
  abstractTitle: string;
  abstractContent: string;
}

export interface ISummaryTextProps {
  abstract: ISummaryTextAbstractProps[];
  meetingTodoItems: string[];
}

export interface ISummaryStateProps {
  summaryText?: ISummaryTextProps;
  targetLanguage?: MeetingLanguageEnum;
}
