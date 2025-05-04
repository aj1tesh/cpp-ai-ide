import React, { useState } from 'react';
import SplitPane from 'react-split-pane';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/Editor';
import Terminal from './components/Terminal';
import AIPanel from './components/AIPanel';
import TopBar from './components/TopBar';
import { Box, Stack } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [code, setCode] = useState<string>('');
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [compileError, setCompileError] = useState<string | null>(null);

  const handleFileSelect = async (filePath: string) => {
    try {
      setCurrentFile(filePath);
      
      // Normalize the path for the URL
      const normalizedPath = filePath.replace(/\\/g, '/');
      console.log('Requesting file:', normalizedPath);

      const response = await fetch(`http://localhost:3001/api/file?path=${encodeURIComponent(normalizedPath)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to load file: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.content) {
        setCode(data.content);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error: any) {
      console.error('Error loading file:', error.message);
      setCode(`// Error loading file: ${error.message}`);
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  const handleRunCode = async () => {
    console.log('Run button clicked');
    try {
      setTerminalOutput('Compiling and running code...');
      setCompileError(null);
      console.log('Terminal output set to compiling message');
      
      // Send code to backend
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      
      console.log('Response received from backend');
      console.log('Response data:', data);
      
      // Update terminal with result
      if (data.success) {
        setTerminalOutput(`Compilation successful!\n${data.output || 'Program executed with no output.'}`);
        console.log('Terminal output set to compilation successful message');
        console.log('Terminal output:', data.output);
      } else {
        setTerminalOutput(`Compilation failed:\n${data.error || 'Unknown error'}`);
        setCompileError(data.error || 'Unknown error');
        console.log('Terminal output set to compilation failed message');
        console.log('Terminal output:', data.error);
      }
    } catch (error) {
      console.error('Error running code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTerminalOutput(`Error: ${errorMessage}`);
      setCompileError(errorMessage);
    }
  };

  const handleReviewCode = async () => {
    try {
      console.log('Review button clicked');
      setAiSuggestions('Analyzing code...');
      
      // Send code to backend for review
      const response = await fetch('http://localhost:3001/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      console.log('Review response received:', data);
      
      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
        console.log('AI suggestions updated');
      } else {
        setAiSuggestions('No suggestions available.');
        console.log('No suggestions in response');
      }
    } catch (error) {
      console.error('Error reviewing code:', error);
      setAiSuggestions(`Error during code review: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const handleFixError = async () => {
    try {
      console.log('Fix Error button clicked');
      setAiSuggestions('Analyzing error and generating fix...');
      
      if (!compileError) {
        setAiSuggestions('No compilation errors to fix.');
        return;
      }
      
      // Send code and error to backend for fixing
      const response = await fetch('http://localhost:3001/api/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          error: compileError
        }),
      });
      
      const data = await response.json();
      console.log('Fix response received:', data);
      
      if (data.fixedCode) {
        setCode(data.fixedCode);
        setAiSuggestions(data.explanation || 'Code has been fixed. Please review the changes.');
        console.log('Code updated with fix');
      } else if (data.suggestions) {
        setAiSuggestions(data.suggestions);
        console.log('AI suggestions for fix updated');
      } else {
        setAiSuggestions('Could not automatically fix the error. Please review the code manually.');
        console.log('No fix available');
      }
    } catch (error) {
      console.error('Error fixing code:', error);
      setAiSuggestions(`Error during code fix: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
  };

  const saveFile = async (filePath: string, content: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath, content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save file');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar 
          onRun={handleRunCode} 
          onReview={handleReviewCode} 
          onFixError={handleFixError}
          hasError={!!compileError}
        />
        <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
          <SplitPane
            split="vertical"
            minSize={250}
            defaultSize={300}
          >
            <FileExplorer onFileSelect={handleFileSelect} />
            <SplitPane
              split="vertical"
              minSize={400}
              defaultSize="70%"
            >
              <SplitPane
                split="horizontal"
                minSize={100}
                defaultSize="70%"
              >
                <CodeEditor value={code} onChange={handleCodeChange} />
                <Terminal output={terminalOutput} />
              </SplitPane>
              <AIPanel suggestions={aiSuggestions} />
            </SplitPane>
          </SplitPane>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 