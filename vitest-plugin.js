/**
 * Vite plugin to fix __vite_ssr_exportName__ issues in tests
 */
export default function vitestPlugin() {
  return {
    name: 'vitest-ssr-fix',
    transform(code, id) {
      // Only process project source files
      if (id.includes('node_modules')) return null;

      // Always inject a local shim for Vite SSR export helper
      const shim = `const __vite_ssr_exportName__ = (mod, name, value) => value;\n`;
      if (!code.includes('const __vite_ssr_exportName__')) {
        code = shim + code;
      }

      return {
        code,
        map: null,
      };
    },
  };
}
