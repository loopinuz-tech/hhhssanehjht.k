/// <reference types="vite/client" />

interface Window {
  ym: {
    (id: number, method: string, ...args: unknown[]): void;
    a?: unknown[][];
  };
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>;
    }
  }
}

interface MathfieldElement extends HTMLElement {
  value: string;
  latex: string;
  selection: [number, number];
  insert(text: string, options?: { mode?: string; format?: string }): boolean;
  executeCommand(command: string): boolean;
  focus(): void;
  blur(): void;
}

export {};
