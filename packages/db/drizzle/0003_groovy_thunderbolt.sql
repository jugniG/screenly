CREATE TABLE "screenly"."friends" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"addressee_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screenly"."leaderboard_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"total_minutes" integer NOT NULL,
	"top_apps" jsonb NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "friends_requester_addressee_unique" ON "screenly"."friends" USING btree ("requester_id","addressee_id");--> statement-breakpoint
CREATE INDEX "friends_requester_idx" ON "screenly"."friends" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friends_addressee_idx" ON "screenly"."friends" USING btree ("addressee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "leaderboard_user_date_unique" ON "screenly"."leaderboard_snapshots" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "leaderboard_date_idx" ON "screenly"."leaderboard_snapshots" USING btree ("date");