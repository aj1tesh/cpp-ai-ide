import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Directory to store temporary C++ files
const TMP_DIR = path.join(__dirname, '../tmp');
fs.ensureDirSync(TMP_DIR);

// Create multiple mock responses
const mockReviewResponses = [
  `## Code Review Suggestions

1. **Performance Optimization**
   - Consider using references instead of copies for large objects
   - Use const where possible to prevent accidental modifications

2. **Style Improvements**
   - Follow consistent naming conventions
   - Add more comments to explain complex logic`,

  `## C++ Code Analysis

1. **Memory Management**
   - Check for potential memory leaks
   - Consider using RAII principles for resource management

2. **Error Handling**
   - Add more robust error checking
   - Use exceptions appropriately for error conditions`,

  `## Code Quality Review

1. **Maintainability**
   - Break down complex functions into smaller ones
   - Use meaningful variable and function names

2. **Testing**
   - Add unit tests for critical functions
   - Consider edge cases in your implementation`
];

const systemPrompts = {
  fix: `You are a C++ code fixing assistant. Analyze the code and error, then provide:
  1. A clear explanation of the error
  2. The fixed code
  3. Suggestions to prevent similar errors
  Format your response in markdown.`,
  
  review: `You are a C++ code review assistant. Analyze the code and provide:
  1. Code quality assessment
  2. Performance considerations
  3. Best practices suggestions
  4. Potential improvements
  Format your response in markdown.`
};

app.post('/api/compile', (req, res) => {
  const { code } = req.body;
  const filename = `code_${Date.now()}.cpp`;
  const filepath = path.join(TMP_DIR, filename);
  const outputPath = path.join(TMP_DIR, 'a.exe');

  console.log('Received code to compile:', code);

  // Write code to file
  fs.writeFileSync(filepath, code);
  console.log('Code written to file:', filepath);

  // Compile the code
  console.log('Compiling with command:', `g++ "${filepath}" -o "${outputPath}"`);
  exec(`g++ "${filepath}" -o "${outputPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.log('Compilation error:', stderr);
      res.json({
        success: false,
        error: stderr,
      });
      return;
    }

    console.log('Compilation successful, running program');
    // Run the compiled program
    exec(`"${outputPath}"`, (runError, runStdout, runStderr) => {
      if (runError) {
        console.log('Runtime error:', runStderr);
        res.json({
          success: false,
          error: runStderr,
        });
        return;
      }

      console.log('Program executed successfully');
      console.log('Program output:', runStdout);
      res.json({
        success: true,
        output: runStdout,
      });
    });
  });
});

app.post('/api/fix', async (req, res) => {
  const { code, error } = req.body;
  
  // Check if API key is available
  if (!process.env.AI_API_KEY) {
    return res.json({
      suggestions: "API key not configured. Please set the AI_API_KEY environment variable.",
    });
  }
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.AI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompts.fix + "\nWhen providing fixed code, please wrap it in ```cpp and ``` tags so it can be easily extracted." },
              { text: `Fix this C++ code error:\nError: ${error}\n\nCode:\n${code}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7
        }
      })
    });

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected API response:', data);
      return res.status(500).json({ error: 'Invalid response from AI service' });
    }
    
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Extract code blocks from the markdown response
    const codeBlockRegex = /```cpp\s*([\s\S]*?)\s*```/;
    const match = aiResponse.match(codeBlockRegex);
    
    if (match && match[1]) {
      // We found a code block, use it as the fixed code
      const fixedCode = match[1].trim();
      
      // Remove the code block from the explanation
      const explanation = aiResponse.replace(codeBlockRegex, '')
        .trim();
      
      res.json({
        fixedCode: fixedCode,
        explanation: explanation,
        suggestions: aiResponse
      });
    } else {
      // No code block found, just return the suggestions
      res.json({
        suggestions: aiResponse
      });
    }
  } catch (error) {
    console.error('AI service error:', error);
    res.status(500).json({ error: 'AI service error' });
  }
});app.post('/api/review', async (req, res) => {
  const { code } = req.body;
  
  // Check if API key is available
  if (!process.env.AI_API_KEY) {
    // Fall back to random mock data
    const randomIndex = Math.floor(Math.random() * mockReviewResponses.length);
    res.json({
      suggestions: mockReviewResponses[randomIndex],
    });
    return;
  }
  
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.AI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemPrompts.review },
              { text: `Review this C++ code:\n\n${code}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7
        }
      })
    });
    console.log('Review response:', response);
    const data = await response.json();
    res.json({
      suggestions: data.candidates[0].content.parts[0].text,
    });
  } catch (error) {
    console.error('AI service error:', error);
    // Fall back to random mock data
    const randomIndex = Math.floor(Math.random() * mockReviewResponses.length);
    res.json({
      suggestions: mockReviewResponses[randomIndex],
    });
  }
});

app.get('/api/files', async (req, res) => {
  const workspaceDir = path.join(__dirname, '../../');
  
  const getFileTree = async (dir: string): Promise<any[]> => {
    const items = await fs.readdir(dir);
    const result = [];

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = await fs.stat(fullPath);
      const relativePath = path.relative(workspaceDir, fullPath);

      if (stats.isDirectory()) {
        if (item !== 'node_modules' && item !== '.git') {
          result.push({
            name: item,
            type: 'directory',
            path: relativePath,
            children: await getFileTree(fullPath),
          });
        }
      } else {
        result.push({
          name: item,
          type: 'file',
          path: relativePath,
        });
      }
    }

    return result;
  };

  try {
    const fileTree = await getFileTree(workspaceDir);
    res.json(fileTree);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file tree' });
  }
});

// Add new endpoint to get file content
app.get('/api/files/content', async (req, res) => {
  const { path: filePath } = req.query;
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'File path is required' });
  }

  const workspaceDir = path.join(__dirname, '../../');
  const fullPath = path.join(workspaceDir, filePath);

  // Security check to prevent directory traversal attacks
  const normalizedFullPath = path.normalize(fullPath);
  const normalizedWorkspaceDir = path.normalize(workspaceDir);
  
  if (!normalizedFullPath.startsWith(normalizedWorkspaceDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read file content' });
  }
});

// Add endpoint to get file content (alternative URL)
app.get('/api/file', async (req, res) => {
  const { path: filePath } = req.query;
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'File path is required' });
  }

  const workspaceDir = path.join(__dirname, '../../');
  const fullPath = path.join(workspaceDir, filePath);

  // Security check to prevent directory traversal attacks
  const normalizedFullPath = path.normalize(fullPath);
  const normalizedWorkspaceDir = path.normalize(workspaceDir);
  
  if (!normalizedFullPath.startsWith(normalizedWorkspaceDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const stats = await fs.stat(fullPath);
    
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Return content in the format expected by the frontend
    res.json({
      success: true,
      content: content
    });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to read file content' 
    });
  }
});

// Add this endpoint to save file content
app.post('/api/file', async (req, res) => {
  const { path: filePath, content } = req.body;
  
  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'File path is required' });
  }

  const workspaceDir = path.join(__dirname, '../../');
  const fullPath = path.join(workspaceDir, filePath);

  // Security check to prevent directory traversal attacks
  const normalizedFullPath = path.normalize(fullPath);
  const normalizedWorkspaceDir = path.normalize(workspaceDir);
  
  if (!normalizedFullPath.startsWith(normalizedWorkspaceDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    await fs.writeFile(fullPath, content, 'utf-8');
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing file:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to write file content' 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 