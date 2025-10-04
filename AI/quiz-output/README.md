# Quiz Output Folder

This folder contains all generated interactive HTML quizzes from your quiz generator.

## 📁 File Organization

### **Generated Quiz Files**
- `quiz-[timestamp].html` - Interactive HTML quizzes generated from your content
- `mock-quiz-test.html` - Test quiz with sample content
- `lecture-quiz.html` - Quiz generated from lecture content (if using test files)

### **File Naming Convention**
- `quiz-1759597338633.html` - Quiz generated from L16slides.pdf (File Processing)
- `quiz-1759596830975.html` - Quiz generated from HH-Test-Content.pdf (Adversarial Search)
- `quiz-1759596527903.html` - Quiz generated from HH-Test-Content.pdf (metadata version)

## 🎯 Quiz Sources

### **From PDF Files:**
- **L16slides.pdf** → File Processing & Arrays quiz
- **HH-Test-Content.pdf** → Adversarial Search & Game Theory quiz

### **From Test Content:**
- **Mock Content** → AI and Machine Learning quiz
- **Lecture Content** → Machine Learning concepts quiz

## 🌐 How to Use

1. **Open any HTML file** in your web browser
2. **Take the interactive quiz** with multiple choice and true/false questions
3. **Get immediate feedback** with explanations
4. **View your score** at the end

## 📊 Quiz Features

- ✅ **Interactive Questions** - Multiple choice and true/false
- ✅ **Real-time Feedback** - Immediate correct/incorrect highlighting
- ✅ **Explanations** - Detailed explanations for each answer
- ✅ **Scoring System** - Percentage-based results
- ✅ **Responsive Design** - Works on all devices
- ✅ **Modern UI** - Beautiful gradients and animations

## 🔧 Regenerating Quizzes

To generate new quizzes:

```bash
# Generate from PDF
node index.js --html 5 --content content/your-file.pdf

# Generate from text file
node index.js --html 5 --content content/your-notes.txt

# Generate from direct content
node index.js --html 5 --content "Your lecture content here..."
```

All new quizzes will be automatically saved to this folder with timestamp filenames.

## 📝 Content Quality

The quiz generator now properly extracts:
- ✅ **Actual slide content** (not PDF metadata)
- ✅ **Lecture topics** and concepts
- ✅ **Academic material** for meaningful questions
- ✅ **Proper explanations** based on source content

## 🎉 Success!

Your quiz generator is now fully functional with:
- PDF content integration
- Organized output folder
- Interactive HTML quizzes
- Proper content extraction
- Modern, responsive design

Happy learning! 🚀
