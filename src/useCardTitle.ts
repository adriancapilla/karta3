import { useLayoutEffect, useRef } from 'react';

/** Ajusta solo el título completo. El ancho observado y el máximo CSS no dependen del resultado. */
export function useCardTitle(name: string, compact: boolean) {
  const heading = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const band = heading.current;
    if (!band || compact) return;
    const title = band.querySelector('h3')!;
    const icon = band.querySelector<HTMLElement>('.card-round-attribute')!;
    const probe = document.createElement('span');
    probe.setAttribute('aria-hidden', 'true');
    Object.assign(probe.style, { position: 'fixed', visibility: 'hidden', whiteSpace: 'nowrap', width: 'max-content', maxWidth: 'none', padding: '0', border: '0', margin: '0' });
    band.append(probe);
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const base = parseFloat(getComputedStyle(band).getPropertyValue('--card-title-base-size'));
      title.style.fontSize = `${base}px`;
      const style = getComputedStyle(title);
      Object.assign(probe.style, { font: style.font, fontKerning: style.fontKerning, fontFeatureSettings: style.fontFeatureSettings,
        fontVariationSettings: style.fontVariationSettings, letterSpacing: style.letterSpacing, wordSpacing: style.wordSpacing, textTransform: style.textTransform });
      probe.textContent = 'M';
      // Altura de línea al máximo del perfil más sus márgenes originales, incluido el icono.
      const iconStyle = getComputedStyle(icon);
      const height = Math.max(parseFloat(getComputedStyle(probe).height) + parseFloat(style.marginTop) + parseFloat(style.marginBottom),
        parseFloat(iconStyle.height) + parseFloat(iconStyle.marginTop) + parseFloat(iconStyle.marginBottom));
      band.style.height = `${height}px`;
      // Flex ya descuenta icono, gap y márgenes: se mide la caja real disponible del h3.
      const available = title.getBoundingClientRect().width;
      probe.textContent = name;
      const width = (size: number) => { probe.style.fontSize = `${size}px`; return probe.getBoundingClientRect().width; };
      let size = base;
      if (width(base) > available) {
        let low = 120; let high = Math.floor(base * 10); let best = 120;
        while (low <= high) {
          const middle = Math.floor((low + high) / 2);
          if (width(middle / 10) <= available) { best = middle; low = middle + 1; } else high = middle - 1;
        }
        size = best / 10;
      }
      title.style.fontSize = `${size}px`;
      const range = document.createRange(); range.selectNodeContents(title);
      while (size > 12 && range.getBoundingClientRect().width > available + 0.02) {
        size = Math.max(12, Math.round((size - 0.1) * 10) / 10); title.style.fontSize = `${size}px`;
      }
      title.classList.toggle('title-clipped', size === 12 && range.getBoundingClientRect().width > available + 0.02);
      probe.textContent = ''; // No dejar un segundo nombre oculto entre mediciones.
    };
    fit();
    const observer = new ResizeObserver(fit); observer.observe(band);
    window.addEventListener('resize', fit); window.visualViewport?.addEventListener('resize', fit);
    document.fonts.addEventListener('loading', fit); document.fonts.addEventListener('loadingdone', fit); document.fonts.addEventListener('loadingerror', fit);
    void document.fonts.ready.then(fit);
    return () => {
      disposed = true; observer.disconnect(); probe.remove();
      window.removeEventListener('resize', fit); window.visualViewport?.removeEventListener('resize', fit);
      document.fonts.removeEventListener('loading', fit); document.fonts.removeEventListener('loadingdone', fit); document.fonts.removeEventListener('loadingerror', fit);
      band.style.removeProperty('height'); title.style.removeProperty('font-size'); title.classList.remove('title-clipped');
    };
  }, [name, compact]);
  return heading;
}
