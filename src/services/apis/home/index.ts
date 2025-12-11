import { TencentKeyResponse } from "@/services/apis/trtc/types";
import { ResponseResult } from "../../../entity/response";
import { Api } from "../../api/api";

export const GetRecordCount = async () =>
  (await Api.get<ResponseResult<number>>("/Meeting/record/count", {}))?.data ??
  {};

export const GetTencentKey = async () =>
  (await Api.get<ResponseResult<TencentKeyResponse>>("/Tencent/cloud/key", {}))
    ?.data ?? {};

export const UploadAvatar = async (data: FormData) =>
  (
    await Api.post<{
      url: string;
    }>("/Account/upload/photo", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  )?.data ?? {};
