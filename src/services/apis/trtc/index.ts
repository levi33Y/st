import { ResponseResult } from "@/entity/response";
import { Api } from "@/services/api/api";
import {
  ICloudRecordResponseProps,
  ITencentKeyResponseProps,
  ScreenRecordingResolutionEnum,
} from "@/services/apis/trtc/types";
import { CreateCloudRecordingRequest } from "tencentcloud-sdk-nodejs-trtc/tencentcloud/services/trtc/v20190722/trtc_models";

export const GetTencentKey = async () =>
  (
    await Api.get<ResponseResult<ITencentKeyResponseProps>>(
      "/Tencent/cloud/key",
      {},
    )
  )?.data ?? {};

export const CloudRecordCreate = async (data: CreateCloudRecordingRequest) =>
  (
    await Api.post<ResponseResult<ICloudRecordResponseProps>>(
      "/Tencent/cloudRecord/create",
      data,
    )
  )?.data ?? {};

export const CloudRecordStop = async (data: {
  sdkAppId: number;
  taskId: string;
}) =>
  (
    await Api.post<ResponseResult<ICloudRecordResponseProps>>(
      "/Tencent/cloudRecord/stop",
      data,
    )
  )?.data ?? {};

export const CloudRecordUpdate = async (data: {
  sdkAppId: number;
  taskId: string;
  userId?: string;
}) =>
  (
    await Api.post<ResponseResult<ICloudRecordResponseProps>>(
      "/Tencent/cloudRecord/update",
      data,
    )
  )?.data ?? {};

export const GetCloudRecordGet = async () =>
  (
    await Api.get<ResponseResult<ScreenRecordingResolutionEnum>>(
      "/Tencent/cloud/record",
      {},
    )
  )?.data ?? {};
