import { FeedbackTypeEnum } from "../../../../services/apis/feedback/types";

export interface IAboutUsStateProps {
  feedbackDialogVisible: boolean;
  listBadge: number;
  isMarketPlayer?: boolean;
  skeletonLoading?: boolean;
}

export interface IFeedbackProps {
  types: FeedbackTypeEnum[];
  content: string;
  submitLoading?: boolean;
}
