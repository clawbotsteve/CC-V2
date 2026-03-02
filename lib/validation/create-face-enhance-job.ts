// import { FaceEnhanceInput } from "@/types/enhance";

// /**
//  * Ensures all required fields are provided for face enhancement.
//  */
// export function createFaceEnhanceJob(input: FaceEnhanceInput): FaceEnhanceInput {
//   const requiredFields: (keyof FaceEnhanceInput)[] = [
//     "aspectRatio",
//     "guidanceScale",
//     "numInferenceStep",
//     "outputFormat",
//     "safetyLevel",
//   ];

//   for (const field of requiredFields) {
//     const value = input[field];

//     // Explicit check for null or undefined (allow false/0/empty arrays)
//     if (value === undefined || value === null) {
//       throw new Error(`Missing required field: ${field}`);
//     }

//     // Additional validation for empty arrays
//     if (
//       (field === "trainingPhoto" || field === "trainingPhotoUrls") &&
//       Array.isArray(value) &&
//       value.length === 0
//     ) {
//       throw new Error(`Field '${field}' cannot be an empty array.`);
//     }
//   }

//   return input;
// }
