CREATE TABLE "replays" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "replays_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" varchar(255) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"matchDate" bigint,
	"mapName" varchar(255),
	"gameType" varchar(50),
	"replayHeader" jsonb,
	"replayDetails" jsonb,
	"players" jsonb,
	"gameEvents" jsonb,
	"trackerEvents" jsonb,
	"messageEvents" jsonb,
	"winner" varchar(255),
	"duration" integer,
	"gameLength" integer,
	"filePath" text,
	"fileSize" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
