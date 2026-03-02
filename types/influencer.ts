export enum InfluencerModel {
  FLUX_1 = "flux-1",
  FLUX_2 = "flux-2",
}

export type ContentType = "sfw" | "nsfw";

export type InfluencerBasicInfo = {
  name: string;
  description: string;
  gender: "male" | "female";
  mode: "character" | "style";
  model: InfluencerModel;
  trigger: string;
  step: 1000 | 2000 | 4000 | 6000 | 8000 | 10000;
  learningRate?: number;
  defaultCaption?: string;
  plan?: string;
  isPublic: boolean;
  contentType: ContentType;
};

export type InfluencerJobRest = {
  avatarImageurl: string;
  trainingPhoto: File[];
  trainingFileUrl: string;
};

export type InfluencerJobInput = InfluencerBasicInfo & InfluencerJobRest;

export const defaultInfluencerForm: InfluencerJobInput = {
  name: "",
  description: "",
  gender: "female",
  mode: "character",
  model: InfluencerModel.FLUX_1,
  trigger: "",
  step: 1000,
  learningRate: 0.00005,
  defaultCaption: "",
  avatarImageurl: "",
  trainingFileUrl: "",
  trainingPhoto: [],
  isPublic: false,
  contentType: "sfw",
};
