declare module 'html-to-image' {
  export function toSvg(node: HTMLElement, options?: Options): Promise<string>;
  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: Options): Promise<string>;
  export function toBlob(node: HTMLElement, options?: Options): Promise<Blob>;
  export function toPixelData(node: HTMLElement, options?: Options): Promise<Uint8ClampedArray>;
  export function toCanvas(node: HTMLElement, options?: Options): Promise<HTMLCanvasElement>;
  
  interface Options {
    filter?: (node: HTMLElement) => boolean;
    backgroundColor?: string;
    width?: number;
    height?: number;
    style?: Record<string, string>;
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
    pixelRatio?: number;
    skipFonts?: boolean;
    fontEmbedCSS?: string;
  }
}
