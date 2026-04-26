import React from "react";
import { Composition } from "remotion";
import { CEOIntroduction } from "./CEOIntroduction";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CEOIntroduction"
      component={CEOIntroduction}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
