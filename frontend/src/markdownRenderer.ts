// src/markdownRenderer.ts
// Markdown -> HTML renderer (tables + math)
//  - GitHub-style markdown extensions (tables, strikethrough) via remark-gfm
//  - Math ($...$, $$...$$) via remark-math + rehype-katex
//  - Output: HTML string (not sanitized yet; consider rehype-sanitize if exposing publicly)

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'

export async function renderMarkdownToHTML(src: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)     // Parse markdown
    .use(remarkMath)      // $...$ and $$...$$
    .use(remarkGfm)       // tables, strikethrough, task list, etc.
    .use(remarkRehype)    // mdast -> hast (HTML AST)
    .use(rehypeKatex)     // render math to KaTeX HTML
    .use(rehypeStringify) // hast -> HTML string
    .process(src)

  return String(file.value)
}
