import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_life_testimonies_video_source" AS ENUM('none', 'youtube', 'facebook', 'upload');
  CREATE TYPE "public"."enum_life_testimonies_status" AS ENUM('draft', 'in_review', 'published');
  CREATE TABLE "life_testimonies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"person" varchar,
  	"date" timestamp(3) with time zone NOT NULL,
  	"body" jsonb NOT NULL,
  	"video_source" "enum_life_testimonies_video_source" DEFAULT 'none' NOT NULL,
  	"video_url" varchar,
  	"video_file_id" integer,
  	"video_poster_id" integer,
  	"banner_id" integer,
  	"banner_alt" varchar,
  	"status" "enum_life_testimonies_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "videos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "life_testimonies_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "videos_id" integer;
  ALTER TABLE "life_testimonies" ADD CONSTRAINT "life_testimonies_video_file_id_videos_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "life_testimonies" ADD CONSTRAINT "life_testimonies_video_poster_id_media_id_fk" FOREIGN KEY ("video_poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "life_testimonies" ADD CONSTRAINT "life_testimonies_banner_id_media_id_fk" FOREIGN KEY ("banner_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "life_testimonies_slug_idx" ON "life_testimonies" USING btree ("slug");
  CREATE INDEX "life_testimonies_video_video_file_idx" ON "life_testimonies" USING btree ("video_file_id");
  CREATE INDEX "life_testimonies_video_video_poster_idx" ON "life_testimonies" USING btree ("video_poster_id");
  CREATE INDEX "life_testimonies_banner_idx" ON "life_testimonies" USING btree ("banner_id");
  CREATE INDEX "life_testimonies_status_idx" ON "life_testimonies" USING btree ("status");
  CREATE INDEX "life_testimonies_updated_at_idx" ON "life_testimonies" USING btree ("updated_at");
  CREATE INDEX "life_testimonies_created_at_idx" ON "life_testimonies" USING btree ("created_at");
  CREATE INDEX "videos_updated_at_idx" ON "videos" USING btree ("updated_at");
  CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");
  CREATE UNIQUE INDEX "videos_filename_idx" ON "videos" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_life_testimonies_fk" FOREIGN KEY ("life_testimonies_id") REFERENCES "public"."life_testimonies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_videos_fk" FOREIGN KEY ("videos_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_life_testimonies_id_idx" ON "payload_locked_documents_rels" USING btree ("life_testimonies_id");
  CREATE INDEX "payload_locked_documents_rels_videos_id_idx" ON "payload_locked_documents_rels" USING btree ("videos_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "life_testimonies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "videos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "life_testimonies" CASCADE;
  DROP TABLE "videos" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_life_testimonies_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_videos_fk";
  
  DROP INDEX "payload_locked_documents_rels_life_testimonies_id_idx";
  DROP INDEX "payload_locked_documents_rels_videos_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "life_testimonies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "videos_id";
  DROP TYPE "public"."enum_life_testimonies_video_source";
  DROP TYPE "public"."enum_life_testimonies_status";`)
}
