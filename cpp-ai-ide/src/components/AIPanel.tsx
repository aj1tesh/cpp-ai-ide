import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';

interface AIPanelProps {
  suggestions: string;
}

const AIPanel = ({ suggestions }: AIPanelProps) => {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        backgroundColor: '#1e1e1e',
        padding: 2,
        overflow: 'auto',
      }}
    >
      <Paper
        sx={{
          backgroundColor: '#252526',
          padding: 2,
          color: '#ffffff',
        }}
      >
        <Typography variant="h6" gutterBottom>
          AI Suggestions
        </Typography>
        {suggestions ? (
          <ReactMarkdown>{suggestions}</ReactMarkdown>
        ) : (
          <Typography color="text.secondary">
            Run or review code to see AI suggestions
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default AIPanel; 