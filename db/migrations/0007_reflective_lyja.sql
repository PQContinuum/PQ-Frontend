CREATE TABLE "video_gen_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"mode" varchar(20) DEFAULT 'text-to-video' NOT NULL,
	"duration" varchar(5) DEFAULT '5' NOT NULL,
	"aspect_ratio" varchar(10) DEFAULT '16:9' NOT NULL,
	"audio_enabled" boolean DEFAULT true NOT NULL,
	"source_image_url" text,
	"storage_path" text,
	"original_url" text,
	"request_id" varchar(100),
	"cost_usd" numeric(10, 6) NOT NULL,
	"generation_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
