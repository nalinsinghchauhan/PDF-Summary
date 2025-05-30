import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const app = express();
const PORT = 3000;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for PDF upload
const upload = multer({ 
    dest: uploadsDir,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to read PDF content
async function readPDFContent(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const options = {
            pagerender: function(pageData) {
                return pageData.getTextContent()
                    .then(function(textContent) {
                        let lastY, text = '';
                        for (let item of textContent.items) {
                            if (lastY == item.transform[5] || !lastY) {
                                text += item.str;
                            } else {
                                text += '\n' + item.str;
                            }
                            lastY = item.transform[5];
                        }
                        return text;
                    });
            }
        };
        
        const data = await pdfParse(dataBuffer, options);
        return data.text;
    } catch (error) {
        console.error('Error reading PDF:', error);
        throw new Error('Failed to read PDF file. Please ensure it is a valid PDF.');
    }
}

// Route to serve the main page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Route to handle PDF upload and summary generation
app.post("/generate-summary", upload.single("pdf"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No PDF uploaded" });
    }

    try {
        const pdfPath = req.file.path;
        const pdfContent = await readPDFContent(pdfPath);
        
        if (!pdfContent || pdfContent.trim().length === 0) {
            throw new Error('The PDF appears to be empty or could not be read properly.');
        }
        
        // Truncate content if it's too long (Gemini has a context limit)
        const truncatedContent = pdfContent.slice(0, 30000);
        
        const prompt = `Please provide a comprehensive summary of the following PDF content. Format the output in a clean, readable way with clear sections and bullet points. Avoid using excessive asterisks or special characters. Focus on key points, main ideas, and important details:\n\n${truncatedContent}`;

        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        // Delete the uploaded PDF after processing
        fs.unlinkSync(pdfPath);

        res.json({ summary });
    } catch (error) {
        console.error("Error:", error);
        // Clean up the uploaded file if it exists
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }
        res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message || 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Open http://localhost:${PORT} in your browser to use the application`);
});
