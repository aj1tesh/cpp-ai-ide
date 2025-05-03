import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Box } from '@mui/material';
import 'xterm/css/xterm.css';

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize terminal after component mount
  useEffect(() => {
    // Wait for DOM to be ready
    setIsReady(true);
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  // Setup terminal after component is ready
  useEffect(() => {
    if (!isReady || !terminalRef.current) return;

    const setupTerminal = () => {
      const term = new XTerm({
        cursorBlink: true,
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
        },
        rows: 20,
        cols: 80,
        convertEol: true,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 14
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      
      // Store refs
      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      // Open terminal in container
      if (terminalRef.current) {
        term.open(terminalRef.current);
      }

      // Wait a frame before fitting
      requestAnimationFrame(() => {
        if (fitAddon) {
          fitAddon.fit();
          term.write('C++ AI IDE Terminal\r\n$ ');
        }
      });
    };

    setupTerminal();
  }, [isReady]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Box
      ref={terminalRef}
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: '#1e1e1e',
        overflow: 'hidden',
        padding: '4px',
        display: 'flex',
        flexDirection: 'column',
        '& .xterm': {
          height: '100%',
          width: '100%'
        },
        '& .xterm-viewport': {
          overflow: 'hidden !important'
        }
      }}
    />
  );
};

export default Terminal; 