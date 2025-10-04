# PDF Content Integration for Quiz Generator

## 🎯 Overview

The quiz generator now supports creating quizzes from PDF files, lecture slides, or any text content! This allows you to generate interactive HTML quizzes based on your specific course materials.

## 🚀 Quick Start

### 1. **Add Your API Key**
```bash
# Create felix.api file with your Google Gemini API key
echo "YOUR_API_KEY_HERE" > felix.api
```

### 2. **Generate Quiz from PDF File**
```bash
# Generate HTML quiz from PDF
node index.js --html 5 --content lecture.pdf

# Generate JSON quiz from PDF  
node index.js 5 --content lecture.pdf
```

### 3. **Generate Quiz from Text File**
```bash
# Generate HTML quiz from text file
node index.js --html 5 --content notes.txt

# Generate JSON quiz from text file
node index.js 5 --content notes.txt
```

### 4. **Generate Quiz from Direct Content**
```bash
# Generate HTML quiz from direct content
node index.js --html 5 --content "Your lecture content here..."
```

## 📋 Usage Examples

### **HTML Quiz Generation**
```bash
# 5 questions from PDF file
node index.js --html 5 --content slides.pdf

# 8 questions from text file  
node index.js --html 8 --content lecture-notes.txt

# 6 questions from direct content
node index.js --html 6 --content "Machine learning is..."
```

### **JSON Quiz Generation**
```bash
# Generate JSON quiz (original behavior)
node index.js 5 --content lecture.pdf
```

### **Default Content (No Source)**
```bash
# Uses built-in AI content
node index.js --html 5
```

## 🔧 Technical Details

### **Supported File Types**
- ✅ **PDF files** (`.pdf`) - Basic text extraction
- ✅ **Text files** (`.txt`) - Direct text processing  
- ✅ **Markdown files** (`.md`) - Markdown content processing
- ✅ **Direct content** - String input processing

### **Content Processing**
- Automatically cleans and normalizes content
- Handles line endings and formatting
- Removes excessive whitespace
- Validates content length

### **JSON Format Compliance**
The system maintains exact compatibility with `simple-quiz-generator.ts`:
```json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "quiz": {
    "questions": [...]
  },
  "metadata": {
    "pdfTextLength": 2007,
    "numQuestionsRequested": 5,
    "actualQuestionsGenerated": 5,
    "contentSource": "provided"
  }
}
```

## 🎨 Interactive HTML Features

### **Question Types**
- **Multiple Choice (MCQ)** - 4 answer options with radio buttons
- **True/False (TF)** - Simple true/false selection

### **Interactive Elements**
- ✅ Real-time answer selection
- ✅ Visual feedback (correct/incorrect highlighting)
- ✅ Explanations shown after submission
- ✅ Score calculation and results
- ✅ Responsive design for all devices

### **Styling**
- Modern gradient backgrounds
- Smooth animations and hover effects
- Professional typography
- Mobile-friendly layout

## 📁 File Structure

```
AI/
├── felix.api              # Your API key (add this)
├── simple-quiz-generator.ts    # Updated to accept PDF content
├── quiz-to-html.js            # HTML converter with PDF support
├── pdf-processor.js           # PDF content processing utilities
├── index.js                   # Main entry point with --content flag
└── test-pdf-quiz.js          # Test file for PDF integration
```

## 🧪 Testing

### **Run Demo (No API Key Required)**
```bash
node demo-pdf-integration.js
```

### **Test with API Key**
```bash
node test-pdf-quiz.js
```

## 💡 Tips for Best Results

### **Content Quality**
- Use well-structured lecture slides or notes
- Ensure content has clear concepts and definitions
- Include examples and explanations in your source material

### **Question Generation**
- Provide 5-10 questions for good coverage
- Mix of multiple choice and true/false works well
- Longer content generates better, more diverse questions

### **File Preparation**
- For PDFs: Use text-based PDFs for best results
- For text files: Use clear headings and structure
- For direct content: Include key concepts and definitions

## 🔍 Troubleshooting

### **API Key Issues**
- Ensure `felix.api` contains a valid Google Gemini API key
- Check that the file has no extra spaces or newlines

### **Content Processing**
- Very short content (< 100 chars) may generate poor quizzes
- PDF files with images only won't work (need text-based PDFs)
- Special characters in content are handled automatically

### **File Path Issues**
- Use relative paths from the AI directory
- Ensure file exists and is readable
- Check file extensions (.pdf, .txt, .md)

## 🎉 Success!

Your quiz generator now supports:
- ✅ PDF lecture slides
- ✅ Text files and notes  
- ✅ Direct content input
- ✅ Interactive HTML quizzes
- ✅ Exact JSON format compliance
- ✅ Modern, responsive design

Generate quizzes from any content source and create beautiful, interactive learning experiences! 🚀
