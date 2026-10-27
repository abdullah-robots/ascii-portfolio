export const PALETTES = {
  phosphor: { label: 'PHOSPHOR', rgb: [215, 255, 139] },
  amber: { label: 'AMBER', rgb: [255, 183, 104] },
  ice: { label: 'ICE', rgb: [152, 218, 243] },
} as const;

export type Palette = keyof typeof PALETTES;

export function nextPalette(palette: Palette): Palette {
  switch (palette) {
    case 'phosphor':
      return 'amber';
    case 'amber':
      return 'ice';
    case 'ice':
      return 'phosphor';
  }
}
