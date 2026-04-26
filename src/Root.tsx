import React from "react";
import { Composition } from "remotion";
import { CEOIntroduction } from "./CEOIntroduction";
import { TutorialVideo } from "./TutorialVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CEOIntroduction"
        component={CEOIntroduction}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TutorialVideo"
        component={TutorialVideo}
        durationInFrames={1920}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
