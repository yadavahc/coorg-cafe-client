import QRCode from 'qrcode';

/**
 * Generates a QR code for a given text as a Data URL.
 * @param text The string to encode in the QR code.
 * @returns A Promise that resolves to the QR code Data URL.
 */
export async function generateQR(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 512,
      margin: 2,
      color: {
        dark: '#3E2723', // Primary brown
        light: '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    throw err;
  }
}
