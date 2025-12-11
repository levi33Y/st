export enum FeedbackTypeEnum {
  Suggestions,
  Defect,
  Information,
  Other,
}

export const FeedbackTypeConst = {
  [FeedbackTypeEnum.Suggestions]: "功能建議",
  [FeedbackTypeEnum.Defect]: "功能缺陷",
  [FeedbackTypeEnum.Information]: "功能咨詢",
  [FeedbackTypeEnum.Other]: "其他",
};

export interface AddFeedbackInfoRequest {
  feedback: {
    categories: FeedbackTypeEnum[];
    description?: string;
  };
}

export interface GetFeedbackListRequest {
  KeyWord: string;
  PageIndex: number;
  PageSize: number;
}

export interface GetFeedbackListItem {
  feedbackId: number;
  creator: string;
  categories: FeedbackTypeEnum[];
  description: string;
  lastModifiedDate: string;
}

export interface GetFeedbackListResponse {
  feedbackDto: GetFeedbackListItem[];
  count: number;
}
