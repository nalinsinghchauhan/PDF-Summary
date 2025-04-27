import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const PORT = 5000;

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Configure multer for image upload
const upload = multer({ dest: "uploads/" });

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to convert image to base64
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(path).toString("base64"),
      mimeType,
    },
  };
}

// Route to serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route to handle image upload and caption generation
app.post("/generate-caption", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });

  try {
    const imagePath = req.file.path;
    const imagePart = fileToGenerativePart(imagePath, req.file.mimetype);
    const prompt = "very simply describe the image in 1 line";

    const result = await model.generateContent([prompt, imagePart]);
    const caption = result.response.text();

    // Delete the uploaded image after processing
    fs.unlinkSync(imagePath);

    res.json({ caption });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate caption" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Open http://localhost:${PORT} in your browser to use the application`);
});
