CREATE TABLE "image_gen_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"prompt" text NOT NULL,
	"revised_prompt" text,
	"model" varchar(50) DEFAULT 'dall-e-3' NOT NULL,
	"quality" varchar(20) DEFAULT 'standard' NOT NULL,
	"size" varchar(20) DEFAULT '1024x1024' NOT NULL,
	"style" varchar(20) DEFAULT 'vivid',
	"storage_path" text,
	"original_url" text,
	"cost_usd" numeric(10, 6) NOT NULL,
	"generation_time_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
