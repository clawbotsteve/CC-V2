import { ErrorPayload, UserGender, WorkflowType } from "./types";

interface Image {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
  width: number;
  height: number;
}

interface FaceSwap {
  image: Image;
}

export type FalFaceSwapOutput =
  | {
    status: "OK";
    error: null;
    gateway_request_id: string;
    payload: FaceSwap;
    request_id: string;
  }
  | {
    status: "ERROR";
    error: string;
    gateway_request_id: string;
    payload: ErrorPayload;
    request_id: string;
  };

export type FaceSwapInput = {
  face_image0: string;
  gender0: UserGender;
  face_image1: string;
  gender1?: UserGender;
  target_image: string;
  workflow_type: WorkflowType;
  upscale?: boolean;
  detailer?: boolean;
  referenceImage?: File[];
  enable_safety_checker?: boolean;
};

export type FaceSwapForm = FaceSwapInput;

export const defaultFaceSwapForm: FaceSwapForm = {
  face_image0: "",
  face_image1: "",
  gender0: UserGender.Male,
  gender1: UserGender.Male,
  target_image: "",
  workflow_type: WorkflowType.UserHair,
  upscale: true,
  detailer: false,
  referenceImage: [],
  enable_safety_checker: true,
};
