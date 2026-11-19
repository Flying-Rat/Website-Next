import type { ComponentType, RefObject } from 'react';

/** What the About section hands a demo. */
export type AboutDemoProps = {
  /** The About section itself. Listen on it; leave its markup and its styles alone. */
  frame: RefObject<HTMLElement | null>;
  /**
   * The block of copy beside the demo. With `splitCopy` its pieces are spans
   * marked `data-target`; its horizontal rules are always marked `data-rule`.
   */
  copy: RefObject<HTMLElement | null>;
  animate: boolean;
};

/**
 * An interactive piece that shares the About section with the copy.
 *
 * The component is rendered as a direct child of the section, once the page is
 * idle, and positions itself there: over the copy on small screens, beside it
 * from `md` up. Everything else it needs from the section it asks for here, so
 * the section never has to know which demo it is showing.
 */
export type AboutDemo = {
  /** Loaded on its own chunk; wrap the import in `next/dynamic` with `ssr: false`. */
  Component: ComponentType<AboutDemoProps>;
  /** Height the section keeps clear above the copy on small screens. */
  clearance: string;
  /** Extra classes for the copy column, for a demo that needs it another width. */
  copyWidth?: string;
  /**
   * Have the copy cut into `data-target` spans the demo can move: the title
   * always by letter, the paragraphs by word or by letter.
   */
  splitCopy?: 'words' | 'letters';
  /** Extra classes for the section itself, such as a cursor. */
  section?: string;
};
