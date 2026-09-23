/*
  Title to URL slug. Its own module because the admin's SlugInput is a client
  component: importing it from slugField.ts would drag the server-side field
  config, and its payload.find() hook, into the browser bundle.
*/

/** "Isang dekada ng katapatan!" -> "isang-dekada-ng-katapatan" */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    // Strip diacritics so "Biñan" becomes "binan", not "bian".
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}
