
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import os from "os";

// Helper to delete folder recursively
const deleteFolderRecursive = (directoryPath: string) => {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
};

interface RenderVideoProps {
  activityId: string;
  coordinates: [number, number][]; // [lat, lng]
  activityName: string;
  stats: {
    distance: string;
    time: string;
    elevation: string;
  };
  backgroundImage?: string;
}

export async function renderRouteVideo({
  activityId,
  coordinates,
  activityName,
  stats,
  backgroundImage,
}: RenderVideoProps): Promise<{ filePath: string }> {
  
  /*
  // REMOTION RENDERER TEMPORARILY DISABLED
  // Reason: Trigger.dev serverless environment does not support headless browser execution.
  // Next Step: Configure Remotion Lambda (AWS) for production rendering.

  // 1. Bundle the Remotion project
  const entryPoint = path.join(process.cwd(), "src/remotion/index.ts");
  
  console.log("Bundling Remotion project:", entryPoint);

  const bundleLocation = await bundle({
    entryPoint,
  });

  // 2. Select the composition (must match ID in Root.tsx)
  const compositionId = "RouteVideo";
  
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
    inputProps: {
      activityId,
      coordinates,
      activityName,
      stats,
      backgroundImage
    },
  });

  // 3. Render the video to a temporary file
  const tmpDir = os.tmpdir();
  const outputLocation = path.join(tmpDir, `activity-${activityId}.mp4`);
  
  console.log("Rendering video to:", outputLocation);

  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation,
    inputProps: {
        activityId,
        coordinates,
        activityName,
        stats,
        backgroundImage
    },
  });

  return { filePath: outputLocation };
  */
 
  console.warn("Video generation is currently disabled pending Remotion Lambda setup.");
  return { filePath: "" };
}
