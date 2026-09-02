/*
  Videos — self-hosted video files for life testimonies.

  Separate from `media` on purpose: that collection is images-only
  (`mimeTypes: ['image/*']`) and every upload there is run through sharp to
  build the banner/card webp presets. A video would fail that pipeline, and
  loosening `media` would let someone drop a 300MB file where a photo belongs.

  This is the LAST-RESORT source. The site's rule is that video lives on
  YouTube (CLAUDE.md): the droplet has no CDN in front of it, so a self-hosted
  file is served straight from the CMS container to a phone on 4G. Use it only
  when the testimony genuinely cannot be posted to YouTube or Facebook — the
  field description in Life Testimonies says the same thing to editors.

  Payload serves these through its range-request handler, so seeking in a
  <video> element works without extra configuration.
*/
import type { CollectionConfig } from 'payload';
import { isAuthenticated } from '../access/roles';

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Video file', plural: 'Video files' },
  admin: {
    group: 'Library',
    description: 'Uploaded video files. Prefer YouTube — see any testimony\'s video section.',
  },
  access: {
    // Public read so <video src> resolves without a token, same as media.
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  upload: {
    /*
      A `videos` subdirectory of wherever media goes, so the files land inside
      the same mounted volume (nothing else is backed up) without sharing a
      filename namespace with the image uploads.
    */
    staticDir: process.env.VIDEO_DIR || `${process.env.MEDIA_DIR || 'media'}/videos`,
    // Web-playable containers only. .mov and .avi upload fine but will not
    // play in most browsers, so they are blocked at the picker instead of
    // failing silently for visitors.
    mimeTypes: ['video/mp4', 'video/webm'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Short description of the video, used as the accessible title.',
      },
    },
  ],
};
