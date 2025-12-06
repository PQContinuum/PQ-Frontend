CREATE TYPE "public"."attachment_type" AS ENUM('image', 'document', 'code', 'archive');--> statement-breakpoint
CREATE TABLE "conversation_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"message_id" uuid,
	"user_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_type" "attachment_type" NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"file_size" integer NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text,
	"signed_url" text,
	"signed_url_expiry" timestamp with time zone,
	"thumbnail_path" text,
	"metadata" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conversation_attachments" ADD CONSTRAINT "conversation_attachments_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;