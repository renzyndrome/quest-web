import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "announcements" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "events" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "life_testimonies" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "announcements" DROP COLUMN "banner_alt";
  ALTER TABLE "events" DROP COLUMN "banner_alt";
  ALTER TABLE "life_testimonies" DROP COLUMN "video_source";
  ALTER TABLE "life_testimonies" DROP COLUMN "banner_alt";
  DROP TYPE "public"."enum_life_testimonies_video_source";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_life_testimonies_video_source" AS ENUM('none', 'youtube', 'facebook', 'upload');
  ALTER TABLE "announcements" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "events" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "life_testimonies" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "announcements" ADD COLUMN "banner_alt" varchar;
  ALTER TABLE "events" ADD COLUMN "banner_alt" varchar;
  ALTER TABLE "life_testimonies" ADD COLUMN "video_source" "enum_life_testimonies_video_source" DEFAULT 'none' NOT NULL;
  ALTER TABLE "life_testimonies" ADD COLUMN "banner_alt" varchar;`)
}
