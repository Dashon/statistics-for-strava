
import React from 'react';
import { Composition } from 'remotion';
import { RouteVideo, RouteVideoProps } from './RouteVideo';
import "./style.css";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition<RouteVideoProps, Record<string, unknown>>
                id="RouteVideo"
                component={RouteVideo as any}
                durationInFrames={300} // 10 seconds at 30fps
                fps={30}
                width={720}
                height={1280} // Vertical video for stories/reels
                defaultProps={{
                    activityId: "example",
                    coordinates: [],
                    activityName: "Activity Name",
                    stats: {
                        distance: "0 km",
                        time: "0:00",
                        elevation: "0 m"
                    }
                }}
            />
        </>
    );
};
