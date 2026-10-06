"use client";

import { useMemo } from "react";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { upgradeLegacyRichText } from "@/lib/richtext";
import { config } from "@/puck.config";

export function Client({ path, data }: { path: string; data: Data }) {
  // Plain-text bodies from before rich text open as proper paragraphs.
  const upgraded = useMemo(() => upgradeLegacyRichText(data, config), [data]);
  return (
    <Puck
      config={config}
      data={upgraded}
      headerTitle="GenZeal"
      headerPath={path}
      onPublish={async (published) => {
        try {
          const response = await fetch("/api/puck", {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: published, path }),
          });
          if (!response.ok) throw new Error(`Publish failed with status ${response.status}`);
        } catch (error) {
          console.error(error);
          alert("Publish failed. Try again.");
        }
      }}
    />
  );
}
