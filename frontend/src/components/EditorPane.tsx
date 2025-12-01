// frontend/src/components/EditorPane.tsx
import React, { useMemo, useRef } from 'react'
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

const generateRainbowText = (text: string) => {
  const result: React.ReactNode[] = [];
  let buffer = '';
  let i = 0;
  
  let inCodeBlock = false; 
  let inInlineCode = false; 
  let inBlockMath = false; 
  let inInlineMath = false; 
  let inLatexBlock = false; 
  
  let mathDepth = 0;
  const colors = ['text-yellow-400', 'text-blue-400', 'text-pink-400', 'text-green-400'];

  const flush = (key: string | number) => {
    if (buffer) {
      result.push(<span key={key + '_buf'} className="text-content-primary">{buffer}</span>);
      buffer = '';
    }
  };

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1] || '';
    
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
        if (char === '{') {
            flush(i);
            const colorClass = colors[mathDepth % colors.length];
            result.push(<span key={i} className={`${colorClass} font-bold`}>{char}</span>);
            mathDepth++;
            i++;
            continue;
        } else if (char === '}') {
            flush(i);
            mathDepth = Math.max(0, mathDepth - 1);
            const colorClass = colors[mathDepth % colors.length];
            result.push(<span key={i} className={`${colorClass} font-bold`}>{char}</span>);
            i++;
            continue;
        }
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
  const rainbowContent = useMemo(() => generateRainbowText(text), [text]);

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
  };

  const stats = useMemo(() => {
    const lines = text.split('\n').length;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    return { lines, words, chars };
  }, [text]);

  return (
    <div className="h-full w-full flex flex-col bg-surface-base relative group overflow-hidden">
      
      <div className="absolute top-2 right-4 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[10px] font-bold text-content-muted bg-surface-panel/80 px-2 py-1 rounded uppercase tracking-widest backdrop-blur-sm">
          Editor
        </span>
      </div>

      <div className="relative flex-1 w-full h-full overflow-hidden">
        
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
          className="absolute inset-0 m-0 w-full h-full bg-transparent pointer-events-none scrollbar-none overflow-hidden"
          style={commonStyles}
        >
          {rainbowContent}
          <br /> 
        </pre>

        <textarea
          ref={editorRef}
          onScroll={handleScroll} 
          onKeyDown={onKeyDown}
          // (FIXED) 加上 rainbow-editor-input class，讓 styles.css 可以針對它做特殊反白處理
          className="rainbow-editor-input absolute inset-0 w-full h-full resize-none bg-transparent caret-content-primary outline-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-elevated/50 hover:scrollbar-thumb-surface-elevated text-transparent"
          style={{
            ...commonStyles,
            color: 'transparent',
            backgroundColor: 'transparent',
          }}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder="" 
        />
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