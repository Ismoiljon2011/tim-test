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
      // Check if the text contains any LaTeX commands or math notation
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
        // Plain text - render as-is without KaTeX
        containerRef.current.textContent = latex;
      }
    }
  }, [latex, displayMode]);

  if (!latex) return null;

  return (
    <span
      ref={containerRef}
      className={`math-renderer ${className}`}
      aria-label={latex}
    />
  );
}

// Math symbols for the visual editor
export const mathSymbols = {
  basic: [
    { label: '+', latex: '+', category: 'basic' },
    { label: '−', latex: '-', category: 'basic' },
    { label: '×', latex: '\\times', category: 'basic' },
    { label: '÷', latex: '\\div', category: 'basic' },
    { label: '=', latex: '=', category: 'basic' },
    { label: '≠', latex: '\\neq', category: 'basic' },
    { label: '<', latex: '<', category: 'basic' },
    { label: '>', latex: '>', category: 'basic' },
    { label: '≤', latex: '\\leq', category: 'basic' },
    { label: '≥', latex: '\\geq', category: 'basic' },
    { label: '±', latex: '\\pm', category: 'basic' },
    { label: '∓', latex: '\\mp', category: 'basic' },
  ],
  fractions: [
    { label: 'a/b', latex: '\\frac{a}{b}', category: 'fractions' },
    { label: '½', latex: '\\frac{1}{2}', category: 'fractions' },
    { label: '⅓', latex: '\\frac{1}{3}', category: 'fractions' },
    { label: '¼', latex: '\\frac{1}{4}', category: 'fractions' },
  ],
  powers: [
    { label: 'x²', latex: 'x^{2}', category: 'powers' },
    { label: 'x³', latex: 'x^{3}', category: 'powers' },
    { label: 'xⁿ', latex: 'x^{n}', category: 'powers' },
    { label: 'x₁', latex: 'x_{1}', category: 'powers' },
    { label: 'xₙ', latex: 'x_{n}', category: 'powers' },
  ],
  roots: [
    { label: '√', latex: '\\sqrt{x}', category: 'roots' },
    { label: '∛', latex: '\\sqrt[3]{x}', category: 'roots' },
    { label: 'ⁿ√', latex: '\\sqrt[n]{x}', category: 'roots' },
  ],
  greek: [
    { label: 'α', latex: '\\alpha', category: 'greek' },
    { label: 'β', latex: '\\beta', category: 'greek' },
    { label: 'γ', latex: '\\gamma', category: 'greek' },
    { label: 'δ', latex: '\\delta', category: 'greek' },
    { label: 'θ', latex: '\\theta', category: 'greek' },
    { label: 'λ', latex: '\\lambda', category: 'greek' },
    { label: 'μ', latex: '\\mu', category: 'greek' },
    { label: 'π', latex: '\\pi', category: 'greek' },
    { label: 'σ', latex: '\\sigma', category: 'greek' },
    { label: 'φ', latex: '\\phi', category: 'greek' },
    { label: 'ω', latex: '\\omega', category: 'greek' },
    { label: 'Σ', latex: '\\Sigma', category: 'greek' },
    { label: 'Π', latex: '\\Pi', category: 'greek' },
    { label: 'Δ', latex: '\\Delta', category: 'greek' },
  ],
  calculus: [
    { label: '∫', latex: '\\int', category: 'calculus' },
    { label: '∂', latex: '\\partial', category: 'calculus' },
    { label: '∞', latex: '\\infty', category: 'calculus' },
    { label: 'lim', latex: '\\lim_{x \\to a}', category: 'calculus' },
    { label: 'Σ', latex: '\\sum_{i=1}^{n}', category: 'calculus' },
    { label: 'Π', latex: '\\prod_{i=1}^{n}', category: 'calculus' },
  ],
  sets: [
    { label: '∈', latex: '\\in', category: 'sets' },
    { label: '∉', latex: '\\notin', category: 'sets' },
    { label: '⊂', latex: '\\subset', category: 'sets' },
    { label: '⊃', latex: '\\supset', category: 'sets' },
    { label: '∪', latex: '\\cup', category: 'sets' },
    { label: '∩', latex: '\\cap', category: 'sets' },
    { label: '∅', latex: '\\emptyset', category: 'sets' },
    { label: '∀', latex: '\\forall', category: 'sets' },
    { label: '∃', latex: '\\exists', category: 'sets' },
  ],
  arrows: [
    { label: '→', latex: '\\rightarrow', category: 'arrows' },
    { label: '←', latex: '\\leftarrow', category: 'arrows' },
    { label: '↔', latex: '\\leftrightarrow', category: 'arrows' },
    { label: '⇒', latex: '\\Rightarrow', category: 'arrows' },
    { label: '⇐', latex: '\\Leftarrow', category: 'arrows' },
    { label: '⇔', latex: '\\Leftrightarrow', category: 'arrows' },
  ],
  misc: [
    { label: '°', latex: '^{\\circ}', category: 'misc' },
    { label: '‰', latex: '\\permil', category: 'misc' },
    { label: '|x|', latex: '|x|', category: 'misc' },
    { label: '⌊x⌋', latex: '\\lfloor x \\rfloor', category: 'misc' },
    { label: '⌈x⌉', latex: '\\lceil x \\rceil', category: 'misc' },
    { label: 'log', latex: '\\log', category: 'misc' },
    { label: 'ln', latex: '\\ln', category: 'misc' },
    { label: 'sin', latex: '\\sin', category: 'misc' },
    { label: 'cos', latex: '\\cos', category: 'misc' },
    { label: 'tan', latex: '\\tan', category: 'misc' },
  ],
};

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MathEditor({ value, onChange, placeholder = 'Enter math expression...' }: MathEditorProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof mathSymbols>('basic');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertSymbol = useCallback((latex: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    // Add a space before the symbol if the previous character is not a space/empty
    const before = value.substring(0, start);
    const after = value.substring(end);
    const needsSpaceBefore = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
    const needsSpaceAfter = after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n');
    const insertion = (needsSpaceBefore ? ' ' : '') + latex + (needsSpaceAfter ? ' ' : '');
    const newValue = before + insertion + after;
    
    onChange(newValue);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + insertion.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, onChange]);

  const categories = Object.keys(mathSymbols) as (keyof typeof mathSymbols)[];

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors capitalize ${
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
      <div className="flex flex-wrap gap-1.5 p-3 bg-muted/50 rounded-lg">
        {mathSymbols[activeCategory].map((symbol) => (
          <button
            key={symbol.latex}
            type="button"
            onClick={() => insertSymbol(symbol.latex)}
            className="w-10 h-10 flex items-center justify-center text-lg bg-background border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            title={symbol.latex}
          >
            {symbol.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[100px] p-3 border rounded-lg bg-background font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring break-all overflow-wrap-anywhere"
        />
      </div>

      {/* Preview */}
      {value && (
        <div className="p-4 bg-muted/30 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
          <div className="text-lg">
            <MathRenderer latex={value} displayMode />
          </div>
        </div>
      )}
    </div>
  );
}
