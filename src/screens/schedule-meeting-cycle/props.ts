import { CustomFrequencyTypeEnum } from "../../services/apis/meeting/types";

export const FrequencyConst = [
  {
    label: "按日重複",
    value: CustomFrequencyTypeEnum.Daily,
  },
  {
    label: "按周重複",
    value: CustomFrequencyTypeEnum.Weekly,
  },
  {
    label: "按月重複",
    value: CustomFrequencyTypeEnum.Monthly,
  },
];

export enum WeeklyOptionEnum {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}

export const WeeklyOptionConst = [
  {
    label: "周一",
    value: WeeklyOptionEnum.Monday,
  },
  {
    label: "周二",
    value: WeeklyOptionEnum.Tuesday,
  },
  {
    label: "周三",
    value: WeeklyOptionEnum.Wednesday,
  },
  {
    label: "周四",
    value: WeeklyOptionEnum.Thursday,
  },
  {
    label: "周五",
    value: WeeklyOptionEnum.Friday,
  },
  {
    label: "周六",
    value: WeeklyOptionEnum.Saturday,
  },
  {
    label: "周日",
    value: WeeklyOptionEnum.Sunday,
  },
];

export interface IScheduleMeetingCycleFormProps {
  frequency: CustomFrequencyTypeEnum;
  cycleTimes: number;
  weeklyOption: WeeklyOptionEnum[];
  monthlyOption: number[];
  endDate: string;
}
