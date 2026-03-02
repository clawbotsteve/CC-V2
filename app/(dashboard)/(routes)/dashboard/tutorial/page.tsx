"use client";

import PageContainer from "@/components/page-container";
import { Player } from "@/components/vidstack/player";
import React from "react";

export default function VideoPage() {
  // Replace this with your actual AWS S3 video URL (must be public or signed)
  return (
    <PageContainer>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-foreground mb-4">Watch Tutorial</h1>
        <div className="aspect-video w-full sm:max-w-md md:max-w-xl lg:max-w-3xl">
          <Player
            src="youtube/d7RITdy17RU"
            poster="/assets/poster.png"
            title="CoreGen Tutorial"
          />
        </div>
      </div>
    </PageContainer>
  );
};
