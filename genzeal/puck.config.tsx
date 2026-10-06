import type { Config } from "@puckeditor/core";
import { Button, type ButtonProps } from "@/blocks/Button";
import { Hero, type HeroProps } from "@/blocks/Hero";
import { InfoList, type InfoListProps } from "@/blocks/InfoList";
import { Photo, type PhotoProps } from "@/blocks/Photo";
import { Text, type TextProps } from "@/blocks/Text";
import { Video, type VideoProps } from "@/blocks/Video";
import { ImageField } from "@/components/ImageField";

type Props = {
  Hero: HeroProps;
  Text: TextProps;
  Photo: PhotoProps;
  Video: VideoProps;
  Button: ButtonProps;
  InfoList: InfoListProps;
};

type RootProps = { title: string; description: string };

const photoField = { type: "custom", label: "Photo", render: ImageField } as const;

export const config: Config<Props, RootProps> = {
  root: {
    fields: {
      title: { type: "text", label: "Title" },
      description: { type: "textarea", label: "Description" },
    },
  },
  components: {
    Hero: {
      label: "Hero",
      fields: {
        title: { type: "text", label: "Title" },
        subtitle: { type: "textarea", label: "Subtitle" },
        image: photoField,
        alt: { type: "text", label: "Photo description" },
      },
      defaultProps: { title: "GenZeal", subtitle: "", image: "", alt: "" },
      render: (props) => <Hero {...props} />,
    },
    Text: {
      label: "Text",
      fields: {
        heading: { type: "text", label: "Heading" },
        body: { type: "textarea", label: "Body" },
        tone: {
          type: "select",
          label: "Background",
          options: [
            { label: "White", value: "white" },
            { label: "Cream", value: "cream" },
          ],
        },
      },
      defaultProps: { heading: "Heading", body: "Body text.", tone: "white" },
      render: (props) => <Text {...props} />,
    },
    Photo: {
      label: "Photo",
      fields: {
        image: photoField,
        alt: { type: "text", label: "Photo description" },
        caption: { type: "text", label: "Caption" },
      },
      defaultProps: { image: "", alt: "", caption: "" },
      render: (props) => <Photo {...props} />,
    },
    Video: {
      label: "Video",
      fields: {
        url: { type: "text", label: "YouTube link" },
        title: { type: "text", label: "Video title" },
      },
      defaultProps: { url: "", title: "" },
      render: (props) => <Video {...props} />,
    },
    Button: {
      label: "Button",
      fields: {
        label: { type: "text", label: "Label" },
        href: { type: "text", label: "Link" },
        style: {
          type: "select",
          label: "Style",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
          ],
        },
      },
      defaultProps: { label: "Learn more", href: "", style: "primary" },
      render: (props) => <Button {...props} />,
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
      render: (props) => <InfoList {...props} />,
    },
  },
};
