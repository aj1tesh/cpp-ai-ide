import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

interface FileExplorerProps {
  onFileSelect: (filePath: string, content?: string) => void;
}

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

const FileExplorer = ({ onFileSelect }: FileExplorerProps) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/files', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (node: FileNode) => {
    if (node.type === 'file') {
      const normalizedPath = node.path.replace(/\\/g, '/');
      console.log('Opening file:', normalizedPath);
      
      // Always fetch content for any file type
      fetchFileContent(normalizedPath);
    } else {
      toggleFolder(node.path);
    }
  };

  const fetchFileContent = async (filePath: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/files/content?path=${encodeURIComponent(filePath)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.content !== undefined) {
        // Pass both the file path and content to the parent component
        onFileSelect(filePath, data.content);
      } else {
        console.error('No content returned for file:', filePath);
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const renderFileTree = (nodes: FileNode[], level: number = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <ListItem
          disablePadding
          sx={{ pl: level * 2 }}
        >
          <ListItemButton
            onClick={() => handleFileClick(node)}
          >
            <ListItemIcon sx={{ minWidth: '36px' }}>
              {node.type === 'directory' ? (
                expandedFolders.has(node.path) ? (
                  <FolderOpenIcon />
                ) : (
                  <FolderIcon />
                )
              ) : (
                <InsertDriveFileIcon />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={node.name} 
              primaryTypographyProps={{
                noWrap: true,
                title: node.name,
                sx: { overflow: 'hidden', textOverflow: 'ellipsis' }
              }}
            />
          </ListItemButton>
        </ListItem>
        {node.type === 'directory' &&
          expandedFolders.has(node.path) &&
          node.children &&
          renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: '#252526',
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#1e1e1e',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#424242',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#555',
        },
      }}
    >
      <List component="nav" dense>
        {renderFileTree(files)}
      </List>
    </Box>
  );
};

export default FileExplorer; 