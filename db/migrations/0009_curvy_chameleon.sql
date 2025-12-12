CREATE TYPE "public"."generation_job_status" AS ENUM('pending', 'queued', 'processing', 'uploading', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."generation_job_type" AS ENUM('video', 'image', 'chat');--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"message_id" uuid,
	"job_type" "generation_job_type" NOT NULL,
	"status" "generation_job_status" DEFAULT 'pending' NOT NULL,
	"input_params" text NOT NULL,
	"provider" varchar(50),
	"provider_request_id" varchar(255),
	"provider_status" varchar(50),
	"result_url" text,
	"result_content" text,
	"storage_path" text,
	"public_url" text,
	"public_url_expires_at" timestamp with time zone,
	"error_message" text,
	"error_code" varchar(50),
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"progress_percent" integer,
	"progress_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"generation_time_ms" integer,
	"cost_usd" numeric(10, 6),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;