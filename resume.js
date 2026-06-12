import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import mongoose from 'mongoose';
import ResumeReport from '../models/ResumeReport.js';

const router = express.Router();

// Multer in-memory storage config
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to clean Gemini/DeepSeek JSON response
const cleanGeminiJson = (text) => {
  let cleaned = text.trim();
  
  // Strip DeepSeek R1 <think>...</think> tags if present
  if (cleaned.includes('</think>')) {
    cleaned = cleaned.split('</think>').pop().trim();
  } else if (cleaned.startsWith('<think>')) {
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
  }
  
  // Strip starting ```json and ending ``` if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  }
  return JSON.parse(cleaned);
};

// POST /api/resume/analyze
router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.originalname;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    let fileType = '';
    let extractedText = '';

    // Extract text depending on file format
    if (fileExtension === 'pdf') {
      fileType = 'pdf';
      try {
        const data = await pdfParse(req.file.buffer);
        extractedText = data.text;
      } catch (parseErr) {
        console.error('PDF parsing error:', parseErr);
        return res.status(400).json({ error: 'Failed to parse PDF file content' });
      }
    } else if (fileExtension === 'docx') {
      fileType = 'docx';
      try {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value;
      } catch (parseErr) {
        console.error('DOCX parsing error:', parseErr);
        return res.status(400).json({ error: 'Failed to parse DOCX file content' });
      }
    } else if (['txt', 'md'].includes(fileExtension)) {
      fileType = fileExtension === 'md' ? 'md' : 'txt';
      extractedText = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload a .pdf, .docx, .txt, or .md file.' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Resume file appears to be empty' });
    }

    const systemPrompt = `You are an expert technical resume analyzer and career coach.
Analyze the resume text provided and return ONLY a valid JSON 
object with exactly these fields:

{
  "extractedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "improvementSuggestions": ["suggestion1", "suggestion2"],
  "recommendedTech": ["tech1", "tech2"],
  "recommendedCourses": [
    { "name": "Course Name", "platform": "Coursera/Udemy/etc" }
  ],
  "overallScore": 72,
  "summary": "2-3 sentence overall assessment"
}

Rules:
- extractedSkills: max 15 skills found in the resume
- missingSkills: top 8 in-demand skills NOT in the resume
- improvementSuggestions: exactly 5 actionable points
- recommendedTech: 6 technologies to learn next
- recommendedCourses: exactly 4 courses
- overallScore: honest score out of 100
- Return ONLY the JSON. No markdown, no backticks, no explanation.`;

    const prompt = `${systemPrompt}\n\nResume Text:\n${extractedText}`;
    
    let analysis;
    const isDeepSeekEnabled = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;

    if (isDeepSeekEnabled) {
      const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;
      const modelName = process.env.DEEPSEEK_MODEL || "deepseek/deepseek-r1:free";
      console.log(`Sending resume "${fileName}" text to DeepSeek model "${modelName}" via OpenRouter...`);

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Resume Text:\n${extractedText}` }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const responseText = data.choices[0].message.content;
        analysis = cleanGeminiJson(responseText);
      } catch (deepseekErr) {
        console.error('DeepSeek analysis error:', deepseekErr);
        return res.status(500).json({ error: `Failed to analyze resume using DeepSeek: ${deepseekErr.message}` });
      }
    } else {
      // Use Gemini via v1 REST API with fallback model chain for resilience
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        return res.status(500).json({ error: 'Gemini API key is not configured' });
      }

      const modelChain = process.env.GEMINI_MODEL
        ? [process.env.GEMINI_MODEL]
        : ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite'];

      let lastError = null;
      let succeeded = false;

      for (const geminiModel of modelChain) {
        console.log(`Trying Gemini model: ${geminiModel}...`);
        try {
          const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            }
          );

          if (!geminiResponse.ok) {
            const errBody = await geminiResponse.text();
            const statusCode = geminiResponse.status;
            lastError = `Gemini error ${statusCode} (${geminiModel}): ${errBody.slice(0, 200)}`;
            console.error(lastError);
            // 503 = overloaded, try next model in chain
            if (statusCode !== 503) throw new Error(lastError);
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }

          const geminiData = await geminiResponse.json();
          const responseText = geminiData.candidates[0].content.parts[0].text;

          try {
            analysis = cleanGeminiJson(responseText);
            succeeded = true;
            console.log(`Successfully analyzed with ${geminiModel}`);
            break;
          } catch (jsonErr) {
            console.error('Error parsing Gemini JSON:', jsonErr, 'Raw:', responseText);
            return res.status(500).json({ error: 'Failed to parse structured JSON from analyzer' });
          }
        } catch (fetchErr) {
          lastError = fetchErr.message;
          console.error(`Error with ${geminiModel}:`, fetchErr.message);
          break;
        }
      }

      if (!succeeded) {
        return res.status(503).json({ error: `The AI is currently busy. Please try again in a few seconds.` });
      }
    }

    // Save report - Fallback to in-memory if MongoDB is not connected
    let savedReport;
    if (mongoose.connection.readyState === 1) {
      const newReport = new ResumeReport({
        fileName,
        fileType,
        analysis
      });
      await newReport.save();
      savedReport = {
        _id: newReport._id,
        fileName: newReport.fileName,
        fileType: newReport.fileType,
        uploadedAt: newReport.uploadedAt,
        analysis: newReport.analysis
      };
      console.log(`Saved report to MongoDB database with ID: ${newReport._id}`);
    } else {
      console.log('MongoDB not connected. Falling back to in-memory storage.');
      savedReport = {
        _id: new mongoose.Types.ObjectId().toString(),
        fileName,
        fileType,
        uploadedAt: new Date(),
        analysis
      };
      global.inMemoryReports = global.inMemoryReports || [];
      global.inMemoryReports.unshift(savedReport);
    }

    res.status(200).json(savedReport);

  } catch (error) {
    console.error('Analyze controller error:', error);
    res.status(500).json({ error: 'Internal server error during resume analysis' });
  }
});

// GET /api/resume/report/:id
router.get('/report/:id', async (req, res) => {
  try {
    let report;
    if (mongoose.connection.readyState === 1) {
      report = await ResumeReport.findById(req.params.id);
    } else {
      global.inMemoryReports = global.inMemoryReports || [];
      report = global.inMemoryReports.find(r => r._id.toString() === req.params.id);
    }

    if (!report) {
      return res.status(404).json({ error: 'Resume report not found' });
    }
    res.status(200).json(report);
  } catch (error) {
    console.error('Fetch report error:', error);
    res.status(500).json({ error: 'Internal server error while fetching report' });
  }
});

// GET /api/resume/history
router.get('/history', async (req, res) => {
  try {
    let formattedHistory = [];
    if (mongoose.connection.readyState === 1) {
      const history = await ResumeReport.find({}, 'fileName uploadedAt overallScore analysis.overallScore')
        .sort({ uploadedAt: -1 })
        .limit(10);

      formattedHistory = history.map(item => ({
        _id: item._id,
        fileName: item.fileName,
        uploadedAt: item.uploadedAt,
        overallScore: item.analysis ? item.analysis.overallScore : item.overallScore
      }));
    } else {
      global.inMemoryReports = global.inMemoryReports || [];
      formattedHistory = global.inMemoryReports.slice(0, 10).map(item => ({
        _id: item._id,
        fileName: item.fileName,
        uploadedAt: item.uploadedAt,
        overallScore: item.analysis ? item.analysis.overallScore : item.overallScore
      }));
    }

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ error: 'Internal server error while fetching scan history' });
  }
});

// DELETE /api/resume/report/:id
router.delete('/report/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const deletedReport = await ResumeReport.findByIdAndDelete(req.params.id);
      if (!deletedReport) {
        return res.status(404).json({ error: 'Resume report not found' });
      }
    } else {
      global.inMemoryReports = global.inMemoryReports || [];
      const index = global.inMemoryReports.findIndex(r => r._id.toString() === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Resume report not found' });
      }
      global.inMemoryReports.splice(index, 1);
    }
    
    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Internal server error while deleting report' });
  }
});

export default router;
