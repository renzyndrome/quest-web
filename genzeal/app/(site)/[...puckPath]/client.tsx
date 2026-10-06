"use client";

import { useMemo } from "react";
import { Render, type Data } from "@puckeditor/core";
import { upgradeLegacyRichText } from "@/lib/richtext";
import { config } from "@/puck.config";

export function Client({ data }: { data: Data }) {
  const upgraded = useMemo(() => upgradeLegacyRichText(data, config), [data]);
  return <Render config={config} data={upgraded} />;
}
