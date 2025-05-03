import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import * as fs from 'fs-extra';
import * as path from 'path';
dotenv.config();

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

const app = express();
const port = process.env.PORT || 3001;
const AI_API_KEY = process.env.AI_API_KEY || '';

// Check if AI_API_KEY is set
if (!AI_API_KEY) {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  Warning: AI_API_KEY is not set. AI features will be disabled.');
  console.log('\x1b[36m%s\x1b[0m', 'To enable AI features:');
  console.log('1. Set the AI_API_KEY environment variable:');
  console.log('   Windows (PowerShell): $env:AI_API_KEY="your-api-key"');
  console.log('   Windows (CMD): set AI_API_KEY=your-api-key');
  console.log('   Linux/Mac: export AI_API_KEY=your-api-key');
  console.log('2. Restart the server');
}

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: false,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Get the absolute path to the project root
const projectRoot = path.resolve(__dirname, '../..');

// @ts-ignore
app.post('/api/fix', async (req, res) => {
  const { code, error } = req.body;
  
  if (!AI_API_KEY) {
    return res.status(503).json({ 
      error: 'AI service is not configured',
      suggestions: 'To enable AI features:\n1. Set the AI_API_KEY environment variable\n2. Restart the server',
      fixedCode: code
    });
  }

  // Example with OpenAI integration
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a C++ code fixing assistant."
        },
        {
          role: "user",
          content: `Fix this C++ code error: ${error}\n\nCode:\n${code}`
        }
      ]
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.error?.message || 'AI service error');
      });
    }
    return response.json();
  })
  .then(data => {
    res.json({
      suggestions: data.choices[0].message.content,
      fixedCode: code // Parse the AI response to extract fixed code
    });
  })
  .catch((error: any) => {
    console.error('AI service error:', error);
    res.status(500).json({ 
      error: error.message || 'AI service error',
      suggestions: 'Failed to get AI suggestions. Please check your API key and try again.',
      fixedCode: code
    });
  });
});

// @ts-ignore
app.get('/api/file', async (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) {
    return res.status(400).json({ error: 'No file path provided' });
  }

  // Normalize the path and make it absolute
  const normalizedPath = filePath.replace(/\\/g, '/');
  const absolutePath = path.join(projectRoot, normalizedPath);

  // Security check - ensure file is within project directory
  if (!absolutePath.startsWith(projectRoot)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Debug logging
  console.log('Project root:', projectRoot);
  console.log('Requested file:', normalizedPath);
  console.log('Absolute path:', absolutePath);

  // Check if file exists
  fs.pathExists(absolutePath)
    .then(exists => {
      if (!exists) {
        console.log('File not found:', absolutePath);
        res.status(404).json({ error: `File not found: ${normalizedPath}` });
        return null;
      }
      return fs.readFile(absolutePath, 'utf-8');
    })
    .then(content => {
      if (content) {
        res.setHeader('Content-Type', 'application/json');
        res.json({
          success: true,
          content,
          path: normalizedPath
        });
      }
    })
    .catch((error: any) => {
      console.error('Error reading file:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    });
});

// @ts-ignore
app.get('/api/files', async (req, res) => {
  const getFileTree = async (dir: string): Promise<FileNode[]> => {
    const items = await fs.readdir(dir);
    const result: FileNode[] = [];

    for (const item of items) {
      // Skip node_modules and hidden files/folders
      if (item === 'node_modules' || item === '.git' || item.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dir, item);
      const stats = await fs.stat(fullPath);
      const relativePath = path.relative(projectRoot, fullPath);

      if (stats.isDirectory()) {
        result.push({
          name: item,
          type: 'directory',
          path: relativePath,
          children: await getFileTree(fullPath)
        });
      } else {
        result.push({
          name: item,
          type: 'file',
          path: relativePath
        });
      }
    }

    return result;
  };

  getFileTree(projectRoot)
    .then(fileTree => {
      res.json(fileTree);
    })
    .catch((error) => {
      console.error('Error reading directory:', error);
      res.status(500).json({ error: 'Failed to read directory structure' });
    });
});

// Add this endpoint to debug file paths
app.get('/api/debug/paths', (req, res) => {
  const projectRoot = path.resolve(__dirname, '../../');
  res.json({
    projectRoot,
    currentDir: __dirname,
    files: fs.readdirSync(projectRoot)
  });
});

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Project root:', projectRoot);
});