// import {
//   VideoJobInput,
//   WanVideoJob,
//   KlingVideoJob,
// } from "@/types/video";

// /**
//  * Ensures all required fields are provided based on model type.
//  */
// export function createVideoJob(input: VideoJobInput): VideoJobInput {
//   const baseFields = ["model", "prompt", "image",];

//   // 🔹 Validate shared base fields
//   for (const field of baseFields) {
//     if (!input[field as keyof VideoJobInput]) {
//       throw new Error(`Missing required base field: ${field}`);
//     }
//   }

//   // 🔹 Validate model-specific fields
//   if (input.model === "wan") {
//     const wan = input as WanVideoJob;

//     // if (
//     //   // wan.resolution === undefined ||
//     //   // wan.inferenceSteps === undefined ||
//     //   // wan.guidanceScale === undefined ||
//     //   wan.shift === undefined ||
//     //   wan.safetyMode === undefined ||
//     //   wan.promptExpansion === undefined
//     // ) {
//     //   throw new Error("Missing one or more required fields for model 'wan'");
//     // }
//   }

//   if (input.model === "kling") {
//     const kling = input as KlingVideoJob;

//     if (
//       kling.duration === undefined ||
//       kling.freedom === undefined
//     ) {
//       throw new Error("Missing one or more required fields for model 'kling'");
//     }
//   }

//   return input;
// }
