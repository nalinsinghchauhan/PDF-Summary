# Image Caption Generator

This is a simple **Image Caption Generator** web application that uses **Google Gemini API** to generate captions for uploaded images.

## 🚀 Features
- Upload an image
- Get an AI-generated caption
- Simple frontend using HTML, CSS, and JavaScript
- Backend powered by **Node.js, Express, and Gemini API**

## 🔧 Setup & Installation
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/yourusername/image-caption-generator.git
cd image-caption-generator
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in the root directory and add:
```
GEMINI_API_KEY=your_actual_api_key
```

### 4️⃣ Run the Backend Server
```sh
node server.js
```
The server should start at **http://localhost:5000**

### 5️⃣ Open the Webpage
Open `public/index.html` in your browser and upload an image to generate a caption.
