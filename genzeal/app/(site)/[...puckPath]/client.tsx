"use client";

import { Render, type Data } from "@puckeditor/core";
import { config } from "@/puck.config";

export function Client({ data }: { data: Data }) {
  return <Render config={config} data={data} />;
}
