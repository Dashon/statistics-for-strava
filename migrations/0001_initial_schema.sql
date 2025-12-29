-- Initial schema migration for Strava Statistics app

-- Activity Table
CREATE TABLE IF NOT EXISTS activity (
    activityid VARCHAR(255) PRIMARY KEY,
    startdatetime TIMESTAMP NOT NULL,
    data TEXT NOT NULL,
    location TEXT,
    weather TEXT,
    gearid VARCHAR(255),
    sporttype VARCHAR(255),
    devicename VARCHAR(255),
    name VARCHAR(255),
    description VARCHAR(255),
    distance DOUBLE PRECISION,
    elevation DOUBLE PRECISION,
    averagespeed DOUBLE PRECISION,
    maxspeed DOUBLE PRECISION,
    startingcoordinatelatitude DOUBLE PRECISION,
    startingcoordinatelongitude DOUBLE PRECISION,
    calories INTEGER,
    averagepower INTEGER,
    maxpower INTEGER,
    averageheartrate INTEGER,
    maxheartrate INTEGER,
    averagecadence INTEGER,
    movingtimeinseconds INTEGER,
    kudocount INTEGER,
    totalimagecount INTEGER,
    iscommute BOOLEAN,
    markedfordeletion BOOLEAN,
    streamsareimported BOOLEAN,
    polyline TEXT,
    routegeography TEXT,
    localimagepaths TEXT,
    workouttype VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS activity_sporttype ON activity(sporttype);

-- Run Letters Table
CREATE TABLE IF NOT EXISTS run_letters (
    activity_id VARCHAR(255) PRIMARY KEY,
    letter_text TEXT NOT NULL,
    edited_text TEXT,
    generated_at INTEGER NOT NULL,
    edited_at INTEGER,
    share_token VARCHAR(255),
    is_public BOOLEAN
);

-- Gear Table
CREATE TABLE IF NOT EXISTS gear (
    gearid VARCHAR(255) PRIMARY KEY,
    createdon TIMESTAMP NOT NULL,
    distanceinmeter INTEGER NOT NULL,
    data TEXT NOT NULL,
    name VARCHAR(255),
    isretired BOOLEAN,
    type VARCHAR(255)
);

-- Segment Table
CREATE TABLE IF NOT EXISTS segment (
    segmentid VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    sporttype VARCHAR(255),
    distance DOUBLE PRECISION,
    maxgradient DOUBLE PRECISION,
    isfavourite BOOLEAN,
    countrycode VARCHAR(255),
    data TEXT NOT NULL,
    detailshavebeenimported BOOLEAN,
    polyline TEXT,
    startingcoordinatelatitude DOUBLE PRECISION,
    startingcoordinatelongitude DOUBLE PRECISION
);

-- Segment Effort Table
CREATE TABLE IF NOT EXISTS segmenteffort (
    segmenteffortid VARCHAR(255) PRIMARY KEY,
    segmentid VARCHAR(255) NOT NULL,
    activityid VARCHAR(255) NOT NULL,
    startdatetime TIMESTAMP NOT NULL,
    data TEXT NOT NULL,
    name VARCHAR(255),
    elapsedtimeinseconds DOUBLE PRECISION,
    distance INTEGER,
    averagewatts DOUBLE PRECISION
);

-- Challenge Table
CREATE TABLE IF NOT EXISTS challenge (
    challengeid VARCHAR(255) PRIMARY KEY,
    createdon TIMESTAMP NOT NULL,
    data TEXT NOT NULL,
    name VARCHAR(255),
    logourl VARCHAR(255),
    slug VARCHAR(255)
);

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    userid VARCHAR(255) PRIMARY KEY,
    stravaathleteid INTEGER NOT NULL,
    stravaaccesstoken VARCHAR(255) NOT NULL,
    stravarefreshtoken VARCHAR(255) NOT NULL,
    stravatokenexpiresat TIMESTAMP NOT NULL,
    createdat TIMESTAMP NOT NULL,
    updatedat TIMESTAMP NOT NULL,
    roles JSON NOT NULL
);

-- Athlete Profile Table
CREATE TABLE IF NOT EXISTS athlete_profile (
    user_id VARCHAR(255) PRIMARY KEY,
    max_heart_rate INTEGER,
    resting_heart_rate INTEGER,
    functional_threshold_power INTEGER,
    weight DOUBLE PRECISION,
    height_in_cm INTEGER,
    date_of_birth DATE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athlete_profile_user_id ON athlete_profile(user_id);
