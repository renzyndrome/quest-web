/* Payload admin root layout — generated glue, keep as-is. */
import type { ServerFunctionClient } from 'payload';
import config from '@payload-config';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import { importMap } from './admin/importMap';

import '@payloadcms/next/css';
// Admin tweaks — gives rich-text fields a comfortable writing area.
import './custom.css';

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;
