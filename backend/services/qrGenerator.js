import QRCode from 'qrcode';

class QRGenerator {
  static async generateQRCode(url, options = {}) {
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
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static async generateQRCodeBuffer(url, options = {}) {
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
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static generateLessonURL(baseURL, lessonId) {
    // Remove trailing slash from baseURL if present
    const cleanBaseURL = baseURL.replace(/\/$/, '');
    return `${cleanBaseURL}/lesson/${lessonId}`;
  }
}

export default QRGenerator;