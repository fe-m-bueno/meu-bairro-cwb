import L from 'leaflet';

export const CATEGORY_ICONS: Record<string, { svg: string; color: string; bg: string }> = {
  saude: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
    svg: '<path d="M12 2v20M2 12h20" stroke="white" stroke-width="3" stroke-linecap="round"/>',
  },
  educacao: {
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
    svg: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  },
  seguranca: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.15)',
    svg: '<path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>',
  },
  transporte: {
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.15)',
    svg: '<rect x="2" y="6" width="20" height="12" rx="3"/><path d="M2 12h20"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  },
  cultura: {
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.15)',
    svg: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  },
};

export function getCategoryIcon(category: string): L.DivIcon {
  const config = CATEGORY_ICONS[category];

  if (!config) {
    return L.divIcon({
      className: '',
      iconSize: [28, 28] as L.PointExpression,
      iconAnchor: [14, 14] as L.PointExpression,
      popupAnchor: [0, -14] as L.PointExpression,
      html: `<div class="category-marker" style="width:28px;height:28px;border-radius:8px;background:rgba(156,163,175,0.15);border:1.5px solid #9ca3af;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:16px;color:#9ca3af;">•</div>`,
    });
  }

  const { color, bg, svg } = config;

  return L.divIcon({
    className: '',
    iconSize: [28, 28] as L.PointExpression,
    iconAnchor: [14, 14] as L.PointExpression,
    popupAnchor: [0, -14] as L.PointExpression,
    html: `<div class="category-marker" style="width:28px;height:28px;border-radius:8px;background:${bg};border:1.5px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></div>`,
  });
}
