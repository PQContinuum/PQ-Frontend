CREATE TYPE "public"."context_category" AS ENUM('personal', 'technical', 'preferences', 'project', 'decisions', 'summary');--> statement-breakpoint
CREATE TABLE "user_context" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"category" "context_category" NOT NULL,
	"source_conversation_id" uuid,
	"confidence" integer DEFAULT 100 NOT NULL,
	"last_mentioned" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
