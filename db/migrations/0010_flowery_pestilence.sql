CREATE TYPE "public"."feedback_category" AS ENUM('ai', 'ui', 'bug', 'feature', 'performance', 'other');--> statement-breakpoint
CREATE TYPE "public"."feedback_sentiment" AS ENUM('very_negative', 'negative', 'neutral', 'positive', 'very_positive');--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "feedback_category" NOT NULL,
	"sentiment" "feedback_sentiment" NOT NULL,
	"message" text NOT NULL,
	"page_url" text,
	"user_agent" text,
	"conversation_id" uuid,
	"metadata" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
