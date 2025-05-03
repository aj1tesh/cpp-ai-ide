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
    try {
      const response = await fetch('http://localhost:3001/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (!data.success) {
        // If compilation fails, send to AI for fixing
        const aiResponse = await fetch('http://localhost:3001/api/fix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, error: data.error }),
        });
        const aiData = await aiResponse.json();
        setAiSuggestions(aiData.suggestions);
        setCode(aiData.fixedCode);
      }
    } catch (error) {
      console.error('Error running code:', error);
    }
  };

  const handleReviewCode = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      setAiSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error reviewing code:', error);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TopBar onRun={handleRunCode} onReview={handleReviewCode} />
        <Box sx={{ flexGrow: 1, display: 'flex' }}>
          <SplitPane
            split="vertical"
            minSize={200}
            defaultSize={200}
            style={{ position: 'relative' }}
            pane1Style={{ overflow: 'auto' }}
            pane2Style={{ overflow: 'auto' }}
          >
            <FileExplorer onFileSelect={handleFileSelect} />
            <SplitPane
              split="vertical"
              minSize={400}
              defaultSize="70%"
              style={{ position: 'relative' }}
              pane1Style={{ overflow: 'auto' }}
              pane2Style={{ overflow: 'auto' }}
            >
              <Stack sx={{ height: '100%' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <CodeEditor value={code} onChange={handleCodeChange} />
                </Box>
                <Box sx={{ height: '200px' }}>
                  <Terminal />
                </Box>
              </Stack>
              <AIPanel suggestions={aiSuggestions} />
            </SplitPane>
          </SplitPane>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App; 