import { useState, useEffect, useRef, useMemo } from 'react';
import { marked } from 'marked';
import { FiMoon, FiSun, FiDownload, FiMonitor, FiSave, FiBold, FiItalic, FiList, FiLink, FiCode, FiImage, FiMaximize, FiMinimize, FiCheck, FiTrash2, FiHelpCircle, FiInfo } from 'react-icons/fi';
import { useTheme } from './hooks/useTheme';
import { MarkdownGlossary } from './components/MarkdownGlossary';
import './App.css';

// Define theme colors to use directly in components
const THEME_COLORS = {
  light: {
    bg: '#ffffff',
    text: '#18181b',
    border: '#e4e4e7',
    bgSecondary: '#f4f4f5',
    bgHover: '#e4e4e7',
    codeBg: '#f1f5f9',
    codeText: '#334155',
    link: '#2563eb',
    tooltipBg: 'rgba(0, 0, 0, 0.75)',
    tooltipText: '#ffffff'
  },
  dark: {
    bg: '#18181b',
    text: '#ffffff',
    border: '#3f3f46',
    bgSecondary: '#27272a',
    bgHover: '#3f3f46',
    codeBg: '#1e293b',
    codeText: '#e2e8f0',
    link: '#3b82f6',
    tooltipBg: 'rgba(30, 30, 33, 0.95)',
    tooltipText: '#ffffff'
  }
};

// Default welcome markdown text
const DEFAULT_MARKDOWN = `# Welcome to Inkwell

Start writing your markdown here...`;

// Tooltip component for displaying helpful information on hover
interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

function Tooltip({ content, position = 'top', children }: TooltipProps) {
  const [show, setShow] = useState(false);
  const { resolvedTheme } = useTheme();
  const colors = THEME_COLORS[resolvedTheme === 'dark' ? 'dark' : 'light'];
  
  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom': return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left': return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right': return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default: return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };
  
  return (
    <div className="relative inline-flex group" 
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <div 
          className={`absolute z-50 w-64 p-2 rounded shadow-lg pointer-events-none ${getPositionClasses()}`}
          style={{
            backgroundColor: colors.tooltipBg,
            color: colors.tooltipText
          }}
        >
          <div className="text-sm">{content}</div>
          <div 
            className={`absolute w-2 h-2 transform rotate-45 ${
              position === 'top' ? 'top-full -translate-x-1/2 left-1/2 -mt-1' :
              position === 'bottom' ? 'bottom-full -translate-x-1/2 left-1/2 -mb-1' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
              'right-full top-1/2 -translate-y-1/2 -mr-1'
            }`}
            style={{ backgroundColor: colors.tooltipBg }}
          ></div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [markdown, setMarkdown] = useState(() => {
    const saved = localStorage.getItem('inkwell-content');
    return saved || DEFAULT_MARKDOWN;
  });
  const { theme, setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Derive active colors based on current theme
  const colors = useMemo(() => {
    return THEME_COLORS[resolvedTheme === 'dark' ? 'dark' : 'light'];
  }, [resolvedTheme]);

  // Autosave every 5 seconds if changes were made
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('inkwell-content', markdown);
      setLastSaved(new Date());
    }, 5000);
    
    return () => clearInterval(saveInterval);
  }, [markdown]);

  // Initial load timestamp
  useEffect(() => {
    setLastSaved(new Date());
  }, []);

  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
  const characterCount = markdown.length;

  const handleExport = (format: 'md' | 'txt' | 'html') => {
    const content = format === 'html' ? marked(markdown) : markdown;
    const mimeType = format === 'html' ? 'text/html' : format === 'md' ? 'text/markdown' : 'text/plain';
    
    const blob = new Blob([content as BlobPart], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inkwell-document.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleInsert = (text: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = markdown.substring(0, start) + text + markdown.substring(end);
    
    setMarkdown(newText);
    
    // Restore cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = start + text.length;
        textareaRef.current.selectionEnd = start + text.length;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const formatText = (formatType: 'bold' | 'italic' | 'list' | 'link' | 'code' | 'image' | 'h1' | 'h2' | 'h3') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = markdown.substring(start, end);
    let newText = '';
    let cursorOffset = 0;
    
    switch (formatType) {
      case 'bold':
        newText = `**${selectedText}**`;
        cursorOffset = selectedText.length ? 0 : 2;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        cursorOffset = selectedText.length ? 0 : 1;
        break;
      case 'list':
        newText = selectedText ? selectedText.split('\n').map(line => `- ${line}`).join('\n') : '- ';
        cursorOffset = selectedText.length ? 0 : 2;
        break;
      case 'link':
        newText = selectedText ? `[${selectedText}](url)` : '[Link text](url)';
        cursorOffset = selectedText.length ? 1 : 10;
        break;
      case 'code':
        newText = selectedText ? `\`${selectedText}\`` : '``';
        cursorOffset = selectedText.length ? 0 : 1;
        break;
      case 'image':
        newText = `![${selectedText || 'Alt text'}](image-url)`;
        cursorOffset = selectedText.length ? 0 : 11;
        break;
      case 'h1':
        newText = `# ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'h2':
        newText = `## ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'h3':
        newText = `### ${selectedText}`;
        cursorOffset = 4;
        break;
      default:
        newText = selectedText;
    }
    
    const updatedText = markdown.substring(0, start) + newText + markdown.substring(end);
    setMarkdown(updatedText);
    
    // Position cursor correctly
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = selectedText.length ? start + newText.length : start + newText.length - cursorOffset;
        textareaRef.current.selectionStart = newPosition;
        textareaRef.current.selectionEnd = newPosition;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('inkwell-content', markdown);
    setLastSaved(new Date());
    
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setMarkdown(DEFAULT_MARKDOWN);
    localStorage.setItem('inkwell-content', DEFAULT_MARKDOWN);
    setLastSaved(new Date());
    setShowResetConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Ctrl+B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      formatText('bold');
    }
    
    // Ctrl+I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      formatText('italic');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <FiSun className="w-5 h-5" />;
      case 'dark': return <FiMoon className="w-5 h-5" />;
      case 'system': return <FiMonitor className="w-5 h-5" />;
      default: return <FiSun className="w-5 h-5" />;
    }
  };

  // Format time for last save display
  const formatTime = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showThemeMenu && !(event.target as Element).closest('.theme-menu-container')) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showThemeMenu]);

  // Custom prose styles for marked output
  const customStyles = `
    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 { color: ${colors.text}; }
    .prose p, .prose li, .prose blockquote { color: ${colors.text}; }
    .prose a { color: ${colors.link}; }
    .prose pre { background-color: ${colors.codeBg}; color: ${colors.codeText}; }
    .prose code { background-color: ${colors.codeBg}; color: ${colors.codeText}; padding: 0.2em 0.4em; border-radius: 0.25rem; }
    .prose strong, .prose em { color: ${colors.text}; }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <div 
        style={{ 
          backgroundColor: colors.bg,
          color: colors.text,
          borderColor: colors.border,
          transition: "background-color 0.2s ease-in-out, color 0.2s ease-in-out"
        }}
        className={`min-h-screen transition-colors duration-200 ${isFullscreen ? 'fixed inset-0 z-30' : ''}`}
      >
        <div className="container mx-auto px-4 py-4 md:py-8 h-full flex flex-col">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center">
              <Tooltip 
                content="Inkwell - A beautiful, distraction-free Markdown editor that saves your work automatically."
                position="bottom"
              >
                <h1 className="text-2xl font-bold flex items-center">
                  Inkwell
                  <FiInfo className="ml-2 w-4 h-4 text-gray-400" />
                </h1>
              </Tooltip>
              <div className="ml-4 text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
                {lastSaved && (
                  <span>Last saved: {formatTime(lastSaved)}</span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Tooltip content="Save your document. Inkwell also autosaves every 5 seconds.">
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isSaving 
                      ? (theme === 'dark' ? '#065f46' : '#dcfce7') 
                      : colors.bgSecondary,
                    color: isSaving 
                      ? (theme === 'dark' ? '#86efac' : '#065f46') 
                      : colors.text,
                    borderColor: colors.border
                  }}
                  aria-label="Save document"
                >
                  <FiSave className="w-4 h-4" />
                  <span className="hidden sm:inline">{isSaving ? 'Saved!' : 'Save'}</span>
                </button>
              </Tooltip>
              
              <Tooltip content="Reset the editor to its default state. This will remove all your current content.">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                  aria-label="Reset document"
                  title="Clear editor content"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </Tooltip>
              
              <Tooltip content={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode for a distraction-free writing experience"}>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
                </button>
              </Tooltip>
              
              <div className="relative theme-menu-container">
                <Tooltip content="Change the theme of the editor (light, dark, or system)">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowThemeMenu(!showThemeMenu);
                    }}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.text,
                      borderColor: colors.border
                    }}
                    aria-label="Theme options"
                  >
                    {getThemeIcon()}
                  </button>
                </Tooltip>
                {showThemeMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-40 rounded-lg shadow-lg z-10"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <button
                      onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-opacity-10 hover:bg-black dark:hover:bg-white dark:hover:bg-opacity-10 transition-colors relative"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text
                      }}
                    >
                      <FiSun className="w-4 h-4" /> 
                      <span className="flex-1">Light</span>
                      {theme === 'light' && <FiCheck className="w-4 h-4 text-blue-500" />}
                    </button>
                    <button
                      onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-opacity-10 hover:bg-black dark:hover:bg-white dark:hover:bg-opacity-10 transition-colors relative"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text
                      }}
                    >
                      <FiMoon className="w-4 h-4" /> 
                      <span className="flex-1">Dark</span>
                      {theme === 'dark' && <FiCheck className="w-4 h-4 text-blue-500" />}
                    </button>
                    <button
                      onClick={() => { setTheme('system'); setShowThemeMenu(false); }}
                      className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-opacity-10 hover:bg-black dark:hover:bg-white dark:hover:bg-opacity-10 transition-colors relative"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text
                      }}
                    >
                      <FiMonitor className="w-4 h-4" /> 
                      <span className="flex-1">System</span>
                      {theme === 'system' && <FiCheck className="w-4 h-4 text-blue-500" />}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative group">
                <Tooltip content="Export your document in various formats">
                  <button
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.text,
                      borderColor: colors.border
                    }}
                    aria-label="Export options"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>
                </Tooltip>
                <div 
                  className="absolute right-0 top-full mt-1 w-36 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <button
                    onClick={() => handleExport('md')}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    style={{
                      color: colors.text
                    }}
                  >
                    Export as .md
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    style={{
                      color: colors.text
                    }}
                  >
                    Export as .txt
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="w-full px-4 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    style={{
                      color: colors.text
                    }}
                  >
                    Export as .html
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-wrap gap-2 mb-4">
            <Tooltip content="Make text bold (Ctrl+B)">
              <button 
                onClick={() => formatText('bold')} 
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Bold"
              >
                <FiBold className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Make text italic (Ctrl+I)">
              <button 
                onClick={() => formatText('italic')} 
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Italic"
              >
                <FiItalic className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Insert a bulleted list">
              <button 
                onClick={() => formatText('list')} 
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="List"
              >
                <FiList className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Insert a link">
              <button 
                onClick={() => formatText('link')} 
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Link"
              >
                <FiLink className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Insert inline code or code block">
              <button 
                onClick={() => formatText('code')} 
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Code"
              >
                <FiCode className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Insert an image">
              <button 
                onClick={() => formatText('image')} 
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Image"
              >
                <FiImage className="w-4 h-4" />
              </button>
            </Tooltip>
            <div 
              className="w-px h-6 mx-1 self-center"
              style={{
                backgroundColor: colors.border
              }}
            ></div>
            <Tooltip content="Insert a level 1 heading">
              <button 
                onClick={() => formatText('h1')} 
                className="px-2 py-1 rounded-lg transition-colors font-bold"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Heading 1"
              >
                H1
              </button>
            </Tooltip>
            <Tooltip content="Insert a level 2 heading">
              <button 
                onClick={() => formatText('h2')} 
                className="px-2 py-1 rounded-lg transition-colors font-bold"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Heading 2"
              >
                H2
              </button>
            </Tooltip>
            <Tooltip content="Insert a level 3 heading">
              <button 
                onClick={() => formatText('h3')} 
                className="px-2 py-1 rounded-lg transition-colors font-bold"
                style={{
                  backgroundColor: colors.bgSecondary,
                  color: colors.text,
                  borderColor: colors.border
                }}
                aria-label="Heading 3"
              >
                H3
              </button>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            <div className="flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-2">
                <Tooltip content="Write your Markdown text here. The editor supports syntax highlighting and keyboard shortcuts.">
                  <label htmlFor="editor" className="text-sm font-medium flex items-center">
                    Editor
                    <FiHelpCircle className="ml-1 w-3.5 h-3.5 text-gray-400" />
                  </label>
                </Tooltip>
                <span 
                  className="text-xs"
                  style={{
                    color: theme === 'dark' ? '#a1a1aa' : '#71717a'
                  }}
                >
                  {wordCount} words · {characterCount} characters
                </span>
              </div>
              <textarea
                ref={textareaRef}
                id="editor"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-h-0 w-full p-4 rounded-lg font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors field-sizing-content overflow-auto editor-area"
                spellCheck="false"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderColor: colors.border,
                  border: `1px solid ${colors.border}`
                }}
              />
            </div>

            <div className="flex flex-col min-h-0">
              <Tooltip content="See how your Markdown will look when rendered. Updates in real-time as you type.">
                <label className="text-sm font-medium mb-2 flex items-center">
                  Preview
                  <FiHelpCircle className="ml-1 w-3.5 h-3.5 text-gray-400" />
                </label>
              </Tooltip>
              <div
                className="flex-1 min-h-0 w-full p-4 rounded-lg overflow-auto prose max-w-none preview-area"
                dangerouslySetInnerHTML={{ __html: marked(markdown) }}
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderColor: colors.border,
                  border: `1px solid ${colors.border}`
                }}
                id="preview-container"
              />
            </div>
          </div>
        </div>

        {/* Reset confirmation modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div 
              className="w-96 max-w-[90vw] rounded-lg shadow-lg p-6"
              style={{
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.border}`
              }}
            >
              <h3 className="text-lg font-medium mb-4">Reset Document</h3>
              <p className="mb-6">
                Are you sure you want to clear all content and reset to default? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.text
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        <MarkdownGlossary onInsert={handleInsert} />
      </div>
    </>
  );
}

export default App;
