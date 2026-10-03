function parseColor(color: string): [number, number, number] | null {
  const hex = /^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(color)?.[1];

  if (hex) {
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((char) => char + char)
            .join('')
        : hex;

    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }

  const rgb = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/i.exec(color);

  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  return null;
}

export function withAlpha(color: string, alpha: number): string {
  const rgb = parseColor(color);

  if (!rgb) {
    return 'transparent';
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}
