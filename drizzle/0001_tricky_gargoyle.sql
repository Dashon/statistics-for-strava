CREATE TABLE "activitybesteffort" (
	"activityid" varchar(255) NOT NULL,
	"distanceinmeter" integer NOT NULL,
	"sporttype" varchar(255) NOT NULL,
	"timeinseconds" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_insights" (
	"activity_id" varchar(255) PRIMARY KEY NOT NULL,
	"run_classification" varchar(255),
	"heart_rate_analysis" text,
	"pacing_analysis" text,
	"effort_analysis" text,
	"performance_implications" text,
	"recommendations" text,
	"insight_text" text NOT NULL,
	"edited_text" text,
	"generated_at" integer NOT NULL,
	"edited_at" integer,
	"share_token" varchar(255),
	"is_public" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "training_load" (
	"date" date PRIMARY KEY NOT NULL,
	"trimp" double precision,
	"tss" double precision,
	"atl" double precision,
	"ctl" double precision,
	"tsb" double precision,
	"monotony" double precision,
	"strain" double precision,
	"acute_chronic_ratio" double precision,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "activitybesteffort_pk" ON "activitybesteffort" USING btree ("activityid","distanceinmeter");--> statement-breakpoint
CREATE INDEX "activitybesteffort_sporttype" ON "activitybesteffort" USING btree ("sporttype");