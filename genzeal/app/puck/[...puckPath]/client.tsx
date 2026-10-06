"use client";

import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { config } from "@/puck.config";

export function Client({ path, data }: { path: string; data: Data }) {
  return (
    <Puck
      config={config}
      data={data}
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
