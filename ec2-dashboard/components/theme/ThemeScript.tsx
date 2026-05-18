/**
 * ThemeScript — script inline que se ejecuta antes del paint del navegador.
 * Evita el flash de tema incorrecto (FOIT) aplicando data-theme antes del render de React.
 */
import { THEME_STORAGE_KEY } from '@/lib/theme';

const SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
