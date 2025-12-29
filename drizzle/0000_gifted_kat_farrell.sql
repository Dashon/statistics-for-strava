CREATE TABLE "activity" (
	"activityid" varchar(255) PRIMARY KEY NOT NULL,
	"startdatetime" timestamp NOT NULL,
	"data" text NOT NULL,
	"location" text,
	"weather" text,
	"gearid" varchar(255),
	"sporttype" varchar(255),
	"devicename" varchar(255),
	"name" varchar(255),
	"description" varchar(255),
	"distance" double precision,
	"elevation" double precision,
	"averagespeed" double precision,
	"maxspeed" double precision,
	"startingcoordinatelatitude" double precision,
	"startingcoordinatelongitude" double precision,
	"calories" integer,
	"averagepower" integer,
	"maxpower" integer,
	"averageheartrate" integer,
	"maxheartrate" integer,
	"averagecadence" integer,
	"movingtimeinseconds" integer,
	"kudocount" integer,
	"totalimagecount" integer,
	"iscommute" boolean,
	"markedfordeletion" boolean,
	"streamsareimported" boolean,
	"polyline" text,
	"routegeography" text,
	"localimagepaths" text,
	"workouttype" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "activitystream" (
	"activityid" varchar(255) NOT NULL,
	"streamtype" varchar(255) NOT NULL,
	"createdon" timestamp NOT NULL,
	"data" text NOT NULL,
	"bestaverages" text
);
--> statement-breakpoint
CREATE TABLE "challenge" (
	"challengeid" varchar(255) PRIMARY KEY NOT NULL,
	"createdon" timestamp NOT NULL,
	"data" text NOT NULL,
	"name" varchar(255),
	"logourl" varchar(255),
	"slug" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "ftp" (
	"seton" date PRIMARY KEY NOT NULL,
	"ftp" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gear" (
	"gearid" varchar(255) PRIMARY KEY NOT NULL,
	"createdon" timestamp NOT NULL,
	"distanceinmeter" integer NOT NULL,
	"data" text NOT NULL,
	"name" varchar(255),
	"isretired" boolean,
	"type" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "keyvalue" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_letters" (
	"activity_id" varchar(255) PRIMARY KEY NOT NULL,
	"letter_text" text NOT NULL,
	"edited_text" text,
	"generated_at" integer NOT NULL,
	"edited_at" integer,
	"share_token" varchar(255),
	"is_public" boolean
);
--> statement-breakpoint
CREATE TABLE "segment" (
	"segmentid" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"sporttype" varchar(255),
	"distance" double precision,
	"maxgradient" double precision,
	"isfavourite" boolean,
	"countrycode" varchar(255),
	"data" text NOT NULL,
	"detailshavebeenimported" boolean,
	"polyline" text,
	"startingcoordinatelatitude" double precision,
	"startingcoordinatelongitude" double precision
);
--> statement-breakpoint
CREATE TABLE "segmenteffort" (
	"segmenteffortid" varchar(255) PRIMARY KEY NOT NULL,
	"segmentid" varchar(255) NOT NULL,
	"activityid" varchar(255) NOT NULL,
	"startdatetime" timestamp NOT NULL,
	"data" text NOT NULL,
	"name" varchar(255),
	"elapsedtimeinseconds" double precision,
	"distance" integer,
	"averagewatts" double precision
);
--> statement-breakpoint
CREATE TABLE "User" (
	"userid" varchar(255) PRIMARY KEY NOT NULL,
	"stravaathleteid" integer NOT NULL,
	"stravaaccesstoken" varchar(255) NOT NULL,
	"stravarefreshtoken" varchar(255) NOT NULL,
	"stravatokenexpiresat" timestamp NOT NULL,
	"createdat" timestamp NOT NULL,
	"updatedat" timestamp NOT NULL,
	"roles" json NOT NULL
);
--> statement-breakpoint
CREATE INDEX "activity_sporttype" ON "activity" USING btree ("sporttype");--> statement-breakpoint
CREATE INDEX "activitystream_pk" ON "activitystream" USING btree ("activityid","streamtype");