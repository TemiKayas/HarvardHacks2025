import fs from 'fs';

/**
 * Extract text content from PDF files using pdf-parse library
 * @param {string} pdfPath - Path to PDF file
 */
export async function extractTextFromPDF(pdfPath) {
  try {
    console.log('📄 Extracting text from PDF using pdf-parse...');

    // Dynamic import for pdf-parse
    const pdfModule = await import('pdf-parse');
    const pdf = pdfModule.default || pdfModule;

    // Read the PDF file
    const dataBuffer = fs.readFileSync(pdfPath);

    // Parse the PDF and extract text
    const data = await pdf(dataBuffer, {
      // Options for better text extraction
      max: 0, // No page limit
    });

    // Clean up the extracted text
    const cleanedContent = data.text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log(`✅ PDF processed: ${cleanedContent.length} characters extracted`);
    console.log(`📊 PDF info: ${data.numpages} pages, ${data.info?.Title || 'No title'}`);

    // Show first 200 characters for verification
    console.log(`📄 Content preview: ${cleanedContent.substring(0, 200)}...`);

    return cleanedContent;
  } catch (error) {
    console.error('❌ Error reading PDF file:', error.message);
    throw new Error(`Failed to read PDF file: ${error.message}`);
  }
}

/**
 * Extract text content from PDF base64 string or buffer
 * @param {string|Buffer} pdfData - Base64 string or Buffer containing PDF data
 */
export async function extractTextFromPDFData(pdfData) {
  try {
    console.log('📄 Extracting text from PDF data using pdf-parse...');

    // Dynamic import for pdf-parse
    const pdfModule = await import('pdf-parse');
    const pdf = pdfModule.default || pdfModule;

    // Convert base64 to buffer if needed
    let dataBuffer;
    if (typeof pdfData === 'string') {
      dataBuffer = Buffer.from(pdfData, 'base64');
    } else {
      dataBuffer = pdfData;
    }

    // Parse the PDF and extract text
    const data = await pdf(dataBuffer, {
      max: 0, // No page limit
    });

    // Clean up the extracted text
    const cleanedContent = data.text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log(`✅ PDF processed: ${cleanedContent.length} characters extracted`);
    console.log(`📊 PDF info: ${data.numpages} pages, ${data.info?.Title || 'No title'}`);

    return cleanedContent;
  } catch (error) {
    console.error('❌ Error reading PDF data:', error.message);
    throw new Error(`Failed to read PDF data: ${error.message}`);
  }
}

/**
 * Process lecture slides or content from a text file
 */
export function extractTextFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.trim();
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Process content from a string (for direct input)
 */
export function processContent(content) {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }

  // Basic content cleanup
  const cleanedContent = content
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
    .trim();

  if (cleanedContent.length < 100) {
    console.warn('⚠️ Warning: Content seems very short. Quiz quality may be limited.');
  }

  return cleanedContent;
}

/**
 * Get content from various sources (file path, direct content, or default)
 */
export async function getContentFromSource(source) {
  if (!source) {
    console.log('📝 No content source provided, using default AI content');
    return null;
  }

  if (typeof source === 'string') {
    // Check if it's a file path
    if (source.endsWith('.pdf') || source.endsWith('.txt') || source.endsWith('.md')) {
      console.log(`📄 Reading content from file: ${source}`);
      if (source.endsWith('.pdf')) {
        return await extractTextFromPDF(source);
      } else {
        return extractTextFromFile(source);
      }
    } else {
      // Treat as direct content
      console.log('📝 Processing provided content directly');
      return processContent(source);
    }
  }

  throw new Error('Content source must be a string (file path or content)');
}
