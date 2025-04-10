import { useState, useEffect, useRef } from 'react';
import { FiBook, FiX, FiCopy, FiSearch, FiCheck } from 'react-icons/fi';
import { marked } from 'marked';
import { useTheme } from '../hooks/useTheme';

// Glossary colors directly match App.tsx
const THEME_COLORS = {
  light: {
    bg: '#ffffff',
    text: '#18181b',
    border: '#e4e4e7',
    bgSecondary: '#f4f4f5',
    codeBg: '#f1f5f9',
    codeText: '#334155',
    link: '#2563eb',
    mutedText: '#71717a',
    headerBg: '#f9fafb',
    success: '#10b981'
  },
  dark: {
    bg: '#18181b',
    text: '#ffffff',
    border: '#3f3f46',
    bgSecondary: '#27272a',
    codeBg: '#1e293b',
    codeText: '#e2e8f0',
    link: '#3b82f6',
    mutedText: '#a1a1aa',
    headerBg: '#27272a',
    success: '#34d399'
  }
};

type GlossaryItem = {
  syntax: string;
  description: string;
  example: string;
  category: 'basic' | 'formatting' | 'lists' | 'links' | 'blocks' | 'extended' | 'tables';
};

const glossaryItems: GlossaryItem[] = [
  // Basic Syntax
  {
    syntax: '# Header 1',
    description: 'Main heading',
    example: '# Main Title',
    category: 'basic'
  },
  {
    syntax: '## Header 2',
    description: 'Subheading',
    example: '## Subtitle',
    category: 'basic'
  },
  {
    syntax: '### Header 3',
    description: 'Section heading',
    example: '### Section Title',
    category: 'basic'
  },
  
  // Formatting
  {
    syntax: '**bold**',
    description: 'Bold text',
    example: '**important text**',
    category: 'formatting'
  },
  {
    syntax: '*italic*',
    description: 'Italic text',
    example: '*emphasized text*',
    category: 'formatting'
  },
  {
    syntax: '~~strikethrough~~',
    description: 'Strikethrough',
    example: '~~deleted text~~',
    category: 'formatting'
  },
  {
    syntax: '**_bold italic_**',
    description: 'Bold and italic',
    example: '**_important emphasized text_**',
    category: 'formatting'
  },
  {
    syntax: '`code`',
    description: 'Inline code',
    example: '`const x = 1`',
    category: 'formatting'
  },
  
  // Lists
  {
    syntax: '- Item',
    description: 'Unordered list',
    example: '- First item\n- Second item\n- Third item',
    category: 'lists'
  },
  {
    syntax: '1. Item',
    description: 'Ordered list',
    example: '1. First item\n2. Second item\n3. Third item',
    category: 'lists'
  },
  {
    syntax: '- [ ] Task',
    description: 'Task list',
    example: '- [ ] Incomplete task\n- [x] Complete task',
    category: 'lists'
  },
  {
    syntax: '- Item\n  - Nested',
    description: 'Nested list',
    example: '- First item\n  - Nested item\n  - Another nested item\n- Second item',
    category: 'lists'
  },
  
  // Links and Images
  {
    syntax: '[Link](url)',
    description: 'Hyperlink',
    example: '[Google](https://google.com)',
    category: 'links'
  },
  {
    syntax: '[Link](url "title")',
    description: 'Link with title',
    example: '[Hover me](https://example.com "Link title")',
    category: 'links'
  },
  {
    syntax: '![Alt](url)',
    description: 'Image',
    example: '![Logo](https://example.com/logo.png)',
    category: 'links'
  },
  {
    syntax: '[![Alt](img-url)](link-url)',
    description: 'Linked image',
    example: '[![Logo](https://example.com/logo.png)](https://example.com)',
    category: 'links'
  },
  
  // Blocks
  {
    syntax: '```\ncode\n```',
    description: 'Code block',
    example: '```javascript\nfunction hello() {\n  return "world";\n}\n```',
    category: 'blocks'
  },
  {
    syntax: '> Quote',
    description: 'Blockquote',
    example: '> This is a blockquote\n> It can span multiple lines',
    category: 'blocks'
  },
  {
    syntax: '---',
    description: 'Horizontal rule',
    example: 'Above\n\n---\n\nBelow',
    category: 'blocks'
  },
  
  // Extended
  {
    syntax: '<details><summary>Title</summary>Content</details>',
    description: 'Collapsible section',
    example: '<details>\n<summary>Click to expand</summary>\n\nHidden content goes here\n</details>',
    category: 'extended'
  },
  {
    syntax: 'Footnote[^1]\n\n[^1]: Note',
    description: 'Footnote',
    example: 'Here is a sentence with a footnote[^1].\n\n[^1]: This is the footnote content.',
    category: 'extended'
  },
  
  // Tables
  {
    syntax: '| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |',
    description: 'Table',
    example: '| Name  | Value |\n| ----- | ----- |\n| Alice | 100   |\n| Bob   | 90    |',
    category: 'tables'
  },
  {
    syntax: '| Left | Center | Right |\n|:-----|:-----:|------:|',
    description: 'Aligned table',
    example: '| Left   | Center | Right |\n|:-------|:------:|------:|\n| Alice  | Bob    | Carol |',
    category: 'tables'
  }
];

// Category display order and labels
const categoryOrder = ['basic', 'formatting', 'lists', 'links', 'blocks', 'tables', 'extended'];
const categoryLabels: Record<string, string> = {
  basic: 'Basic Elements',
  formatting: 'Text Formatting',
  lists: 'Lists',
  links: 'Links & Images',
  blocks: 'Block Elements',
  extended: 'Extended Syntax',
  tables: 'Tables'
};

interface MarkdownGlossaryProps {
  onInsert: (text: string) => void;
}

export function MarkdownGlossary({ onInsert }: MarkdownGlossaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    resolvedTheme === 'dark' ? 'dark' : 'light'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Watch for document theme changes and update internal state
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const htmlElement = document.documentElement;
          const isDark = htmlElement.classList.contains('dark');
          setCurrentTheme(isDark ? 'dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  // Also update when resolvedTheme changes
  useEffect(() => {
    setCurrentTheme(resolvedTheme === 'dark' ? 'dark' : 'light');
  }, [resolvedTheme]);
  
  // Get colors based on current document theme
  const colors = THEME_COLORS[currentTheme];
  
  // Filter and group items by category
  const filteredItems = glossaryItems.filter(item => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return (
      item.syntax.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      categoryLabels[item.category].toLowerCase().includes(lowerQuery)
    );
  });
  
  // Group items by category
  const groupedItems = filteredItems.reduce<Record<string, GlossaryItem[]>>((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {});

  const handleDragStart = (e: React.DragEvent, text: string) => {
    e.dataTransfer.setData('text/plain', text);
  };
  
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };
  
  // Reset active category when search query changes
  useEffect(() => {
    if (searchQuery) {
      setActiveCategory(null);
    } else if (!activeCategory) {
      setActiveCategory('basic');
    }
  }, [searchQuery, activeCategory]);

  return (
    <>
      <button
        onClick={() => {
          if (!isOpen) setActiveCategory('basic');
          setIsOpen(!isOpen);
        }}
        className="fixed right-4 bottom-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
        aria-label={isOpen ? 'Close glossary' : 'Open markdown guide'}
      >
        {isOpen ? <FiX className="w-5 h-5" /> : <FiBook className="w-5 h-5" />}
      </button>

      <div
        ref={containerRef}
        className={`fixed right-4 bottom-20 w-96 max-w-[90vw] max-h-[80vh] rounded-lg shadow-lg transform transition-all duration-200 ease-in-out overflow-hidden z-10 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`
        }}
      >
        <div 
          className="flex justify-between items-center p-3 border-b"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.headerBg
          }}
        >
          <h2 className="text-lg font-semibold" style={{ color: colors.text }}>Markdown Guide</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md hover:bg-opacity-10 hover:bg-black dark:hover:bg-white dark:hover:bg-opacity-10"
            aria-label="Close glossary"
            style={{ color: colors.text }}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-3 border-b" style={{ borderColor: colors.border }}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search markdown syntax..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: colors.bgSecondary,
                color: colors.text,
                border: `1px solid ${colors.border}`
              }}
            />
            <FiSearch 
              className="absolute left-3 top-1/2 transform -translate-y-1/2" 
              style={{ color: colors.mutedText }}
            />
          </div>
        </div>
        
        {!searchQuery && (
          <div 
            className="flex overflow-x-auto py-2 border-b scroll-smooth"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.bgSecondary
            }}
          >
            {categoryOrder.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 text-sm whitespace-nowrap rounded-md mx-1 transition-colors`}
                style={{
                  backgroundColor: activeCategory === category ? colors.bg : 'transparent',
                  color: activeCategory === category ? colors.text : colors.mutedText,
                  boxShadow: activeCategory === category ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[calc(80vh-160px)]" style={{ backgroundColor: colors.bg }}>
          <div className="p-2 space-y-2">
            {searchQuery ? (
              // Show search results
              Object.keys(groupedItems).length > 0 ? (
                Object.keys(groupedItems)
                  .sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b))
                  .map(category => (
                    <div key={category} className="mb-4">
                      <h3 
                        className="text-sm font-medium px-2 mb-2"
                        style={{ color: colors.mutedText }}
                      >
                        {categoryLabels[category]}
                      </h3>
                      {groupedItems[category].map((item, index) => renderGlossaryItem(item, index, category))}
                    </div>
                  ))
              ) : (
                <div className="p-4 text-center" style={{ color: colors.mutedText }}>
                  No results found for "{searchQuery}"
                </div>
              )
            ) : (
              // Show active category
              activeCategory && groupedItems[activeCategory]?.map((item, index) => 
                renderGlossaryItem(item, index, activeCategory)
              )
            )}
          </div>
        </div>

        <style>
          {`
            .glossary-example h1,
            .glossary-example h2,
            .glossary-example h3,
            .glossary-example h4,
            .glossary-example h5,
            .glossary-example h6,
            .glossary-example p,
            .glossary-example ul,
            .glossary-example ol,
            .glossary-example li,
            .glossary-example blockquote {
              color: ${colors.text} !important;
            }
            
            .glossary-example a {
              color: ${colors.link} !important;
            }
            
            .glossary-example pre,
            .glossary-example code {
              background-color: ${colors.codeBg} !important;
              color: ${colors.codeText} !important;
              padding: 0.2em 0.4em;
              border-radius: 0.25rem;
            }
            
            .glossary-example table {
              border-collapse: collapse;
              width: 100%;
            }
            
            .glossary-example th,
            .glossary-example td {
              border: 1px solid ${colors.border} !important;
              padding: 0.25rem 0.5rem;
            }
            
            .glossary-example details summary {
              cursor: pointer;
              color: ${colors.link} !important;
            }
            
            /* Handle horizontal scroll for code blocks */
            .glossary-example pre {
              overflow-x: auto;
              white-space: pre;
              padding: 0.5rem;
            }
          `}
        </style>
      </div>
    </>
  );
  
  function renderGlossaryItem(item: GlossaryItem, index: number, category: string) {
    const itemId = `${category}-${index}`;
    
    return (
      <div
        key={itemId}
        className="p-2 rounded-md transition-colors cursor-pointer hover:border-blue-500"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, item.example)}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <code 
              className="text-xs font-mono px-2 py-0.5 rounded flex-1 mr-2"
              style={{
                backgroundColor: colors.codeBg,
                color: colors.codeText
              }}
            >
              {item.syntax}
            </code>
            <div className="flex items-center gap-1">
              <span className="text-xs mr-1" style={{ color: colors.mutedText }}>
                {item.description}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(item.example, itemId);
                }}
                className="p-1 rounded hover:bg-black hover:bg-opacity-5 dark:hover:bg-white dark:hover:bg-opacity-5"
                title="Copy to clipboard"
              >
                {copiedId === itemId ? (
                  <FiCheck style={{ color: colors.success }} className="w-3.5 h-3.5" />
                ) : (
                  <FiCopy style={{ color: colors.mutedText }} className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <div
            className="text-sm max-w-none border-t pt-1 mt-1"
            style={{ 
              borderColor: colors.border,
              color: colors.text
            }}
          >
            <div 
              className="glossary-example"
              style={{ color: colors.text }}
              dangerouslySetInnerHTML={{
                __html: marked(item.example)
              }}
              onClick={() => onInsert(item.example)}
            />
          </div>
        </div>
      </div>
    );
  }
} 