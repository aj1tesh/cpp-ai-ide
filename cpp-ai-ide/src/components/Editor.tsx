import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Box } from '@mui/material';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const CodeEditor = ({ value = '', onChange }: CodeEditorProps) => {
  const editorRef = useRef(null);

  const getLanguage = (content: string) => {
    if (!content) return 'plaintext';
    if (content.startsWith('// Error')) return 'plaintext';
    
    // More robust C++ detection
    const cppPatterns = [
      /#include\s*<[^>]+>/,  // #include <header>
      /#include\s*"[^"]+"/,  // #include "header"
      /int\s+main\s*\(/,     // int main(
      /void\s+main\s*\(/,    // void main(
      /class\s+\w+/,         // class definition
      /namespace\s+\w+/,     // namespace
      /std::/,              // std:: usage
      /using\s+namespace/,  // using namespace
      /template\s*</,       // template
      /#define\s+\w+/,      // #define
      /#ifdef\s+\w+/,       // #ifdef
      /#ifndef\s+\w+/       // #ifndef
    ];

    // Check for C++ patterns
    if (cppPatterns.some(pattern => pattern.test(content))) {
      return 'cpp';
    }

    // TypeScript/JavaScript detection
    if (content.includes('import ') || 
        content.includes('export ') || 
        content.includes('function ') ||
        content.includes('const ') ||
        content.includes('let ') ||
        content.includes('var ')) {
      return 'typescript';
    }

    // Markdown detection
    if (content.startsWith('#') || 
        content.includes('```') || 
        content.includes('##') ||
        content.includes('*') ||
        content.includes('>')) {
      return 'markdown';
    }
    
    return 'plaintext';
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const isErrorMessage = value?.startsWith('// Error') || false;
  const language = getLanguage(value || '');

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={value || ''}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          readOnly: isErrorMessage,
          formatOnPaste: !isErrorMessage,
          formatOnType: !isErrorMessage,
          scrollBeyondLastLine: false,
          semanticHighlighting: true,
          bracketPairColorization: true,
          guides: {
            bracketPairs: true,
            indentation: true,
            highlightActiveBracketPair: true
          }
        }}
      />
    </Box>
  );
};

export default CodeEditor; 