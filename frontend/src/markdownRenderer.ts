import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight' // (NEW) 匯入語法高亮外掛
import { visit } from 'unist-util-visit'

const wrapMermaidBlocks = () => (tree: any) => {
  visit(tree, 'code', (node: any, index: number | null, parent: any) => {
    if (!parent || typeof index !== 'number') return
    if (node.lang === 'mermaid') {
      parent.children[index] = {
        type: 'html',
        value: `<div class="mermaid">\n${node.value}\n</div>`,
      }
    }
  })
}

/**
 * (Original) 這是一個 'rehype' 外掛
 * 它會遍歷(visit)所有 HTML 元素 (element)
 * 並將它們在原始 .md 檔案中的行號 (node.position.start.line)
 * 添加為一個 data-line 屬性
 */
const addSourceLines = () => (tree: any) => {
  visit(tree, 'element', (node: any) => { // 只遍歷 element
    if (node.position) {
      if (!node.properties) {
        node.properties = {};
      }
      // 將行號加到 data-line 屬性
      node.properties['data-line'] = node.position.start.line;
    }
  });
};

// ==========================================================
// (NEW) 這是一個新的 'rehype' 外掛
// 它會遍歷所有 <a> 標籤 (連結)
// 並幫它們加上 target="_blank"
// ==========================================================
const addLinkTargetBlank = () => (tree: any) => {
  visit(tree, 'element', (node: any) => {
    if (node.tagName === 'a') {
      if (!node.properties) {
        node.properties = {};
      }
      
      const href = node.properties.href || '';
      
      // 只針對「外部連結」(http/https) 或「非錨點連結」(#)
      if (href.startsWith('http') || !href.startsWith('#')) {
        node.properties.target = '_blank';
        // 加上 'rel' 是為了安全性
        node.properties.rel = 'noopener noreferrer';
      }
    }
  });
};


/**
 * 將 Markdown 算繪為 HTML 字串
 */
export async function renderMarkdownToHTML(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse) // 1. 解析 Markdown
    .use(remarkGfm)  // 2. 支援 GFM (表格, 刪除線等)
    .use(remarkBreaks) // 3. 告訴 remark 把單次換行轉成 <br>
    .use(remarkMath) // 4. 啟用 $...$ 和 $$...$$ 數學語法解析
    .use(wrapMermaidBlocks) // 4.5 處理 mermaid 程式碼區塊
    .use(remarkRehype, { allowDangerousHtml: true }) // 5. 轉成 HTML (hast)
    .use(rehypeKatex) // 6. (FIXED) 先處理 KaTeX 數學公式
    .use(rehypeRaw)  // 7. (FIXED) 再處理 Markdown 中的 <raw_html>
    .use(rehypeHighlight) // 8. (NEW) 執行語法高亮處理
    .use(addLinkTargetBlank) // 9. 幫連結加上 target="_blank"
    .use(addSourceLines) // 10. 加上 data-line 屬性 (這樣 KaTeX 的 <span> 也會有)
    .use(rehypeStringify) // 11. 轉成 HTML 字串
    .process(markdown);

  return String(file);
}
