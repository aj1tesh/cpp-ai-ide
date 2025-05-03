import React from 'react';
import { AppBar, Toolbar, Button, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RateReviewIcon from '@mui/icons-material/RateReview';

interface TopBarProps {
  onRun: () => void;
  onReview: () => void;
}

const TopBar = ({ onRun, onReview }: TopBarProps) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          C++ AI IDE
        </Typography>
        <Button
          color="inherit"
          startIcon={<PlayArrowIcon />}
          onClick={onRun}
        >
          Run
        </Button>
        <Button
          color="inherit"
          startIcon={<RateReviewIcon />}
          onClick={onReview}
        >
          Review
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 