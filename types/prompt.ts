import { ErrorPayload } from "./types";

interface Prompt {
  prompt: string;
}

export type FalPromptGenerationOutput =
  | {
    status: "OK";
    error: null;
    gateway_request_id: string;
    payload: Prompt;
    request_id: string;
  }
  | {
    status: "ERROR";
    error: string;
    gateway_request_id: string;
    payload: ErrorPayload;
    request_id: string;
  };


export enum StyleEnum {
  Minimalist = "Minimalist",
  Simple = "Simple",
  Detailed = "Detailed",
  Descriptive = "Descriptive",
  Dynamic = "Dynamic",
  Cinematic = "Cinematic",
  Documentary = "Documentary",
  Animation = "Animation",
  Action = "Action",
  Experimental = "Experimental",
}

export enum CameraStyleEnum {
  None = "None",
  SteadicamFlow = "Steadicam flow",
  DroneAerials = "Drone aerials",
  HandheldUrgency = "Handheld urgency",
  CraneElegance = "Crane elegance",
  DollyPrecision = "Dolly precision",
  VR360 = "VR 360",
  MultiAngleRig = "Multi-angle rig",
  StaticTripod = "Static tripod",
  GimbalSmoothness = "Gimbal smoothness",
  SliderMotion = "Slider motion",
  JibSweep = "Jib sweep",
  POVImmersion = "POV immersion",
  TimeSliceArray = "Time-slice array",
  MacroExtreme = "Macro extreme",
  TiltShiftMiniature = "Tilt-shift miniature",
  SnorricamCharacter = "Snorricam character",
  WhipPanDynamics = "Whip pan dynamics",
  DutchAngleTension = "Dutch angle tension",
  UnderwaterHousing = "Underwater housing",
  PeriscopeLens = "Periscope lens",
}

export enum CameraDirectionEnum {
  None = "None",
  ZoomIn = "Zoom in",
  ZoomOut = "Zoom out",
  PanLeft = "Pan left",
  PanRight = "Pan right",
  TiltUp = "Tilt up",
  TiltDown = "Tilt down",
  OrbitalRotation = "Orbital rotation",
  PushIn = "Push in",
  PullOut = "Pull out",
  TrackForward = "Track forward",
  TrackBackward = "Track backward",
  SpiralIn = "Spiral in",
  SpiralOut = "Spiral out",
  ArcMovement = "Arc movement",
  DiagonalTraverse = "Diagonal traverse",
  VerticalRise = "Vertical rise",
  VerticalDescent = "Vertical descent",
}

export enum PacingEnum {
  None = "None",
  SlowBurn = "Slow burn",
  RhythmicPulse = "Rhythmic pulse",
  FranticEnergy = "Frantic energy",
  EbbAndFlow = "Ebb and flow",
  HypnoticDrift = "Hypnotic drift",
  TimeLapseRush = "Time-lapse rush",
  StopMotionStaccato = "Stop-motion staccato",
  GradualBuild = "Gradual build",
  QuickCutRhythm = "Quick cut rhythm",
  LongTakeMeditation = "Long take meditation",
  JumpCutEnergy = "Jump cut energy",
  MatchCutFlow = "Match cut flow",
  CrossDissolveDreamscape = "Cross-dissolve dreamscape",
  ParallelAction = "Parallel action",
  SlowMotionImpact = "Slow motion impact",
  RampingDynamics = "Ramping dynamics",
  MontageTempo = "Montage tempo",
  ContinuousFlow = "Continuous flow",
  EpisodicBreaks = "Episodic breaks",
}

export enum SpecialEffectsEnum {
  None = "None",
  PracticalEffects = "Practical effects",
  CGIEnhancement = "CGI enhancement",
  AnalogGlitches = "Analog glitches",
  LightPainting = "Light painting",
  ProjectionMapping = "Projection mapping",
  NanosecondExposures = "Nanosecond exposures",
  DoubleExposure = "Double exposure",
  SmokeDiffusion = "Smoke diffusion",
  LensFlareArtistry = "Lens flare artistry",
  ParticleSystems = "Particle systems",
  HolographicOverlay = "Holographic overlay",
  ChromaticAberration = "Chromatic aberration",
  DigitalDistortion = "Digital distortion",
  WireRemoval = "Wire removal",
  MotionCapture = "Motion capture",
  MiniatureIntegration = "Miniature integration",
  WeatherSimulation = "Weather simulation",
  ColorGrading = "Color grading",
  MixedMediaComposite = "Mixed media composite",
  NeuralStyleTransfer = "Neural style transfer",
}

export enum ModelEnum {
  AnthropicClaude35Sonnet = "anthropic/claude-3.5-sonnet",
  AnthropicClaude35Haiku = "anthropic/claude-3-5-haiku",
  AnthropicClaude3Haiku = "anthropic/claude-3-haiku",
  GoogleGeminiPro15 = "google/gemini-pro-1.5",
  GoogleGeminiFlash15 = "google/gemini-flash-1.5",
  GoogleGeminiFlash158b = "google/gemini-flash-1.5-8b",
  MetaLlama32_1bInstruct = "meta-llama/llama-3.2-1b-instruct",
  MetaLlama32_3bInstruct = "meta-llama/llama-3.2-3b-instruct",
  MetaLlama31_8bInstruct = "meta-llama/llama-3.1-8b-instruct",
  MetaLlama31_70bInstruct = "meta-llama/llama-3.1-70b-instruct",
  OpenAIGpt4oMini = "openai/gpt-4o-mini",
  OpenAIGpt4o = "openai/gpt-4o",
  DeepseekR1 = "deepseek/deepseek-r1",
}

export enum PromptLengthEnum {
  Short = "Short",
  Medium = "Medium",
  Long = "Long",
}

export interface PromptGenerationInput {
  input_concept: string;
  style?: StyleEnum;
  camera_style?: CameraStyleEnum;
  camera_direction?: CameraDirectionEnum;
  pacing?: PacingEnum;
  special_effects?: SpecialEffectsEnum;
  custom_elements?: string;
  image_url: string;
  model?: ModelEnum;
  prompt_length?: PromptLengthEnum;
  referenceImage?: File;
  enable_safety_checker?: boolean;
}

export type PromptGenerationForm = PromptGenerationInput;

export const defaultPromptGenerationForm: PromptGenerationInput = {
  input_concept: "",
  style: StyleEnum.Simple,
  camera_style: CameraStyleEnum.None,
  camera_direction: CameraDirectionEnum.None,
  pacing: PacingEnum.None,
  special_effects: SpecialEffectsEnum.None,
  custom_elements: "",
  image_url: "",
  model: ModelEnum.GoogleGeminiFlash158b,
  prompt_length: PromptLengthEnum.Medium,
  referenceImage: undefined,
  enable_safety_checker: false,
};
