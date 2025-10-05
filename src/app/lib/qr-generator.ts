import QRCode from 'qrcode';

class QRGenerator {
  static async generateQRCode(url: string, options: Record<string, unknown> = {}) {
    try {
      const defaultOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        ...options
      };

      // Generate QR code as data URL
      const qrCodeDataURL = await QRCode.toDataURL(url, defaultOptions);

      return {
        success: true,
        dataURL: qrCodeDataURL,
        url: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async generateQRCodeBuffer(url: string, options: Record<string, unknown> = {}) {
    try {
      const defaultOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        ...options
      };

      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(url, defaultOptions);

      return {
        success: true,
        buffer: qrCodeBuffer,
        url: url,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating QR code buffer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  static generateLessonURL(baseURL: string, lessonId: string) {
    // Remove trailing slash from baseURL if present
    const cleanBaseURL = baseURL.replace(/\/$/, '');
    return `${cleanBaseURL}/lesson/${lessonId}`;
  }

  static generateQuizURL(baseURL: string, classId: string, quizId?: string) {
    // Remove trailing slash from baseURL if present
    const cleanBaseURL = baseURL.replace(/\/$/, '');
    return `${cleanBaseURL}/lesson/${classId}${quizId ? `?quiz=${quizId}` : ''}`;
  }
}

export default QRGenerator;
