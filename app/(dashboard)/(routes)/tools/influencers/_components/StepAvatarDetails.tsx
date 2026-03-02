"use client";

import React from "react";

interface Props {
  data: {
    personality: string;
    customPrompt: string;
    avatarType: "photo" | "studio";
    voiceId: string;
  };
  update: (data: Partial<Props["data"]>) => void;
}

const avatarTypes = ["photo", "studio"];
const voices = [
  { id: "en_us_001", label: "US English - Female" },
  { id: "en_us_002", label: "US English - Male" },
  // Add more voice options here
];

export default function StepAvatarDetails({ data, update }: Props) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Personality Summary</span>
        <textarea
          value={data.personality}
          onChange={e => update({ personality: e.target.value })}
          className="textarea textarea-bordered w-full"
          placeholder="Cheerful, tech-savvy mentor"
          rows={3}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Custom Prompt (for AI training)</span>
        <textarea
          value={data.customPrompt}
          onChange={e => update({ customPrompt: e.target.value })}
          className="textarea textarea-bordered w-full"
          placeholder="A calm, confident South Asian female influencer"
          rows={3}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Avatar Type</span>
        <select
          value={data.avatarType}
          onChange={e => update({ avatarType: e.target.value as "photo" | "studio" })}
          className="select select-bordered w-full"
        >
          {avatarTypes.map(type => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Preferred Voice</span>
        <select
          value={data.voiceId}
          onChange={e => update({ voiceId: e.target.value })}
          className="select select-bordered w-full"
        >
          <option value="">Select Voice</option>
          {voices.map(v => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
