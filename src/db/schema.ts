
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
    createdAt: timestamp("createdat", { mode: "string" }).notNull(),
    updatedAt: timestamp("updatedat", { mode: "string" }).notNull(),
    roles: json("roles").notNull(),
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
