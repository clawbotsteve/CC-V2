"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  data: any;
  back: () => void;
  close: () => void;
}

export default function StepReviewSubmit({ data, back, close }: Props) {
  function onSubmit() {
    // Implement your API call here to submit formData
    alert("Influencer Created! (implement API call)");
    close();
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
        Review Influencer Details
      </h3>

      <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300 text-sm">
        <li>
          <span className="font-semibold">Name:</span> {data.name || "-"}
        </li>
        <li>
          <span className="font-semibold">Description:</span>{" "}
          {data.description || "-"}
        </li>
        <li>
          <span className="font-semibold">Age:</span> {data.age || "-"}
        </li>
        <li>
          <span className="font-semibold">Gender:</span> {data.gender || "-"}
        </li>
        <li>
          <span className="font-semibold">Race:</span> {data.race || "-"}
        </li>
        <li>
          <span className="font-semibold">Eye Color:</span>{" "}
          {data.eyeColor || "-"}
        </li>
        <li>
          <span className="font-semibold">Body Shape:</span>{" "}
          {data.bodyShape || "-"}
        </li>
        <li>
          <span className="font-semibold">Training Type:</span>{" "}
          {(data.trainingType?.replace("_", " ") || "-").toUpperCase()}
        </li>
        {data.trainingPhoto && (
          <li>
            <span className="font-semibold">Photo File:</span>{" "}
            {data.trainingPhoto.name}
          </li>
        )}
        {data.trainingVideo && (
          <li>
            <span className="font-semibold">Video File:</span>{" "}
            {data.trainingVideo.name}
          </li>
        )}
        <li>
          <span className="font-semibold">Personality:</span>{" "}
          {data.personality || "-"}
        </li>
        <li>
          <span className="font-semibold">Custom Prompt:</span>{" "}
          {data.customPrompt || "-"}
        </li>
        <li>
          <span className="font-semibold">Avatar Type:</span>{" "}
          {data.avatarType || "-"}
        </li>
        <li>
          <span className="font-semibold">Voice ID:</span> {data.voiceId || "-"}
        </li>
      </ul>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={back}>
          Back
        </Button>
        <Button onClick={onSubmit}>Create Influencer</Button>
      </div>
    </div>
  );
}
