declare module 'qr-code-styling' {
  interface Gradient {
    type?: 'linear' | 'radial';
    rotation?: number;
    colorStops?: Array<{
      offset: number;
      color: string;
    }>;
  }

  interface QRCodeStylingOptions {
    width?: number;
    height?: number;
    type?: 'canvas' | 'svg';
    data: string;
    image?: string;
    margin?: number;
    qrOptions?: {
      typeNumber?: number;
      mode?: 'Numeric' | 'Alphanumeric' | 'Byte' | 'Kanji';
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    };
    imageOptions?: {
      hideBackgroundDots?: boolean;
      imageSize?: number;
      margin?: number;
      crossOrigin?: 'anonymous' | 'use-credentials';
      saveAsBlob?: boolean;
    };
    dotsOptions?: {
      color?: string;
      gradient?: Gradient;
      type?: 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
      roundSize?: boolean;
    };
    backgroundOptions?: {
      color?: string;
      gradient?: Gradient;
    };
    cornersSquareOptions?: {
      color?: string;
      gradient?: Gradient;
      type?: 'dot' | 'square' | 'extra-rounded';
    };
    cornersDotOptions?: {
      color?: string;
      gradient?: Gradient;
      type?: 'dot' | 'square';
    };
    nodeCanvas?: any;
    jsDom?: any;
  }

  class QRCodeStyling {
    constructor(options: QRCodeStylingOptions);
    append(element: HTMLElement): void;
    download(fileName?: string): void;
    getRawData(extension?: 'png' | 'jpeg' | 'webp' | 'svg'): Promise<Blob>;
    update(options: QRCodeStylingOptions): void;
    applyExtension(extension: (svg: SVGSVGElement, options: QRCodeStylingOptions) => void): void;
    deleteExtension(): void;
    download(downloadOptions?: { name?: string; extension?: 'png' | 'jpeg' | 'webp' | 'svg' }): Promise<void>;
  }

  export default QRCodeStyling;
}
