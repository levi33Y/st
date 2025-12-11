import { ResponseResult } from "../../../entity/response";
import { Api } from "../../api/api";
import {
  AddFeedbackInfoRequest,
  GetFeedbackListRequest,
  GetFeedbackListResponse,
} from "./types";

export const GetFeedbackList = async (params: GetFeedbackListRequest) =>
  (
    await Api.get<ResponseResult<GetFeedbackListResponse>>(
      "/Meeting/feedback",
      { params },
    )
  )?.data ?? {};

export const AddFeedbackInfo = async (data: AddFeedbackInfoRequest) =>
  (await Api.post<ResponseResult<string>>("/Meeting/feedback/add", data))
    ?.data ?? {};

export const GetFeedbackTodo = async () =>
  (await Api.get<ResponseResult<number>>("/Meeting/feedback/count/get"))
    ?.data ?? {};

export const UpdateFeedbackTodo = async () =>
  (await Api.post<ResponseResult<string>>("/Meeting/feedback/update", {}))
    ?.data ?? {};
