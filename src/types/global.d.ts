// Global type definitions for browser APIs

interface VisualViewport extends EventTarget {
  readonly height: number;
  readonly width: number;
  readonly offsetLeft: number;
  readonly offsetTop: number;
  readonly pageLeft: number;
  readonly pageTop: number;
  readonly scale: number;
  addEventListener(type: 'resize' | 'scroll', listener: (this: VisualViewport, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: 'resize' | 'scroll', listener: (this: VisualViewport, ev: Event) => any, options?: boolean | EventListenerOptions): void;
}

declare global {
  interface Window {
    visualViewport?: VisualViewport;
  }
}

export {};