import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Directory to store temporary C++ files
const TMP_DIR = path.join(__dirname, '../tmp');
fs.ensureDirSync(TMP_DIR);

// Mock AI suggestions for code review
const mockReviewSuggestions = `
## Code Review Suggestions

1. **Performance Optimization**
   - Consider using references instead of copies for large objects
   - Use const where possible to prevent accidental modifications

2. **Style Improvements**
   - Follow consistent naming conventions
   - Add more comments to explain complex logic

3. **Best Practices**
   - Initialize variables at declaration
   - Use smart pointers instead of raw pointers
`;

// Mock AI fix suggestions
const mockFixSuggestions = `
## AI Fix Suggestions

1. **Compilation Error Fixed**
   - Added missing semicolon
   - Fixed variable declaration
   - Corrected function signature

2. **Changes Made**
   - Line 10: Added missing include statement
   - Line 15: Fixed syntax error
   - Line 20: Corrected variable type
`;

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

  // Write code to file
  fs.writeFileSync(filepath, code);

  // Compile the code
  exec(`g++ "${filepath}" -o "${outputPath}"`, (error, stdout, stderr) => {
    if (error) {
      res.json({
        success: false,
        error: stderr,
      });
      return;
    }

    res.json({
      success: true,
      output: stdout,
    });
  });
});

app.post('/api/fix', async (req, res) => {
  const { code, error } = req.body;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompts.fix
          },
          {
            role: "user",
            content: `Fix this C++ code error:\nError: ${error}\n\nCode:\n${code}`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    res.json({
      suggestions: data.choices[0].message.content,
      fixedCode: code // You'll need to parse the AI response to extract fixed code
    });
  } catch (error) {
    res.status(500).json({ error: 'AI service error' });
  }
});

app.post('/api/review', (req, res) => {
  const { code } = req.body;
  
  // Mock AI review - in a real implementation, this would call an AI service
  res.json({
    suggestions: mockReviewSuggestions,
  });
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 