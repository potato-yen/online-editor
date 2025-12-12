// frontend/src/components/EditorPane.tsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import type { Mode } from '../types'

interface EditorPaneProps {
  mode: Mode
  text: string
  onTextChange: (newText: string) => void
  editorRef: React.RefObject<HTMLTextAreaElement>
  onScroll: (e: React.UIEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  fontSize: number
  wordWrap: boolean
}

// [HELPER] 尋找配對括號的函式
const findMatchingBracket = (text: string, cursorPos: number): [number, number] | null => {
  const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
  const revPairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  
  const isValid = (i: number) => i >= 0 && i < text.length;

  const scan = (start: number, open: string, close: string, step: 1 | -1): number | null => {
    let depth = 1;
    let i = start + step;
    while (isValid(i)) {
      const char = text[i];
      if (char === open) {
        depth++;
      } else if (char === close) {
        depth--;
        if (depth === 0) return i;
      }
      i += step;
    }
    return null;
  };

  // [NEW] 檢查是否為 Task List 的 checkbox [ ] 或 [x]
  // 這些通常會觸發字型連字 (Ligatures)，如果因為游標靠近而觸發高亮，會將括號拆成不同 span，
  // 導致連字失效，進而造成 pre (顯示層) 與 textarea (輸入層) 的寬度不一致，讓編輯區跳動。
  // 解決方案：針對這類 pattern 不進行括號高亮，保持 DOM 結構簡單，確保寬度一致。
  const isCheckbox = (idx1: number, idx2: number) => {
      const start = Math.min(idx1, idx2);
      const end = Math.max(idx1, idx2);
      // [ ] 長度為 3 (idx 0, 1, 2)
      // 容許 [ ], [x], [X], [?] 等短內容
      if (end - start > 2) return false; 
      
      const content = text.slice(start, end + 1);
      return /^\[[\s\dxX\?]?\]$/.test(content);
  };

  let targetIndex = cursorPos;
  let char = text[targetIndex];
  
  // 1. 檢查游標當前位置
  if (pairs[char]) { 
    const match = scan(targetIndex, char, pairs[char], 1);
    if (match !== null && !isCheckbox(targetIndex, match)) return [targetIndex, match];
  } else if (revPairs[char]) { 
    const match = scan(targetIndex, char, revPairs[char], -1);
    if (match !== null && !isCheckbox(match, targetIndex)) return [match, targetIndex];
  }

  // 2. 檢查游標前一個位置 (讓使用者打完括號後也能看到高亮)
  targetIndex = cursorPos - 1;
  if (isValid(targetIndex)) {
    char = text[targetIndex];
    if (pairs[char]) {
      const match = scan(targetIndex, char, pairs[char], 1);
      if (match !== null && !isCheckbox(targetIndex, match)) return [targetIndex, match];
    } else if (revPairs[char]) {
      const match = scan(targetIndex, char, revPairs[char], -1);
      if (match !== null && !isCheckbox(match, targetIndex)) return [match, targetIndex];
    }
  }

  return null;
};

// [HELPER] 產生帶有彩虹括號與匹配高亮的 DOM
const generateRainbowText = (text: string, highlightIndices: Set<number>) => {
  const result: React.ReactNode[] = [];
  let buffer = '';
  let i = 0;
  
  let inCodeBlock = false; 
  let inInlineCode = false; 
  let inBlockMath = false; 
  let inInlineMath = false; 
  let inLatexBlock = false; 
  
  let mathDepth = 0;
  
  const colors = [
    'text-yellow-400',
    'text-pink-400',
    'text-cyan-400',
    'text-green-400',
    'text-orange-400',
    'text-purple-400',
    'text-blue-400',
  ];

  const highlightClass = "bg-white/20 outline outline-1 outline-white/30 rounded-[1px]";

  const flush = (key: string | number) => {
    if (buffer) {
      result.push(<span key={key + '_buf'} className="text-content-primary">{buffer}</span>);
      buffer = '';
    }
  };

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1] || '';
    
    const isHighlighted = highlightIndices.has(i);
    // [NOTE] 這裡已經移除了 font-bold，避免寬度變化
    const extraClass = isHighlighted ? highlightClass : '';

    if (char === '\\') {
      if (!inCodeBlock && !inInlineCode && !inBlockMath && !inInlineMath && nextChar === '[') {
         flush(i);
         inLatexBlock = true;
         buffer += '\\[';
         i += 2;
         continue;
      }
      if (inLatexBlock && nextChar === ']') {
         flush(i);
         inLatexBlock = false;
         mathDepth = 0;
         buffer += '\\]';
         i += 2;
         continue;
      }
      buffer += char + nextChar;
      i += 2;
      continue;
    }

    if (text.startsWith('```', i)) {
        if (!inBlockMath && !inInlineMath && !inLatexBlock && !inInlineCode) {
            inCodeBlock = !inCodeBlock;
        }
        buffer += '```';
        i += 3;
        continue;
    }
    if (inCodeBlock) {
        buffer += char;
        i++;
        continue;
    }

    if (char === '`') {
        if (!inBlockMath && !inInlineMath && !inLatexBlock) {
            inInlineCode = !inInlineCode;
        }
        buffer += char;
        i++;
        continue;
    }
    if (inInlineCode) {
        buffer += char;
        i++;
        continue;
    }

    if (text.startsWith('$$', i)) {
        if (!inInlineMath && !inLatexBlock) {
            flush(i);
            result.push(<span key={i + '_math_tag'} className="text-brand-DEFAULT">$$</span>);
            inBlockMath = !inBlockMath;
            mathDepth = 0;
            i += 2;
            continue;
        }
    }

    if (char === '$') {
        if (!inBlockMath && !inLatexBlock) {
            flush(i);
            result.push(<span key={i + '_math_tag'} className="text-brand-DEFAULT">$</span>);
            inInlineMath = !inInlineMath;
            mathDepth = 0;
            i += 2;
            continue;
        }
    }

    if (inBlockMath || inInlineMath || inLatexBlock) {
        if (char === '{' || char === '(' || char === '[') {
            flush(i);
            const colorClass = colors[mathDepth % colors.length];
            result.push(
                <span key={i} className={`${colorClass} ${extraClass}`}>
                    {char}
                </span>
            );
            if (char === '{') mathDepth++; 
            i++;
            continue;
        } else if (char === '}' || char === ')' || char === ']') {
            flush(i);
            if (char === '}') mathDepth = Math.max(0, mathDepth - 1);
            const colorClass = colors[mathDepth % colors.length];
            result.push(
                <span key={i} className={`${colorClass} ${extraClass}`}>
                    {char}
                </span>
            );
            i++;
            continue;
        }
    }

    if (isHighlighted) {
        flush(i);
        result.push(
            <span key={i} className={`text-content-primary ${extraClass}`}>
                {char}
            </span>
        );
        i++;
        continue;
    }

    buffer += char;
    i++;
  }
  flush('end');
  return result;
};

export default function EditorPane({
  mode,
  text,
  onTextChange,
  editorRef,
  onScroll,
  onKeyDown,
  fontSize,
  wordWrap,
}: EditorPaneProps) {
  
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const [editorWidth, setEditorWidth] = useState<number | undefined>(undefined);
  
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const [highlightIndices, setHighlightIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (cursorPos === null) {
      setHighlightIndices(new Set());
      return;
    }
    const match = findMatchingBracket(text, cursorPos);
    if (match) {
      setHighlightIndices(new Set(match));
    } else {
      setHighlightIndices(new Set());
    }
  }, [cursorPos, text]);

  const rainbowContent = useMemo(
    () => generateRainbowText(text, highlightIndices), 
    [text, highlightIndices]
  );

  const updateCursor = () => {
    if (editorRef.current) {
      setCursorPos(editorRef.current.selectionStart);
    }
  };

  const commonStyles: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    lineHeight: 1.6,
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: 'break-word',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
    padding: '1.5rem', 
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    onScroll(e);
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const stats = useMemo(() => {
    const lines = text.split('\n').length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    return { lines, words, chars };
  }, [text]);

  const measureHeights = useCallback(() => {
    if (!mirrorRef.current) return;
    const lines = mirrorRef.current.children;
    const heights = Array.from(lines).map(el => el.getBoundingClientRect().height);
    setLineHeights(heights);
  }, []);

  useEffect(() => {
    measureHeights();
  }, [text, wordWrap, editorWidth, measureHeights, fontSize]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setEditorWidth(entry.target.clientWidth);
      }
    });
    
    observer.observe(editor);
    return () => observer.disconnect();
  }, [editorRef]);

  const textLines = useMemo(() => text.split('\n'), [text]);

  return (
    <div className="h-full w-full flex flex-col bg-surface-base relative group overflow-hidden">
      
      <div className="absolute top-2 right-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[10px] font-bold text-content-muted bg-surface-panel/80 px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm">
          Editor
        </span>
      </div>

      <div className="relative flex-1 w-full h-full overflow-hidden flex flex-row">
        
        <div
          ref={lineNumbersRef}
          className="shrink-0 text-right select-none bg-surface-layer/30 border-r border-border-base text-content-secondary/50 overflow-hidden"
          style={{
            ...commonStyles,
            width: '3.5rem',
            padding: '1.5rem 0.5rem 1.5rem 0', 
            whiteSpace: 'pre',
            color: undefined, 
            backgroundColor: undefined,
            wordWrap: 'normal',
            wordBreak: 'normal',
          }}
        >
          {textLines.map((_, i) => (
            <div 
              key={i} 
              style={{ 
                height: lineHeights[i] || 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-end'
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="relative flex-1 h-full overflow-hidden">
          {!text && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
              <div className="text-center space-y-4 max-w-md p-6">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-content-primary">
                  Start writing in {mode === 'markdown' ? 'Markdown' : 'LaTeX'}
                </h3>
                <div className="text-sm text-content-secondary space-y-2 text-left bg-surface-panel/50 p-4 rounded-lg border border-border-base">
                  <p>Try these shortcuts:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use the <strong>Toolbar</strong> above for quick actions.</li>
                    <li>Click <strong>Matrix</strong> or <strong>Aligned</strong> to open wizards.</li>
                    <li>Type <code>$$</code> to start a block equation.</li>
                    <li><strong>Select text</strong> then click a button to wrap it.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 h-full bg-transparent pointer-events-none scrollbar-none overflow-hidden"
            style={{
              ...commonStyles,
              width: editorWidth ? `${editorWidth}px` : '100%',
            }}
          >
            {rainbowContent}
            <br /> 
          </pre>

          <textarea
            ref={editorRef}
            onScroll={handleScroll} 
            onKeyDown={(e) => {
                onKeyDown(e);
                updateCursor(); 
            }}
            onSelect={updateCursor}
            onClick={updateCursor}
            onKeyUp={updateCursor}
            className="rainbow-editor-input absolute inset-0 w-full h-full resize-none bg-transparent caret-content-primary outline-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-elevated/50 hover:scrollbar-thumb-surface-elevated text-transparent"
            style={{
              ...commonStyles,
              color: 'transparent',
              backgroundColor: 'transparent',
            }}
            value={text}
            onChange={(e) => {
                onTextChange(e.target.value);
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            placeholder="" 
          />

          <div
            ref={mirrorRef}
            aria-hidden="true"
            style={{
              ...commonStyles,
              width: editorWidth ? `${editorWidth}px` : '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              visibility: 'hidden',
              pointerEvents: 'none',
              height: 'auto', 
              overflow: 'hidden',
              overflowWrap: 'break-word', 
            }}
          >
            {textLines.map((line, i) => (
              <div key={i} style={{ wordBreak: 'break-word' }}>
                {line === '' ? '\u200B' : line} 
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className="h-6 flex items-center justify-end px-4 gap-4 bg-surface-layer border-t border-border-base text-[10px] text-content-muted select-none">
        <span>{stats.lines} Lines</span>
        <span>{stats.words} Words</span>
        <span>{stats.chars} Chars</span>
        <span className="uppercase">{mode}</span>
      </div>
    </div>
  )
}