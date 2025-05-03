declare module 'react-split-pane' {
  import * as React from 'react';

  interface SplitPaneProps {
    allowResize?: boolean;
    children?: React.ReactNode;
    className?: string;
    primary?: 'first' | 'second';
    minSize?: number | string;
    maxSize?: number | string;
    defaultSize?: number | string;
    size?: number | string;
    split?: 'vertical' | 'horizontal';
    style?: React.CSSProperties;
    pane1Style?: React.CSSProperties;
    pane2Style?: React.CSSProperties;
    resizerStyle?: React.CSSProperties;
    onDragStarted?: () => void;
    onDragFinished?: (newSize: number) => void;
    onChange?: (newSize: number) => void;
    onResizerClick?: (event: MouseEvent) => void;
    onResizerDoubleClick?: (event: MouseEvent) => void;
  }

  class SplitPane extends React.Component<SplitPaneProps> {}

  export default SplitPane;
} 