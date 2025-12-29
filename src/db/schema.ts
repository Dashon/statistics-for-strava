
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
}, (table) => {
    return {
        sportTypeIdx: index("activity_sporttype").on(table.sportType),
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
    maxHeartRate: integer("max_heart_rate"),
    restingHeartRate: integer("resting_heart_rate"),
    functionalThresholdPower: integer("functional_threshold_power"),
    weight: doublePrecision("weight"),
    heightInCm: integer("height_in_cm"),
    dateOfBirth: date("date_of_birth", { mode: "string" }),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
});
