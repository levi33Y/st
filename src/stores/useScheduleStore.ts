import { defineStore } from "pinia";
import { MeetingAppointmentRecord } from "../entity/types";
interface initMinutesList {
  formattedDate: string;
  meetingScheduleData: MeetingAppointmentRecord[];
}
export const scheduleListStore = defineStore({
  id: "scheduleList",
  state: () => ({
    scheduleList: [] as initMinutesList[],
  }),
  actions: {
    init(): void {
      this.scheduleList = [];
    },
    addItem(item: initMinutesList): void {
      this.scheduleList.push(item);
    },
    deleteItem(index: number, scheduleIndex: number): void {
      this.scheduleList[index].meetingScheduleData.splice(scheduleIndex, 1);
      this.scheduleList.forEach((item) => {
        if (item.meetingScheduleData.length === 0) {
          this.scheduleList.splice(index, 1);
        }
      });
    },
    updateItemStatus(meetingId: string, status: number): void {
      this.scheduleList?.forEach((item) => {
        item?.meetingScheduleData?.forEach((meeting) => {
          if (meeting?.meetingId === meetingId) {
            meeting.status = status;
          }
        });
      });
    },
  },
  persist: true,
});
