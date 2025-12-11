import { SpeechStatus } from "../../../entity/enum";
import { ResponseResult, UserSession } from "../../../entity/response";
import {
  MeetingAppointmentData,
  MeetingHistoryList,
  MeetingSpeech,
} from "../../../entity/types";
import { Api } from "../../api/api";
import {
  AudioChangeRequest,
  AudioChangeResponse,
  CreateMeetingRequest,
  CreateMeetingResponse,
  EditMeetingResponse,
  EndMeetingRequest,
  GetAllInfoResponse,
  GetMeetingInfoRequest,
  GetMeetingInfoResponse,
  IInviteCreateRequestProps,
  IInviteCreateResponseProps,
  IInviteRecordsResponseProps,
  IInviteUpdateRequestProps,
  IInviteUsersResponseProps,
  IMeetingLockRequestProps,
  IMeetingLockResponseProps,
  IRecordCutRequestProps,
  IRecordCutResponseProps,
  ISpeakRecordRequestProps,
  IStaffsRequestProps,
  IUpdateMeetingTypeRequest,
  InviteMessage,
  IsMeetingMaster,
  JoinMeetingRequest,
  JoinMeetingResponse,
  MeetingLanguageEnum,
  OutMeetingRequest,
  RecordDetailResponse,
  RecordListRequest,
  RecordListResponse,
  RecordSpeakRequest,
  SaveAudioRequest,
  SaveToneRequest,
  ScreenShareRequest,
  ScreenShareResponse,
  StopRecordingRequest,
  Summary,
  SummaryRequest,
  UpdateRoleRequest,
  startRecordingResponse,
} from "./types";

/**
 * 加入会议
 * @param data JoinMeetingRequest
 * @returns ResponseResult<JoinMeetingResponse>
 */
export const joinMeetingApi = async (data: JoinMeetingRequest) =>
  (await Api.post<ResponseResult<JoinMeetingResponse>>("/Meeting/join", data))
    ?.data ?? {};

/**
 * 创建会议
 * @param data CreateMeetingRequest
 * @returns ResponseResult<CreateMeetingResponse>
 */
export const createMeetingApi = async (data: CreateMeetingRequest) =>
  (
    await Api.post<ResponseResult<CreateMeetingResponse>>(
      "/Meeting/schedule",
      data,
    )
  )?.data ?? {};

/**
 * 获取会议信息
 * @param params GetMeetingInfoRequest
 * @returns ResponseResult<GetMeetingInfoResponse>
 */
export const getMeetingInfoApi = async (params: GetMeetingInfoRequest) =>
  (
    await Api.get<ResponseResult<GetMeetingInfoResponse>>("/Meeting/get", {
      params,
    })
  )?.data ?? {};

/**
 * 退出会议
 * @param data OutMeetingRequest
 * @returns
 */
export const outMeetingApi = async (data: OutMeetingRequest) =>
  (await Api.post("/Meeting/out", data))?.data ?? {};

/**
 * 结束会议
 * @param data EndMeetingRequest
 * @returns
 */
export const endMeetingApi = async (data: EndMeetingRequest) =>
  (await Api.post("/Meeting/end", data))?.data ?? {};

/**
 * 开关麦克风
 * @param data
 * @returns ResponseResult<AudioChangeResponse>
 */
export const audioChangeApi = async (data: AudioChangeRequest) =>
  (
    await Api.post<ResponseResult<AudioChangeResponse>>(
      "/Meeting/audio/change",
      data,
    )
  )?.data ?? {};

/**
 * 分享屏幕
 * @param data ScreenShareRequest
 * @returns ResponseResult<ScreenShareResponse>
 */
export const screenShareApi = async (data: ScreenShareRequest) =>
  (
    await Api.post<ResponseResult<ScreenShareResponse>>(
      "/Meeting/screen/share",
      data,
    )
  )?.data ?? {};

/**
 * 获取用户信息
 * @param userId
 * @returns ResponseResult<UserSession>
 */
export const getUserSession = async (userId: number) =>
  (
    await Api.get<ResponseResult<UserSession>>(
      `/Meeting/get/userSession/${userId}`,
    )
  )?.data ?? {};

/**
 * 保存克隆音色设置
 * @param data SaveToneRequest
 * @returns
 */
export const saveToneSettingApi = async (data: SaveToneRequest) =>
  (
    await Api.post<ResponseResult<string>>(
      "/MeetingUser/setting/chatRoom/addOrUpdate",
      data,
    )
  )?.data ?? {};

/**
 * 保存音频
 * @param data SaveAudioRequest
 * @returns
 */
export const saveAudio = async (data: SaveAudioRequest) =>
  (await Api.post<ResponseResult<string>>("/MeetingSpeech/save/audio", data))
    ?.data ?? {};

/**
 * 获取当前会议的所有音频转义记录
 * @param meetingId
 * @param filterHasCanceledAudio 控制是否显示已撤回的消息，不传是false
 * @returns
 */
export const getMeetingSpeechList = async (
  meetingId: string,
  filterHasCanceledAudio: boolean = false,
) =>
  (
    await Api.get<ResponseResult<MeetingSpeech[]>>("/MeetingSpeech/speech", {
      params: {
        meetingId,
        filterHasCanceledAudio,
      },
    })
  )?.data ?? {};

// /**
//  * 获取当前用户的userSetting的配置
//  * @returns
//  */
// export const getMeetingUserSettings = async () =>
//   (await Api.get<ResponseResult<MeetingSettings>>("/MeetingUser/setting"))
//     ?.data ?? {};

// /**
//  * 增加和更新userSetting
//  */
// export const updateMeetingUserSettings = async (
//   data: UpdateMeetingUserSettingsRequest
// ) =>
//   (
//     await Api.post<ResponseResult<undefined>>(
//       "/MeetingUser/setting/addOrUpdate",
//       data
//     )
//   )?.data ?? {};

/**
 * 更新语音状态
 * @param meetingSpeechId
 * @param status
 * @returns
 */
export const updateMeetingSpeech = async (
  meetingSpeechId: string,
  status: SpeechStatus,
) =>
  (await Api.post("/MeetingSpeech/update", { meetingSpeechId, status }))
    ?.data ?? {};

/**
 * 获取获取预定会议列表
 * @returns
 */
export const getAppointmentMeetingList = async (
  Page: number,
  PageSize: number,
  UserCurrentTime: String,
) =>
  (
    await Api.get<ResponseResult<MeetingAppointmentData>>(
      "/Meeting/appointment",
      {
        params: {
          Page,
          PageSize,
          UserCurrentTime,
        },
      },
    )
  )?.data ?? {};

/**
 * 取消預定會議
 * @param meetingId
 */
export const cancelAppointmentMeeting = async (meetingId: string) =>
  (await Api.post("/Meeting/appointment/cancel", { meetingId }))?.data ?? {};

/**
 * 获取获取历史会议列表
 * @returns
 */
export const getHistoryMeetingList = async (
  keyword?: string,
  Page?: number,
  PageSize?: number,
) =>
  (
    await Api.get<MeetingHistoryList>("/Meeting/history", {
      params: {
        keyword: keyword,
        "PageSetting.Page": Page,
        "PageSetting.PageSize": PageSize,
      },
    })
  )?.data ?? {};

/**
 * 删除会议记录
 * @param meetingSpeechId
 */
export const deleteMeetingRecord = async (meetingRecordIds: string[]) =>
  (await Api.post("/Meeting/record/delete", { meetingRecordIds }))?.data ?? {};

/**
 * 删除会议历史记录
 * @param meetingHistoryIds
 */
export const deleteMeetingHistory = async (meetingHistoryIds: string[]) =>
  (await Api.post("/Meeting/history/delete", { meetingHistoryIds }))?.data ??
  {};

/**
 * 修改会议
 * @param data EditMeetingResponse
 */
export const editMeetingApi = async (data: EditMeetingResponse) =>
  (await Api.post("/Meeting/update", data))?.data ?? {};

/**
 * 开启会议录制
 * @param meetingId
 * @returns ResponseResult<startRecordingResponse>
 */
export const startRecordingApi = async (meetingId: string) =>
  (
    await Api.post<startRecordingResponse>("/Meeting/recording/start", {
      meetingId,
    })
  )?.data ?? {};

/**
 * 结束会议录制
 * @param data StopRecordingRequest
 * @returns ResponseResult
 */
export const StopRecordingApi = async (data: StopRecordingRequest) =>
  (await Api.post<ResponseResult<undefined>>("/Meeting/recording/stop", data))
    ?.data ?? {};

export const getRecordingEgressApi = async (RecordId: string) =>
  (
    await Api.get<{
      code: number;
      msg: string;
      data?: string;
    }>("/Meeting/record/egress", {
      params: {
        RecordId: RecordId,
      },
    })
  )?.data ?? {};

/**
 * 记录会议说话人
 * @param data RecordSpeakRequest
 * @returns ResponseResult<RecordSpeakResponse>
 */
export const recordSpeakApi = async (data: RecordSpeakRequest) =>
  (await Api.post("/Meeting/record/speak", data))?.data ?? {};

/**
 * 记录会议说话人/参会人发言状态
 * @param data RecordSpeakRequest
 * @returns ResponseResult<RecordSpeakResponse>
 */
export const speakRecordApi = async (data: ISpeakRecordRequestProps) =>
  (await Api.post("/Meeting/speak/record", data))?.data ?? {};

/**
 * 获取录制转录列表
 * @returns
 */
export const getRecordListApi = async (params: RecordListRequest) =>
  (
    await Api.get<RecordListResponse>("/Meeting/record", {
      params,
    })
  )?.data ?? {};

/**
 * 获取录制详情
 * @param id
 * @param language
 */
export const getRecordDetailApi = async (id: string, language?: number) =>
  (
    await Api.get<ResponseResult<RecordDetailResponse>>(
      "/Meeting/record/detail",
      { params: { id, language } },
    )
  )?.data ?? {};

/**
 * 确认用户会议权限
 * @param meetingSpeechId
 * @param status
 * @returns
 */
export const verifyMasterApi = async (meetingId: string, userId: number) =>
  (
    await Api.post<ResponseResult<IsMeetingMaster>>(
      "/MeetingUser/session/master/verify",
      { meetingId, userId },
    )
  )?.data ?? {};

/**
 * 确认用户会议权限
 * @param meetingId
 * @param kickOutUserId
 * @returns
 */
export const kickOutUserApi = async (
  meetingId: string,
  kickOutUserId: number,
) =>
  (
    await Api.post<ResponseResult<undefined>>(
      "/MeetingUser/session/master/kickout",
      {
        meetingId,
        kickOutUserId,
      },
    )
  )?.data ?? {};

/**
 * 获取邀請详情
 * @param MeetingId
 */
export const getInviteApi = async (MeetingId: string) =>
  (
    await Api.get<ResponseResult<InviteMessage>>("/Meeting/invite/info", {
      params: { MeetingId },
    })
  )?.data ?? {};

/**
 * 会议总结
 * @param data SummaryRequest
 * @returns ResponseResult<SummaryResponse>
 */
export const meetingSummaryApi = async (data: SummaryRequest) =>
  (await Api.post<ResponseResult<Summary>>("/Meeting/summary", data))?.data ??
  {};

/**
 * 翻译接口
 * @param meetingRecordId
 * @param language
 * @returns ResponseResult<SummaryResponse>
 */
export const translationSummaryApi = async (
  meetingRecordId: string,
  language: MeetingLanguageEnum | undefined,
) =>
  (
    await Api.post<ResponseResult<RecordDetailResponse>>(
      "/Meeting/recording/translation",
      { meetingRecordId, language },
    )
  )?.data ?? {};

/**
 *EA功能开关设置
 * @param data MeetingSettingRequest
 * @returns ResponseResult<MeetingSettingResponse>
 */
export const updateSwitchEaAPI = async (id: string, isActiveEa: boolean) =>
  (
    await Api.post<ResponseResult<undefined>>("/Meeting/switch/ea", {
      id,
      isActiveEa,
    })
  )?.data ?? {};

/**
 *视频url权限获取
 * @param urls
 * @returns urls
 */
export const updateRecordingUrlApi = async (urls: string[]) =>
  (
    await Api.post<{ urls: string[] }>("/Meeting/recording/url", {
      urls,
    })
  )?.data ?? {};

export const getLongestStayingParticipant = async (meetingId: string) =>
  (
    await Api.get<
      ResponseResult<{
        userId: number;
        userName: string;
      }>
    >(`/Meeting/get/user?meetingId=${meetingId}`)
  )?.data ?? {};

export const GetStaffs = async () =>
  (await Api.get<ResponseResult<IStaffsRequestProps>>(`/Meeting/Get/staffs`))
    ?.data ?? {};

// 更改用户会议角色
export const updateMeetingRole = async (data: UpdateRoleRequest) =>
  (await Api.post<ResponseResult<undefined>>("/Meeting/update/role", data))
    ?.data ?? {};

// 获取会中所有用户的会话信息
export const getAllUserInfo = async (data: {
  meetingId: string;
  meetingSubId?: string;
}) =>
  (
    await Api.get<ResponseResult<GetAllInfoResponse>>("/Meeting/get/all", {
      params: { ...data },
    })
  )?.data ?? {};

// meeting lock
export const updateMeetingLock = async (data: IMeetingLockRequestProps) =>
  (
    await Api.post<ResponseResult<IMeetingLockResponseProps>>(
      "/Meeting/lock",
      data,
    )
  )?.data ?? {};

export const updateMeetingType = async (data: IUpdateMeetingTypeRequest) =>
  (await Api.post<ResponseResult<null>>("/Meeting/update/type", data))?.data ??
  {};

// 获取邀请名单
export const getInviteUsers = async (meetingId: string, meetingSubId: string) =>
  (
    await Api.get<ResponseResult<IInviteUsersResponseProps>>(
      `/Meeting/invite/users`,
      {
        params: {
          meetingId,
          meetingSubId,
        },
      },
    )
  )?.data ?? {};

// 添加邀请人
export const inviteCreate = async (data: IInviteCreateRequestProps) =>
  (
    await Api.post<ResponseResult<IInviteCreateResponseProps>>(
      "/Meeting/invite/create",
      data,
    )
  )?.data ?? {};

// 应答邀请
export const inviteUpdate = async (data: IInviteUpdateRequestProps) =>
  (
    await Api.post<ResponseResult<IInviteUpdateRequestProps>>(
      "/Meeting/invite/update",
      data,
    )
  )?.data ?? {};

// 获取邀请记录
export const getInviteRecords = async () =>
  (
    await Api.get<ResponseResult<IInviteRecordsResponseProps>>(
      "/Meeting/invite/records",
    )
  )?.data ?? {};

// 剪辑视频
export const recordCut = async (data: IRecordCutRequestProps) =>
  (
    await Api.post<ResponseResult<IRecordCutResponseProps>>(
      "/Meeting/record/cut",
      data,
    )
  )?.data ?? {};
