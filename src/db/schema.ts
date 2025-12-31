
import {
  pgTable,
  varchar,
  timestamp,
  text,
  integer,
  date,
  json,
  index,
  boolean,
  doublePrecision,
  customType,
  unique,
} from "drizzle-orm/pg-core";

// Custom type to handle JSON stored as TEXT in the legacy database
const jsonText = <TData>(name: string) =>
  customType<{ data: TData; driverData: string }>({
    dataType() {
      return "text";
    },
    fromDriver(value: unknown): TData {
      try {
        if (typeof value === "string") {
            return JSON.parse(value);
        }
        return value as TData;
      } catch (e) {
          console.error("Failed to parse JSON text:", value);
          return {} as TData;
      }
    },
    toDriver(value: TData): string {
      return JSON.stringify(value);
    },
  })(name);

// Activity Table
export const activity = pgTable("activity", {
  activityId: varchar("activityid", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }), // SECURITY: Filter activities by user
  provider: varchar("provider", { length: 50 }).default("strava"), // strava, garmin, oura, whoop, fitbit, apple_health, google_fit
  externalId: varchar("external_id", { length: 255 }), // ID from the source platform
  startDateTime: timestamp("startdatetime", { mode: "string" }).notNull(),
  data: jsonText<any>("data").notNull(),
  location: jsonText<any>("location"),
  weather: jsonText<any>("weather"),
  gearId: varchar("gearid", { length: 255 }),
  sportType: varchar("sporttype", { length: 255 }),
  deviceName: varchar("devicename", { length: 255 }),
  name: varchar("name", { length: 255 }),
  description: varchar("description", { length: 255 }),
  distance: doublePrecision("distance"),
  elevation: doublePrecision("elevation"),
  averageSpeed: doublePrecision("averagespeed"),
  maxSpeed: doublePrecision("maxspeed"),
  startingLatitude: doublePrecision("startingcoordinatelatitude"),
  startingLongitude: doublePrecision("startingcoordinatelongitude"),
  calories: integer("calories"),
  averagePower: integer("averagepower"),
  maxPower: integer("maxpower"),
  averageHeartRate: integer("averageheartrate"),
  maxHeartRate: integer("maxheartrate"),
  averageCadence: integer("averagecadence"),
  movingTimeInSeconds: integer("movingtimeinseconds"),
  kudoCount: integer("kudocount"),
  totalImageCount: integer("totalimagecount"),
  isCommute: boolean("iscommute"),
  markedForDeletion: boolean("markedfordeletion"),
  streamsAreImported: boolean("streamsareimported"),
  polyline: text("polyline"),
  routeGeography: text("routegeography"),
  localImagePaths: text("localimagepaths"),
  workoutType: varchar("workouttype", { length: 255 }),
  aiThumbnailUrl: text("ai_thumbnail_url"),
  aiThumbnailPrompt: text("ai_thumbnail_prompt"),
  aiThumbnailGeneratedAt: timestamp("ai_thumbnail_generated_at", { mode: "string" }),
  aiVideoUrl: text("ai_video_url"), // Remotion generated video URL
  
  // New expansion fields
  kilojoules: doublePrecision("kilojoules"),
  weightedAveragePower: integer("weighted_average_power"),
  elevHigh: doublePrecision("elev_high"),
  elevLow: doublePrecision("elev_low"),
  averageTemp: integer("average_temp"),
  sufferScore: integer("suffer_score"),
  
  // Race fields
  isRace: boolean("is_race").default(false),
  raceName: varchar("race_name", { length: 255 }),
  raceDistanceClass: varchar("race_distance_class", { length: 50 }),
  officialTime: integer("official_time"), // chip time in seconds
  placement: integer("placement"),
  ageGroupPlacement: integer("age_group_placement"),
  genderPlacement: integer("gender_placement"),
  isPr: boolean("is_pr").default(false),
  raceNotes: text("race_notes"),
  linkedRaceId: varchar("linked_race_id", { length: 255 }),
  raceDetected: boolean("race_detected").default(false),
  raceDetectionConfidence: doublePrecision("race_detection_confidence"),
}, (table) => {
    return {
        sportTypeIdx: index("activity_sporttype").on(table.sportType),
        userIdIdx: index("activity_user_id").on(table.userId), // Index for filtering by user
        userIdStartDateIdx: index("activity_user_id_start_date").on(table.userId, table.startDateTime), // Composite index for range queries
        userIdSportTypeStartDateIdx: index("activity_user_id_sport_type_start_date").on(table.userId, table.sportType, table.startDateTime), // Optimized for Run Letters page
    }
});

export const runLetters = pgTable("run_letters", {
    activityId: varchar("activity_id", { length: 255 }).primaryKey(),
    letterText: text("letter_text").notNull(),
    editedText: text("edited_text"),
    generatedAt: integer("generated_at").notNull(),
    editedAt: integer("edited_at"),
    shareToken: varchar("share_token", { length: 255 }),
    isPublic: boolean("is_public"),
});

export const gear = pgTable("gear", {
  gearId: varchar("gearid", { length: 255 }).primaryKey(),
  createdOn: timestamp("createdon", { mode: "string" }).notNull(),
  distanceInMeter: integer("distanceinmeter").notNull(),
  data: jsonText<any>("data").notNull(),
  name: varchar("name", { length: 255 }),
  isRetired: boolean("isretired"),
  type: varchar("type", { length: 255 }),
});

export const segment = pgTable("segment", {
  segmentId: varchar("segmentid", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  sportType: varchar("sporttype", { length: 255 }),
  distance: doublePrecision("distance"),
  maxGradient: doublePrecision("maxgradient"),
  isFavourite: boolean("isfavourite"),
  countryCode: varchar("countrycode", { length: 255 }),
  data: jsonText<any>("data").notNull(),
  detailsHaveBeenImported: boolean("detailshavebeenimported"),
  polyline: text("polyline"),
  startingLatitude: doublePrecision("startingcoordinatelatitude"),
  startingLongitude: doublePrecision("startingcoordinatelongitude"),
});

export const segmentEffort = pgTable("segmenteffort", {
  segmentEffortId: varchar("segmenteffortid", { length: 255 }).primaryKey(),
  segmentId: varchar("segmentid", { length: 255 }).notNull(),
  activityId: varchar("activityid", { length: 255 }).notNull(),
  startDateTime: timestamp("startdatetime", { mode: "string" }).notNull(),
  data: jsonText<any>("data").notNull(),
  name: varchar("name", { length: 255 }),
  elapsedTimeInSeconds: doublePrecision("elapsedtimeinseconds"),
  distance: integer("distance"),
  averageWatts: doublePrecision("averagewatts"),
});

export const challenge = pgTable("challenge", {
  challengeId: varchar("challengeid", { length: 255 }).primaryKey(),
  createdOn: timestamp("createdon", { mode: "string" }).notNull(),
  data: jsonText<any>("data").notNull(),
  name: varchar("name", { length: 255 }),
  logoUrl: varchar("logourl", { length: 255 }),
  slug: varchar("slug", { length: 255 }),
});

export const user = pgTable("User", {
    userId: varchar("userid", { length: 255 }).primaryKey(),
    stravaAthleteId: integer("stravaathleteid").notNull(),
    stravaAccessToken: varchar("stravaaccesstoken", { length: 255 }).notNull(),
    stravaRefreshToken: varchar("stravarefreshtoken", { length: 255 }).notNull(),
    stravaTokenExpiresAt: timestamp("stravatokenexpiresat", { mode: "string" }).notNull(),
    apiKey: varchar("api_key", { length: 64 }), // For generic ingestion webhook auth
    createdAt: timestamp("createdat", { mode: "string" }).notNull(),
    updatedAt: timestamp("updatedat", { mode: "string" }).notNull(),
    roles: json("roles").notNull(),
});

// Provider Connections - OAuth tokens for multiple fitness platforms
export const providerConnection = pgTable("provider_connection", {
    id: varchar("id", { length: 255 }).primaryKey(), // UUID
    userId: varchar("user_id", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(), // garmin, oura, whoop, fitbit, coros, polar
    isPrimary: boolean("is_primary").default(false), // The provider they logged in with
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", { mode: "string" }),
    externalUserId: varchar("external_user_id", { length: 255 }), // User's ID on the platform
    scopes: text("scopes"), // OAuth scopes granted
    metadata: json("metadata"), // Any extra provider-specific data
    lastSyncAt: timestamp("last_sync_at", { mode: "string" }),
    syncStatus: varchar("sync_status", { length: 50 }).default("pending"), // pending, syncing, synced, error
    syncError: text("sync_error"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
}, (table) => {
    return {
        userProviderIdx: index("provider_connection_user_provider").on(table.userId, table.provider),
    }
});

export const athleteProfile = pgTable("athlete_profile", {
    userId: varchar("user_id", { length: 255 }).primaryKey(),
    // Strava profile fields (synced from Strava during login)
    stravaFirstName: varchar("strava_first_name", { length: 255 }),
    stravaLastName: varchar("strava_last_name", { length: 255 }),
    stravaProfilePicture: varchar("strava_profile_picture", { length: 512 }),
    stravaBio: text("strava_bio"),
    stravaWeight: doublePrecision("strava_weight"),
    stravaHeight: integer("strava_height"),
    stravaCity: varchar("strava_city", { length: 255 }),
    stravaState: varchar("strava_state", { length: 255 }),
    stravaCountry: varchar("strava_country", { length: 255 }),
    sex: varchar("sex", { length: 50 }),
    // User override fields (nullable - when null, use Strava values)
    displayName: varchar("display_name", { length: 255 }),
    customProfilePicture: varchar("custom_profile_picture", { length: 512 }),
    bio: text("bio"),
    // Performance metrics
    maxHeartRate: integer("max_heart_rate"),
    restingHeartRate: integer("resting_heart_rate"),
    functionalThresholdPower: integer("functional_threshold_power"),
    weight: doublePrecision("weight"),
    heightInCm: integer("height_in_cm"),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    measurementUnit: varchar("measurement_unit", { length: 20 }).default("imperial"),
    
    // New expansion fields
    stravaFtp: integer("strava_ftp"),
    stravaFriendCount: integer("strava_friend_count"),
    stravaFollowerCount: integer("strava_follower_count"),
    
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
});

// Coaching Insights Table - AI-generated performance analysis
export const coachingInsights = pgTable("coaching_insights", {
    activityId: varchar("activity_id", { length: 255 }).primaryKey(),

    // Structured insight data
    runClassification: varchar("run_classification", { length: 255 }), // "controlled aerobic", "tempo", etc.
    heartRateAnalysis: json("heart_rate_analysis"), // HR zones, drift patterns
    pacingAnalysis: json("pacing_analysis"), // Split patterns, consistency
    performanceImplications: text("performance_implications"),
    recommendations: json("recommendations"), // Actionable next steps

    // Full AI-generated text
    insightText: text("insight_text").notNull(),
    editedText: text("edited_text"),

    // Metadata
    generatedAt: integer("generated_at").notNull(),
    editedAt: integer("edited_at"),
    shareToken: varchar("share_token", { length: 255 }),
    isPublic: boolean("is_public").default(false),
});

// Activity Streams Table - Time-series data for charts and maps
export const activityStream = pgTable("activity_stream", {
    activityId: varchar("activity_id", { length: 255 }).primaryKey(),
    // We store all stream types as JSON arrays to maintain high performance in a relational DB 
    // without needing a dedicated time-series DB like Prometheus/Influx
    time: json("time"), // Seconds from start
    distance: json("distance"), // Meters
    latlng: json("latlng"), // [ [lat, lng], ... ]
    altitude: json("altitude"), // Meters
    velocitySmooth: json("velocity_smooth"), // Meters per second
    heartrate: json("heartrate"), // BPM
    cadence: json("cadence"), // RPM
    watts: json("watts"), // Watts
    temp: json("temp"), // Celsius
    moving: json("moving"), // Boolean array
    gradeSmooth: json("grade_smooth"), // Percentage
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
});

// Generation Status Table - Track background AI generation jobs
export const generationStatus = pgTable("generation_status", {
    activityId: varchar("activity_id", { length: 255 }).primaryKey(),
    letterStatus: varchar("letter_status", { length: 50 }).notNull().default('pending'), // pending, generating, completed, failed
    coachingStatus: varchar("coaching_status", { length: 50 }).notNull().default('pending'),
    thumbnailStatus: varchar("thumbnail_status", { length: 50 }).default('pending'),
    letterError: text("letter_error"),
    coachingError: text("coaching_error"),
    thumbnailError: text("thumbnail_error"),
    startedAt: integer("started_at"),
    completedAt: integer("completed_at"),
});

// User Reference Images - Store user photos for AI thumbnail generation
export const userReferenceImages = pgTable("user_reference_images", {
    imageId: varchar("image_id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    imageUrl: varchar("image_url", { length: 512 }).notNull(),
    imageType: varchar("image_type", { length: 50 }).notNull(), // 'running', 'cycling', 'general'
    isDefault: boolean("is_default").default(false),
    uploadedAt: timestamp("uploaded_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
}, (table) => {
    return {
        userIdIdx: index("user_reference_images_user_id").on(table.userId),
    }
});

// Daily Metrics - Normalized data from various wearables (Oura/Whoop/Garmin/Apple)
export const dailyMetrics = pgTable("daily_metrics", {
    id: varchar("id", { length: 255 }).primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    source: varchar("source", { length: 50 }), // garmin, oura, etc.
    
    // Core Recovery Metrics
    restingHeartRate: integer("resting_heart_rate"),
    heartRateVariability: integer("heart_rate_variability"), // rMSSD usually
    sleepDurationSeconds: integer("sleep_duration_seconds"),
    sleepQualityScore: integer("sleep_quality_score"), // 0-100
    
    // Activity/Strain Metrics
    stepCount: integer("step_count"),
    floorsClimbed: integer("floors_climbed"),
    caloriesBurned: integer("calories_burned"),
    
    // Raw JSON for provider-specific extras
    raw: json("raw"),
    
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
}, (table) => {
    return {
        userDateIdx: index("daily_metrics_user_date").on(table.userId, table.date),
        userDateUnique: unique("daily_metrics_user_date_unique").on(table.userId, table.date),
    }
});

// Athlete Readiness - AI-Computed scores
export const athleteReadiness = pgTable("athlete_readiness", {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    date: date("date", { mode: "string" }).notNull(),
    
    // The "Traffic Light" Score
    readinessScore: integer("readiness_score"), // 0-100
    injuryRisk: varchar("injury_risk", { length: 50 }), // 'low', 'moderate', 'high', 'critical'
    
    // The "Why": text generated by the agent
    summary: text("summary"), // "Your HRV is low, but you slept well..."
    recommendation: text("recommendation"), // "Take an easy day"
    
    // Daily Audio Briefing
    audioUrl: text("audio_url"), // URL to the generated MP3
    
    generatedAt: timestamp("generated_at", { mode: "string" }).notNull(),
}, (table) => {
    return {
        userDateIdx: index("athlete_readiness_user_date").on(table.userId, table.date),
        userDateUnique: unique("athlete_readiness_user_date_unique").on(table.userId, table.date),
    }
});

// Training Chat - Interactive history with the Training Director
export const trainingChat = pgTable("training_chat", {
    messageId: varchar("message_id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    
    // If the tool was used, store which one
    toolUsed: varchar("tool_used", { length: 100 }),
    
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
}, (table) => {
    return {
        userIdIdx: index("training_chat_user_id").on(table.userId),
        createdIdx: index("training_chat_created_at").on(table.createdAt),
    }
});

// Generated Social Content - Tracking assets created for sharing
export const socialContent = pgTable("social_content", {
    contentId: varchar("content_id", { length: 255 }).primaryKey(),
    activityId: varchar("activity_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    
    type: varchar("type", { length: 50 }).notNull(), // 'story_video', 'story_image', 'post_carousel'
    url: text("url").notNull(), // Supabase Storage URL
    caption: text("caption"), // AI generated caption
    
    generatedAt: timestamp("generated_at", { mode: "string" }).notNull(),
}, (table) => {
    return {
        activityIdx: index("social_content_activity_id").on(table.activityId),
    }
});

// ============================================================================
// INFLUENCER PROFILE FEATURE
// ============================================================================

// Public Profile - Public-facing athlete settings
export const publicProfile = pgTable("public_profile", {
    userId: varchar("user_id", { length: 255 }).primaryKey(),
    username: varchar("username", { length: 50 }).unique(), // URL slug: /athlete/[username]
    isPublic: boolean("is_public").default(false),
    displayName: varchar("display_name", { length: 255 }),
    tagline: text("tagline"), // "Ultra Runner | 100-mile finisher"
    coverImageUrl: text("cover_image_url"),
    socialLinks: json("social_links"), // { instagram, twitter, strava, youtube }
    layoutConfig: json("layout_config"), // Layout preferences and privacy settings
    featuredActivityId: varchar("featured_activity_id", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
}, (table) => ({
    usernameIdx: index("public_profile_username").on(table.username),
}));

// Live Event - Scheduled/active events
export const liveEvent = pgTable("live_event", {
    eventId: varchar("event_id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    eventType: varchar("event_type", { length: 50 }), // marathon, ultra, training, podcast
    status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, live, ended
    scheduledStart: timestamp("scheduled_start", { mode: "string" }),
    actualStart: timestamp("actual_start", { mode: "string" }),
    actualEnd: timestamp("actual_end", { mode: "string" }),
    streamUrl: text("stream_url"), // YouTube/Twitch embed URL
    thumbnailUrl: text("thumbnail_url"),
    linkedActivityId: varchar("linked_activity_id", { length: 255 }),
    viewerCount: integer("viewer_count").default(0),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
}, (table) => ({
    userStatusIdx: index("live_event_user_status").on(table.userId, table.status),
    scheduledIdx: index("live_event_scheduled").on(table.scheduledStart),
}));

// Event Chat - Real-time chat messages
export const eventChat = pgTable("event_chat", {
    messageId: varchar("message_id", { length: 255 }).primaryKey(),
    eventId: varchar("event_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    userName: varchar("user_name", { length: 255 }), // Denormalized for perf
    userAvatar: varchar("user_avatar", { length: 512 }),
    content: text("content").notNull(),
    isDeleted: boolean("is_deleted").default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
}, (table) => ({
    eventCreatedIdx: index("event_chat_event_created").on(table.eventId, table.createdAt),
}));

// Broadcast Archive - Past event recordings
export const broadcastArchive = pgTable("broadcast_archive", {
    archiveId: varchar("archive_id", { length: 255 }).primaryKey(),
    eventId: varchar("event_id", { length: 255 }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    videoUrl: text("video_url").notNull(), // YouTube/Vimeo URL
    thumbnailUrl: text("thumbnail_url"),
    durationSeconds: integer("duration_seconds"),
    viewCount: integer("view_count").default(0),
    linkedActivityId: varchar("linked_activity_id", { length: 255 }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
}, (table) => ({
    userIdx: index("broadcast_archive_user").on(table.userId),
}));

// Races - Upcoming and past race events
export const races = pgTable("races", {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    date: timestamp("date", { mode: "string" }).notNull(),
    distance: integer("distance"), // meters
    distanceClass: varchar("distance_class", { length: 50 }), // '5k', '10k', 'half', 'marathon', etc.
    location: varchar("location", { length: 255 }),
    goalTime: integer("goal_time"), // seconds
    priority: varchar("priority", { length: 20 }).default("A"), // A, B, C
    status: varchar("status", { length: 20 }).default("upcoming"), // upcoming, completed, dns, dnf
    raceUrl: text("race_url"),
    courseUrl: text("course_url"),
    bibNumber: varchar("bib_number", { length: 50 }),
    notes: text("notes"),
    linkedActivityId: varchar("linked_activity_id", { length: 255 }),
    resultTime: integer("result_time"), // actual finish time
    resultPlacement: integer("result_placement"),
    resultAgeGroupPlacement: integer("result_age_group_placement"),
    resultGenderPlacement: integer("result_gender_placement"),
    isPr: boolean("is_pr").default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }),
}, (table) => ({
    userIdx: index("races_user").on(table.userId),
    dateIdx: index("races_date").on(table.date),
    statusIdx: index("races_status").on(table.status),
    userDateIdx: index("races_user_date").on(table.userId, table.date),
}));

// Activity Media - Photos, videos, AI-generated content
export const activityMedia = pgTable("activity_media", {
    id: varchar("id", { length: 255 }).primaryKey(),
    activityId: varchar("activity_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    mediaType: varchar("media_type", { length: 20 }).notNull(), // photo, video, ai_thumbnail, route_video
    storageUrl: text("storage_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    caption: text("caption"),
    isFeatured: boolean("is_featured").default(false),
    sortOrder: integer("sort_order").default(0),
    source: varchar("source", { length: 50 }).default("upload"), // upload, strava, ai_generated
    metadata: jsonText<any>("metadata"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
}, (table) => ({
    activityIdx: index("activity_media_activity").on(table.activityId),
    userIdx: index("activity_media_user").on(table.userId),
    featuredIdx: index("activity_media_featured").on(table.activityId, table.isFeatured),
}));

// Standard Distances - Reference table for race detection
export const standardDistances = pgTable("standard_distances", {
    id: varchar("id", { length: 50 }).primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    distanceMeters: integer("distance_meters").notNull(),
    tolerancePercent: doublePrecision("tolerance_percent").default(2.0),
});
