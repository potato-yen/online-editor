import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight' 
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

const addSourceLines = () => (tree: any) => {
  visit(tree, 'element', (node: any) => { 
    if (node.position) {
      if (!node.properties) {
        node.properties = {};
      }
      node.properties['data-line'] = node.position.start.line;
    }
  });
};

const addLinkTargetBlank = () => (tree: any) => {
  visit(tree, 'element', (node: any) => {
    if (node.tagName === 'a') {
      if (!node.properties) {
        node.properties = {};
      }
      
      const href = node.properties.href || '';
      
      if (href.startsWith('http') || !href.startsWith('#')) {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }
    }
  });
};

// [NEW] 預處理器：修正列表縮排問題
// 將 2 空白縮排的列表項目，在渲染前轉換為 4 空白，以符合 CommonMark 標準
const preprocessMarkdown = (markdown: string): string => {
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  
  return lines.map(line => {
    // 1. 偵測程式碼區塊 (``` 或 ~~~)，避免誤改程式碼內的縮排
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    
    // 如果在程式碼區塊內，直接回傳原樣
    if (inCodeBlock) return line;

    // 2. 偵測列表項目 (List Item)
    // Regex 解釋:
    // ^(\s+)       -> 開頭必須有空白 (Group 1)
    // ([-*+]|\d+\.) -> 接著是列表符號 (-, *, +) 或 數字加點 (1.)
    // \s           -> 接著必須有一個空白
    const listRegex = /^(\s+)([-*+]|\d+\.)\s/;
    const match = line.match(listRegex);
    
    if (match) {
      const indent = match[1];
      // 策略：將偵測到的縮排「加倍」
      // 2 spaces (Tab=2) -> 變成 4 spaces (符合標準巢狀)
      // 4 spaces (Tab=4) -> 變成 8 spaces (依然是巢狀)
      return line.replace(indent, indent.repeat(2));
    }
    
    return line;
  }).join('\n');
};

/**
 * 將 Markdown 算繪為 HTML 字串
 */
export async function renderMarkdownToHTML(markdown: string): Promise<string> {
  // [MODIFIED] 先進行預處理，修正縮排
  const processedMarkdown = preprocessMarkdown(markdown);

  const file = await unified()
    .use(remarkParse) 
    .use(remarkGfm)  
    .use(remarkBreaks) 
    .use(remarkMath) 
    .use(wrapMermaidBlocks) 
    .use(remarkRehype, { allowDangerousHtml: true }) 
    .use(rehypeKatex) 
    .use(rehypeRaw)  
    .use(rehypeHighlight) 
    .use(addLinkTargetBlank) 
    .use(addSourceLines) 
    .use(rehypeStringify) 
    .process(processedMarkdown); // 使用處理後的文字進行渲染

  return String(file);
}