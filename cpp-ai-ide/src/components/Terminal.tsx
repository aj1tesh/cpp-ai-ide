import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface TerminalProps {
  output: string;
}

const Terminal: React.FC<TerminalProps> = ({ output }) => {
  return (
    <Paper 
      sx={{ 
        height: '100%', 
        bgcolor: '#1e1e1e', 
        color: '#f8f8f8',
        p: 1,
        overflow: 'auto',
        fontFamily: 'monospace'
      }}
    >
      <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
        {output || 'Terminal ready...'}
      </Typography>
    </Paper>
  );
};

export default Terminal; 