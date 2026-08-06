/*
  Minimal Lexical document builders for seeding.

  Payload stores rich text as Lexical JSON. Seed scripts author plain
  paragraphs, so this keeps the verbose node shape in one place rather than
  scattering it through content data.
*/

interface TextNode {
  type: 'text';
  detail: number;
  format: number;
  mode: 'normal';
  style: string;
  text: string;
  version: number;
}

function textNode(text: string): TextNode {
  return { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 };
}

function paragraphNode(text: string) {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    textFormat: 0,
    children: [textNode(text)],
  };
}

/** Build a Lexical editor state from one paragraph per string. */
export function lexicalDoc(paragraphs: readonly string[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: paragraphs.map(paragraphNode),
    },
  };
}
