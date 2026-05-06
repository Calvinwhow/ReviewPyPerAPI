/**
 * Keyboard-only skip link. Hidden until focused, then jumps to <main id="main">.
 * WCAG 2.4.1 (Bypass Blocks).
 */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-foreground focus:text-background focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
