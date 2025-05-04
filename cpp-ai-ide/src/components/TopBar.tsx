import React from 'react';
import { AppBar, Toolbar, Button, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RateReviewIcon from '@mui/icons-material/RateReview';
import BugReportIcon from '@mui/icons-material/BugReport';

interface TopBarProps {
  onRun: () => void;
  onReview: () => void;
  onFixError: () => void;
  hasError: boolean;
}

const TopBar = ({ onRun, onReview, onFixError, hasError }: TopBarProps) => {
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
        <Button
          color="inherit"
          startIcon={<BugReportIcon />}
          onClick={onFixError}
          disabled={!hasError}
        >
          Fix Error
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar; 