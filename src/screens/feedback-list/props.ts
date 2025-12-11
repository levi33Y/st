import { FeedbackTypeEnum } from "../../services/apis/feedback/types";

export interface IFeedbackStateProps {
  pageSize: number;
  page: number;
  keyWord: string;
  loading: boolean;
  isMarketPlayer?: boolean;
}

export interface ITableDataProps {
  id: string;
  userName: string;
  describe: string;
  updateTime: string;
  types?: FeedbackTypeEnum[];
}

export interface IFeedbackListState {
  count: number;
  dataList: ITableDataProps[];
}

export interface IFeedbackDetailDialogState extends ITableDataProps {
  visible: boolean;
}
