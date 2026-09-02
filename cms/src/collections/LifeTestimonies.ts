/*
  Life Testimonies — stories from the congregation, rendered at /testimonies
  and /testimonies/[slug].

  Shaped like Announcements (same approval workflow, same auto slug, same
  banner and status fields, same afterRead HTML conversion) with one addition:
  an optional video, which is the point of the section. A testimony is usually
  told on camera and written up underneath.

  The video asks for one thing: a link. Whether that link is YouTube or
  Facebook is something the site can work out on its own (src/lib/video.ts),
  so making an editor pick from a dropdown first was asking them to classify a
  URL they had already pasted. Uploading a file is the fallback underneath.
*/
import type { CollectionConfig } from 'payload';
import { isAdmin, isAuthenticated, readPublishedOrAuthenticated } from '../access/roles';
import { statusField } from '../fields/statusField';
import { slugField } from '../fields/slugField';
import { limitedEditor } from '../fields/limitedEditor';
import { addHtmlFields } from '../fields/richTextHtml';
import { previewUrlFor } from '../lib/previewUrl';
import { deployWebhook } from '../hooks/deployWebhook';
import { notifyApprover } from '../hooks/notifyApprover';

/** Hosts we can actually embed. Anything else is a typo or an unsupported site. */
const YOUTUBE_HOST = /^(www\.|m\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be)$/i;
const FACEBOOK_HOST = /^(www\.|web\.|m\.|fb\.)?(facebook\.com|fb\.watch)$/i;

/** Hostname of a pasted link, or '' when it is not a URL yet (mid-typing). */
const hostOf = (url: string): string => {
  try {
    return new URL(url.trim()).hostname;
  } catch {
    return '';
  }
};

export const LifeTestimonies: CollectionConfig = {
  slug: 'life-testimonies',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'person', 'date', 'status'],
    group: 'Content',
    description: 'Stories of changed lives, shown on the site\'s Life Testimonies page.',
    preview: previewUrlFor('life-testimonies'),
  },
  labels: {
    singular: 'Life testimony',
    plural: 'Life Testimonies',
  },
  access: {
    read: readPublishedOrAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAdmin,
  },
  hooks: {
    afterRead: [addHtmlFields(['body'])],
    afterChange: [deployWebhook, notifyApprover],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'person',
      type: 'text',
      admin: {
        description: 'Whose story this is, as they want it shown. Leave blank to keep it anonymous.',
      },
    },
    { name: 'date', type: 'date', required: true },
    {
      name: 'body',
      type: 'richText',
      required: true,
      editor: limitedEditor,
    },
    {
      name: 'video',
      type: 'group',
      label: 'Video',
      admin: {
        description:
          'Optional. The written story above is always what carries the page.',
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'Video link',
          admin: {
            description:
              'A YouTube or Facebook link, copied straight from the address bar. Leave blank if there is no video.',
          },
          validate: (value: unknown, options: any) => {
            if (typeof value !== 'string' || value.trim() === '') return true;
            if (options?.siblingData?.file) {
              return 'Use a link or an uploaded file, not both. Clear one of them.';
            }
            let host: string;
            try {
              host = new URL(value.trim()).hostname;
            } catch {
              return 'That does not look like a full link. It should start with https://.';
            }
            if (!YOUTUBE_HOST.test(host) && !FACEBOOK_HOST.test(host)) {
              return 'Only YouTube and Facebook links can be shown. For anything else, upload the file instead.';
            }
            return true;
          },
        },
        {
          name: 'file',
          type: 'upload',
          relationTo: 'videos',
          label: 'Or upload a video file',
          admin: {
            description:
              'Only when the video is not on YouTube or Facebook. MP4 or WebM, under about 100MB — this streams from our own server, with no CDN.',
          },
        },
        {
          name: 'poster',
          type: 'upload',
          relationTo: 'media',
          label: 'Thumbnail',
          admin: {
            description: 'The still shown before the video plays.',
            // YouTube publishes its own thumbnail, so only ask when we have
            // no other way to get one.
            condition: (_data, siblingData) =>
              Boolean(siblingData?.file) ||
              (typeof siblingData?.url === 'string' && FACEBOOK_HOST.test(hostOf(siblingData.url))),
          },
        },
      ],
    },
    { name: 'banner', type: 'upload', relationTo: 'media' },
    slugField('title'),
    statusField,
  ],
};
