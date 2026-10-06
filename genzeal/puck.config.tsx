import type { Config, Slot, SlotField } from "@puckeditor/core";
import { Button, type ButtonProps } from "@/blocks/Button";
import { Buttons, type ButtonsProps } from "@/blocks/Buttons";
import { Callout, type CalloutProps } from "@/blocks/Callout";
import { Cards, type CardsProps } from "@/blocks/Cards";
import { Columns, type ColumnsProps } from "@/blocks/Columns";
import { Divider, type DividerProps } from "@/blocks/Divider";
import { FAQ, type FAQProps } from "@/blocks/FAQ";
import { Features, type FeaturesProps } from "@/blocks/Features";
import { Gallery, type GalleryProps } from "@/blocks/Gallery";
import { Heading, type HeadingProps } from "@/blocks/Heading";
import { Hero, type HeroProps } from "@/blocks/Hero";
import { InfoList, type InfoListProps } from "@/blocks/InfoList";
import { List, type ListProps } from "@/blocks/List";
import { MapCard, type MapProps } from "@/blocks/Map";
import { People, type PeopleProps } from "@/blocks/People";
import { Photo, type PhotoProps } from "@/blocks/Photo";
import { Quote, type QuoteProps } from "@/blocks/Quote";
import { Section, type SectionProps } from "@/blocks/Section";
import { PLATFORM_NAMES, SocialLinks, type SocialLinksProps } from "@/blocks/SocialLinks";
import { Spacer, type SpacerProps } from "@/blocks/Spacer";
import { Testimonial, type TestimonialProps } from "@/blocks/Testimonial";
import { Text, type TextProps } from "@/blocks/Text";
import { Video, type VideoProps } from "@/blocks/Video";
import { ImageField } from "@/components/ImageField";
import { richText } from "@/lib/fields";

/*
  Component keys are stored in published page data. Hero, Text, Photo, Video,
  Button and InfoList predate the categories: never rename those keys or
  their props. New props on them are optional with a default in the block.
*/
type Props = {
  // Layout
  Section: SectionProps & { content: Slot };
  Columns: ColumnsProps & { col1: Slot; col2: Slot; col3: Slot };
  Spacer: SpacerProps;
  Divider: DividerProps;
  // Text
  Heading: HeadingProps;
  Text: TextProps;
  Quote: QuoteProps;
  List: ListProps;
  Callout: CalloutProps;
  // Media
  Hero: HeroProps;
  Photo: PhotoProps;
  Gallery: GalleryProps;
  Video: VideoProps;
  Map: MapProps;
  // Content
  Cards: CardsProps;
  Features: FeaturesProps;
  Testimonial: TestimonialProps;
  People: PeopleProps;
  FAQ: FAQProps;
  InfoList: InfoListProps;
  // Actions
  Button: ButtonProps;
  Buttons: ButtonsProps;
  SocialLinks: SocialLinksProps;
};

type RootProps = { title: string; description: string };

const categories = {
  layout: { title: "Layout", components: ["Section", "Columns", "Spacer", "Divider"], defaultExpanded: true },
  text: { title: "Text", components: ["Heading", "Text", "Quote", "List", "Callout"], defaultExpanded: true },
  media: { title: "Media", components: ["Hero", "Photo", "Gallery", "Video", "Map"], defaultExpanded: false },
  content: {
    title: "Content",
    components: ["Cards", "Features", "Testimonial", "People", "FAQ", "InfoList"],
    defaultExpanded: false,
  },
  actions: { title: "Actions", components: ["Button", "Buttons", "SocialLinks"], defaultExpanded: false },
} as const satisfies Record<string, { title: string; components: readonly (keyof Props)[]; defaultExpanded: boolean }>;

type CategoryName = keyof typeof categories;

// Compile-time check: every component key sits in a category.
type Uncategorised = Exclude<keyof Props, (typeof categories)[CategoryName]["components"][number]>;
const everyComponentCategorised: [Uncategorised] extends [never] ? true : Uncategorised = true;
void everyComponentCategorised;

const photoField = { type: "custom", label: "Photo", render: ImageField } as const;
const altField = { type: "text", label: "Photo description" } as const;
const alignField = {
  type: "select",
  label: "Align",
  options: [
    { label: "Left", value: "left" },
    { label: "Center", value: "center" },
  ],
} as const;
const columnsField = {
  type: "select",
  label: "Columns",
  options: [
    { label: "2", value: "2" },
    { label: "3", value: "3" },
  ],
} as const;
const buttonStyleField = {
  type: "select",
  label: "Style",
  options: [
    { label: "Primary", value: "primary" },
    { label: "Secondary", value: "secondary" },
  ],
} as const;

// Full-width bands do not belong inside another block.
const slotField: SlotField = { type: "slot", disallow: ["Hero", "Section"] };
const columnSlotField: SlotField = { type: "slot", disallow: ["Hero", "Section", "Columns"] };
const SLOT_CLASS = "flex flex-col gap-6";

export const config: Config<Props, RootProps, CategoryName> = {
  categories: {
    ...categories,
    layout: { ...categories.layout, components: [...categories.layout.components] },
    text: { ...categories.text, components: [...categories.text.components] },
    media: { ...categories.media, components: [...categories.media.components] },
    content: { ...categories.content, components: [...categories.content.components] },
    actions: { ...categories.actions, components: [...categories.actions.components] },
    other: { visible: false },
  },
  root: {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "textarea", label: "Description" },
    },
  },
  components: {
    // ---------- Layout ----------
    Section: {
      label: "Section",
      fields: {
        background: {
          type: "select",
          label: "Background",
          options: [
            { label: "White", value: "white" },
            { label: "Cream", value: "cream" },
            { label: "Dark", value: "dark" },
            { label: "Red tint", value: "brand-tint" },
          ],
        },
        width: {
          type: "select",
          label: "Width",
          options: [
            { label: "Content", value: "content" },
            { label: "Narrow", value: "narrow" },
          ],
        },
        spacing: {
          type: "select",
          label: "Spacing",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Compact", value: "compact" },
          ],
        },
        anchor: { type: "text", label: "Anchor", placeholder: "schedule" },
        content: slotField,
      },
      defaultProps: { background: "white", width: "content", spacing: "normal", anchor: "", content: [] },
      render: ({ background, width, spacing, anchor, content: Content }) => (
        <Section background={background} width={width} spacing={spacing} anchor={anchor}>
          <Content className={SLOT_CLASS} />
        </Section>
      ),
    },
    Columns: {
      label: "Columns",
      fields: {
        layout: {
          type: "select",
          label: "Layout",
          options: [
            { label: "2 equal", value: "2" },
            { label: "3 equal", value: "3" },
            { label: "Wide left (2:1)", value: "2-1" },
            { label: "Wide right (1:2)", value: "1-2" },
          ],
        },
        gap: {
          type: "select",
          label: "Gap",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Tight", value: "tight" },
          ],
        },
        col1: columnSlotField,
        col2: columnSlotField,
        col3: columnSlotField,
      },
      defaultProps: { layout: "2", gap: "normal", col1: [], col2: [], col3: [] },
      render: ({ layout, gap, col1: Col1, col2: Col2, col3: Col3 }) => {
        const columns = [<Col1 key="1" className={SLOT_CLASS} />, <Col2 key="2" className={SLOT_CLASS} />];
        if (layout === "3") columns.push(<Col3 key="3" className={SLOT_CLASS} />);
        return <Columns layout={layout} gap={gap} columns={columns} />;
      },
    },
    Spacer: {
      label: "Spacer",
      fields: {
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ],
        },
      },
      defaultProps: { size: "medium" },
      render: ({ size }) => <Spacer size={size} />,
    },
    Divider: {
      label: "Divider",
      fields: {
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Line", value: "line" },
            { label: "Short red bar", value: "short" },
          ],
        },
      },
      defaultProps: { style: "line" },
      render: ({ style }) => <Divider style={style} />,
    },

    // ---------- Text ----------
    Heading: {
      label: "Heading",
      fields: {
        text: { type: "text", label: "Text", contentEditable: true },
        level: {
          type: "select",
          label: "Level",
          options: [
            { label: "Large (H2)", value: "h2" },
            { label: "Small (H3)", value: "h3" },
          ],
        },
        align: alignField,
      },
      defaultProps: { text: "Heading", level: "h2", align: "left" },
      render: ({ text, level, align }) => <Heading text={text} level={level} align={align} />,
    },
    Text: {
      label: "Paragraph",
      fields: {
        heading: { type: "text", label: "Heading", contentEditable: true },
        body: richText("Body"),
        tone: {
          type: "select",
          label: "Background",
          options: [
            { label: "White", value: "white" },
            { label: "Cream", value: "cream" },
          ],
        },
        align: alignField,
      },
      defaultProps: { heading: "", body: "<p>Body text.</p>", tone: "white", align: "left" },
      render: ({ heading, body, tone, align }) => <Text heading={heading} body={body} tone={tone} align={align} />,
    },
    Quote: {
      label: "Quote",
      fields: {
        quote: richText("Quote"),
        source: { type: "text", label: "Source" },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Plain", value: "plain" },
            { label: "Scripture", value: "scripture" },
          ],
        },
      },
      defaultProps: { quote: "<p>Quote text.</p>", source: "", style: "plain" },
      render: ({ quote, source, style }) => <Quote quote={quote} source={source} style={style} />,
    },
    List: {
      label: "List",
      fields: {
        items: {
          type: "array",
          label: "Items",
          arrayFields: { text: { type: "text", label: "Text" } },
          defaultItemProps: { text: "Item" },
          getItemSummary: (item) => item.text || "Item",
        },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Bullets", value: "bullets" },
            { label: "Numbers", value: "numbers" },
          ],
        },
      },
      defaultProps: { items: [{ text: "Item" }], style: "bullets" },
      render: ({ items, style }) => <List items={items} style={style} />,
    },
    Callout: {
      label: "Callout",
      fields: {
        heading: { type: "text", label: "Heading", contentEditable: true },
        body: richText("Body"),
        tone: {
          type: "select",
          label: "Tone",
          options: [
            { label: "Info", value: "info" },
            { label: "Important", value: "important" },
          ],
        },
      },
      defaultProps: { heading: "Note", body: "<p>Callout text.</p>", tone: "info" },
      render: ({ heading, body, tone }) => <Callout heading={heading} body={body} tone={tone} />,
    },

    // ---------- Media ----------
    Hero: {
      label: "Cover",
      fields: {
        title: { type: "text", label: "Title", contentEditable: true },
        subtitle: { type: "textarea", label: "Subtitle", contentEditable: true },
        image: photoField,
        alt: altField,
        height: {
          type: "select",
          label: "Height",
          options: [
            { label: "Tall", value: "tall" },
            { label: "Short", value: "short" },
          ],
        },
        align: alignField,
      },
      defaultProps: { title: "GenZeal", subtitle: "", image: "", alt: "", height: "tall", align: "left" },
      render: ({ title, subtitle, image, alt, height, align }) => (
        <Hero title={title} subtitle={subtitle} image={image} alt={alt} height={height} align={align} />
      ),
    },
    Photo: {
      label: "Image",
      fields: {
        image: photoField,
        alt: altField,
        caption: { type: "text", label: "Caption" },
        width: {
          type: "select",
          label: "Width",
          options: [
            { label: "Full", value: "full" },
            { label: "Narrow", value: "narrow" },
          ],
        },
        rounded: {
          type: "select",
          label: "Rounded corners",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
      },
      defaultProps: { image: "", alt: "", caption: "", width: "full", rounded: "yes" },
      render: ({ image, alt, caption, width, rounded }) => (
        <Photo image={image} alt={alt} caption={caption} width={width} rounded={rounded} />
      ),
    },
    Gallery: {
      label: "Gallery",
      fields: {
        images: {
          type: "array",
          label: "Photos",
          arrayFields: { image: photoField, alt: altField },
          defaultItemProps: { image: "", alt: "" },
          getItemSummary: (item, index) => item.alt || `Photo ${(index ?? 0) + 1}`,
        },
        columns: columnsField,
      },
      defaultProps: { images: [], columns: "3" },
      render: ({ images, columns }) => <Gallery images={images} columns={columns} />,
    },
    Video: {
      label: "YouTube video",
      fields: {
        url: { type: "text", label: "YouTube link" },
        title: { type: "text", label: "Video title" },
      },
      defaultProps: { url: "", title: "" },
      render: ({ url, title }) => <Video url={url} title={title} />,
    },
    Map: {
      label: "Map",
      fields: {
        label: { type: "text", label: "Place name" },
        address: { type: "textarea", label: "Address" },
      },
      defaultProps: { label: "", address: "" },
      render: ({ address, label }) => <MapCard address={address} label={label} />,
    },

    // ---------- Content ----------
    Cards: {
      label: "Cards",
      fields: {
        items: {
          type: "array",
          label: "Cards",
          arrayFields: {
            image: photoField,
            alt: altField,
            title: { type: "text", label: "Title" },
            text: richText("Text"),
            href: { type: "text", label: "Link" },
            linkLabel: { type: "text", label: "Link label" },
          },
          defaultItemProps: { image: "", alt: "", title: "Title", text: "", href: "", linkLabel: "" },
          getItemSummary: (item) => item.title || "Card",
        },
        columns: columnsField,
      },
      defaultProps: {
        items: [{ image: "", alt: "", title: "Title", text: "<p>Short text.</p>", href: "", linkLabel: "" }],
        columns: "3",
      },
      render: ({ items, columns }) => <Cards items={items} columns={columns} />,
    },
    Features: {
      label: "Features",
      fields: {
        items: {
          type: "array",
          label: "Items",
          arrayFields: {
            title: { type: "text", label: "Title" },
            text: richText("Text"),
          },
          defaultItemProps: { title: "Title", text: "" },
          getItemSummary: (item) => item.title || "Item",
        },
        columns: columnsField,
      },
      defaultProps: { items: [{ title: "Title", text: "<p>Short text.</p>" }], columns: "3" },
      render: ({ items, columns }) => <Features items={items} columns={columns} />,
    },
    Testimonial: {
      label: "Testimonial",
      fields: {
        quote: richText("Quote"),
        name: { type: "text", label: "Name" },
        role: { type: "text", label: "Role" },
        photo: photoField,
        alt: altField,
      },
      defaultProps: { quote: "<p>Testimony text.</p>", name: "", role: "", photo: "", alt: "" },
      render: ({ quote, name, role, photo, alt }) => (
        <Testimonial quote={quote} name={name} role={role} photo={photo} alt={alt} />
      ),
    },
    People: {
      label: "People",
      fields: {
        items: {
          type: "array",
          label: "People",
          arrayFields: {
            photo: photoField,
            alt: altField,
            // Site policy: first names only. Puck 0.23 fields have no help
            // text, so the rule rides on the placeholder.
            name: { type: "text", label: "Name", placeholder: "First name only." },
            role: { type: "text", label: "Role" },
          },
          defaultItemProps: { photo: "", alt: "", name: "", role: "" },
          getItemSummary: (item) => item.name || "Person",
        },
        columns: {
          type: "select",
          label: "Columns",
          options: [
            { label: "2", value: "2" },
            { label: "3", value: "3" },
            { label: "4", value: "4" },
          ],
        },
        shape: {
          type: "select",
          label: "Photo shape",
          options: [
            { label: "Round", value: "round" },
            { label: "Portrait (4:5)", value: "portrait" },
          ],
        },
      },
      defaultProps: { items: [], columns: "3", shape: "round" },
      render: ({ items, columns, shape }) => <People items={items} columns={columns} shape={shape} />,
    },
    FAQ: {
      label: "FAQ",
      fields: {
        items: {
          type: "array",
          label: "Questions",
          arrayFields: {
            question: { type: "text", label: "Question" },
            answer: richText("Answer"),
          },
          defaultItemProps: { question: "Question", answer: "" },
          getItemSummary: (item) => item.question || "Question",
        },
      },
      defaultProps: { items: [{ question: "Question", answer: "<p>Answer.</p>" }] },
      render: ({ items }) => <FAQ items={items} />,
    },
    InfoList: {
      label: "Info list",
      fields: {
        heading: { type: "text", label: "Heading" },
        items: {
          type: "array",
          label: "Items",
          arrayFields: {
            label: { type: "text", label: "Label" },
            value: { type: "text", label: "Value" },
          },
          defaultItemProps: { label: "Label", value: "Value" },
          getItemSummary: (item) => item.label || "Item",
        },
      },
      defaultProps: { heading: "Details", items: [{ label: "Label", value: "Value" }] },
      render: ({ heading, items }) => <InfoList heading={heading} items={items} />,
    },

    // ---------- Actions ----------
    Button: {
      label: "Button",
      fields: {
        label: { type: "text", label: "Label", contentEditable: true },
        href: { type: "text", label: "Link" },
        style: buttonStyleField,
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Normal", value: "normal" },
            { label: "Large", value: "large" },
          ],
        },
        align: alignField,
      },
      defaultProps: { label: "Learn more", href: "", style: "primary", size: "normal", align: "center" },
      render: ({ label, href, style, size, align }) => (
        <Button label={label} href={href} style={style} size={size} align={align} />
      ),
    },
    Buttons: {
      label: "Button group",
      fields: {
        items: {
          type: "array",
          label: "Buttons",
          arrayFields: {
            label: { type: "text", label: "Label", contentEditable: true },
            href: { type: "text", label: "Link" },
            style: buttonStyleField,
          },
          defaultItemProps: { label: "Button", href: "", style: "secondary" },
          getItemSummary: (item) => item.label || "Button",
        },
        align: alignField,
      },
      defaultProps: {
        items: [
          { label: "Button", href: "", style: "primary" },
          { label: "Button", href: "", style: "secondary" },
        ],
        align: "center",
      },
      render: ({ items, align }) => <Buttons items={items} align={align} />,
    },
    SocialLinks: {
      label: "Social links",
      fields: {
        items: {
          type: "array",
          label: "Links",
          arrayFields: {
            platform: {
              type: "select",
              label: "Platform",
              options: Object.entries(PLATFORM_NAMES).map(([value, label]) => ({ label, value })),
            },
            url: { type: "text", label: "Link" },
          },
          defaultItemProps: { platform: "facebook", url: "" },
          getItemSummary: (item) => PLATFORM_NAMES[item.platform] ?? "Link",
        },
      },
      defaultProps: { items: [{ platform: "facebook", url: "" }] },
      render: ({ items }) => <SocialLinks items={items} />,
    },
  },
};

// Dev-only: no key may sit in two categories, and no category may name a missing component.
if (process.env.NODE_ENV !== "production") {
  const listed = Object.values(categories).flatMap((category) => [...category.components]);
  const duplicate = listed.find((name, index) => listed.indexOf(name) !== index);
  const unknown = listed.find((name) => !(name in config.components));
  if (duplicate || unknown) {
    throw new Error(`puck.config categories invalid: ${duplicate ? `"${duplicate}" listed twice` : `"${unknown}" not a component`}`);
  }
}
