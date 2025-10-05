import QRCode from 'qrcode';

interface QRCodeOptions {
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  width?: number;
}

class QRGenerator {
  static async generateQRCode(url: string, options: QRCodeOptions = {}) {
    try {
      const defaultOptions = {
        type: 'image/png' as const,
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

  static async generateQRCodeBuffer(url: string) {
    try {
      const bufferOptions = {
        type: 'png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      };

      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(url, bufferOptions);

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
