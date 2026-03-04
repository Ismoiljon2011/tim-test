import { useEffect, useRef, useState, useCallback } from 'react';
import katex from 'katex';

interface MathRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

export function MathRenderer({ latex, displayMode = false, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      const hasLatex = /[\\{}^_]|\\[a-zA-Z]+/.test(latex);
      
      if (hasLatex) {
        try {
          katex.render(latex, containerRef.current, {
            displayMode,
            throwOnError: false,
            errorColor: '#cc0000',
            trust: true,
            strict: false,
          });
        } catch {
          containerRef.current.textContent = latex;
        }
      } else {
        containerRef.current.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  if (!latex) return null;

  return (
    <span
      ref={containerRef}
      className={`math-renderer ${className}`}
      style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%', display: 'inline-block' }}
      aria-label={latex}
    />
  );
}

// Math symbols for the visual editor
export const mathSymbols = {
  basic: [
    { label: '+', latex: ' + ', category: 'basic' },
    { label: '−', latex: ' - ', category: 'basic' },
    { label: '×', latex: ' \\times ', category: 'basic' },
    { label: '÷', latex: ' \\div ', category: 'basic' },
    { label: '=', latex: ' = ', category: 'basic' },
    { label: '≠', latex: ' \\neq ', category: 'basic' },
    { label: '<', latex: ' < ', category: 'basic' },
    { label: '>', latex: ' > ', category: 'basic' },
    { label: '≤', latex: ' \\leq ', category: 'basic' },
    { label: '≥', latex: ' \\geq ', category: 'basic' },
    { label: '±', latex: ' \\pm ', category: 'basic' },
    { label: '∓', latex: ' \\mp ', category: 'basic' },
  ],
  fractions: [
    { label: 'a/b', latex: '\\frac{a}{b}', category: 'fractions' },
    { label: '½', latex: '\\frac{1}{2}', category: 'fractions' },
    { label: '⅓', latex: '\\frac{1}{3}', category: 'fractions' },
    { label: '¼', latex: '\\frac{1}{4}', category: 'fractions' },
  ],
  powers: [
    { label: 'x²', latex: '^{2}', category: 'powers' },
    { label: 'x³', latex: '^{3}', category: 'powers' },
    { label: 'xⁿ', latex: '^{n}', category: 'powers' },
    { label: 'x₁', latex: '_{1}', category: 'powers' },
    { label: 'xₙ', latex: '_{n}', category: 'powers' },
  ],
  roots: [
    { label: '√', latex: '\\sqrt{}', category: 'roots' },
    { label: '∛', latex: '\\sqrt[3]{}', category: 'roots' },
    { label: 'ⁿ√', latex: '\\sqrt[n]{}', category: 'roots' },
  ],
  greek: [
    { label: 'α', latex: '\\alpha ', category: 'greek' },
    { label: 'β', latex: '\\beta ', category: 'greek' },
    { label: 'γ', latex: '\\gamma ', category: 'greek' },
    { label: 'δ', latex: '\\delta ', category: 'greek' },
    { label: 'θ', latex: '\\theta ', category: 'greek' },
    { label: 'λ', latex: '\\lambda ', category: 'greek' },
    { label: 'μ', latex: '\\mu ', category: 'greek' },
    { label: 'π', latex: '\\pi ', category: 'greek' },
    { label: 'σ', latex: '\\sigma ', category: 'greek' },
    { label: 'φ', latex: '\\phi ', category: 'greek' },
    { label: 'ω', latex: '\\omega ', category: 'greek' },
    { label: 'Σ', latex: '\\Sigma ', category: 'greek' },
    { label: 'Π', latex: '\\Pi ', category: 'greek' },
    { label: 'Δ', latex: '\\Delta ', category: 'greek' },
  ],
  calculus: [
    { label: '∫', latex: '\\int ', category: 'calculus' },
    { label: '∂', latex: '\\partial ', category: 'calculus' },
    { label: '∞', latex: '\\infty ', category: 'calculus' },
    { label: 'lim', latex: '\\lim_{x \\to a} ', category: 'calculus' },
    { label: 'Σ', latex: '\\sum_{i=1}^{n} ', category: 'calculus' },
    { label: 'Π', latex: '\\prod_{i=1}^{n} ', category: 'calculus' },
  ],
  sets: [
    { label: '∈', latex: ' \\in ', category: 'sets' },
    { label: '∉', latex: ' \\notin ', category: 'sets' },
    { label: '⊂', latex: ' \\subset ', category: 'sets' },
    { label: '⊃', latex: ' \\supset ', category: 'sets' },
    { label: '∪', latex: ' \\cup ', category: 'sets' },
    { label: '∩', latex: ' \\cap ', category: 'sets' },
    { label: '∅', latex: '\\emptyset ', category: 'sets' },
    { label: '∀', latex: '\\forall ', category: 'sets' },
    { label: '∃', latex: '\\exists ', category: 'sets' },
  ],
  arrows: [
    { label: '→', latex: ' \\rightarrow ', category: 'arrows' },
    { label: '←', latex: ' \\leftarrow ', category: 'arrows' },
    { label: '↔', latex: ' \\leftrightarrow ', category: 'arrows' },
    { label: '⇒', latex: ' \\Rightarrow ', category: 'arrows' },
    { label: '⇐', latex: ' \\Leftarrow ', category: 'arrows' },
    { label: '⇔', latex: ' \\Leftrightarrow ', category: 'arrows' },
  ],
  misc: [
    { label: '°', latex: '^{\\circ}', category: 'misc' },
    { label: '‰', latex: '\\permil ', category: 'misc' },
    { label: '|x|', latex: '|x|', category: 'misc' },
    { label: '⌊x⌋', latex: '\\lfloor x \\rfloor ', category: 'misc' },
    { label: '⌈x⌉', latex: '\\lceil x \\rceil ', category: 'misc' },
    { label: 'log', latex: '\\log ', category: 'misc' },
    { label: 'ln', latex: '\\ln ', category: 'misc' },
    { label: 'sin', latex: '\\sin ', category: 'misc' },
    { label: 'cos', latex: '\\cos ', category: 'misc' },
    { label: 'tan', latex: '\\tan ', category: 'misc' },
  ],
};

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}

export function MathEditor({ value, onChange, placeholder = 'Enter math expression...', compact = false }: MathEditorProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof mathSymbols>('basic');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSymbol = useCallback((latex: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + latex + after;
    
    onChange(newValue);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + latex.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, onChange]);

  const categories = Object.keys(mathSymbols) as (keyof typeof mathSymbols)[];

  return (
    <div className="space-y-2">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-2 py-1 text-xs rounded-md transition-colors capitalize ${
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Symbol buttons */}
      <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-lg">
        {mathSymbols[activeCategory].map((symbol) => (
          <button
            key={symbol.latex}
            type="button"
            onClick={() => insertSymbol(symbol.latex)}
            className="w-8 h-8 flex items-center justify-center text-sm bg-background border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            title={symbol.latex}
          >
            {symbol.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-3 border rounded-lg bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring ${compact ? 'min-h-[60px]' : 'min-h-[100px]'}`}
        style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
      />

      {/* Preview - only for non-compact */}
      {!compact && value && (
        <div className="p-3 bg-muted/30 rounded-lg border overflow-hidden">
          <p className="text-xs text-muted-foreground mb-1">Preview:</p>
          <div className="text-lg overflow-x-auto">
            <MathRenderer latex={value} displayMode />
          </div>
        </div>
      )}
    </div>
  );
}
