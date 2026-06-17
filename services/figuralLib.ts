
/**
 * Figural Library for Procedural Generation
 * Provides SVG components and patterns for figural reasoning tests.
 */

export const FIGURAL_PATTERNS = {
  SHAPES: [
    'rect', 'circle', 'polygon', 'path', 'star'
  ],
  TRANSFORMATIONS: [
    'rotate', 'mirror', 'scale', 'shade'
  ]
};

export const generateShape = (type: string, props: any) => {
  switch (type) {
    case 'circle':
      return `<circle cx="${props.x}" cy="${props.y}" r="${props.size}" stroke="${props.stroke}" fill="${props.fill}" stroke-width="${props.strokeWidth}" />`;
    case 'rect':
      return `<rect x="${props.x - props.size}" y="${props.y - props.size}" width="${props.size * 2}" height="${props.size * 2}" stroke="${props.stroke}" fill="${props.fill}" stroke-width="${props.strokeWidth}" />`;
    case 'polygon':
      const sides = props.sides || 3;
      const points = [];
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
        points.push(`${props.x + Math.cos(angle) * props.size},${props.y + Math.sin(angle) * props.size}`);
      }
      return `<polygon points="${points.join(' ')}" stroke="${props.stroke}" fill="${props.fill}" stroke-width="${props.strokeWidth}" />`;
    default:
      return '';
  }
};

export const getProceduralSvg = (seed: string) => {
  // Simple seed-based generation to ensure consistency
  const s = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const rand = (max: number) => (s * 1103515245 + 12345) % 2147483648 % max;
  
  // Example complex SVG generation logic
  // This is a placeholder for the "Generator Figural Prosedural"
  return `
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="gray" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="none" stroke="#ccc" />
      ${generateShape('polygon', { x: 100, y: 100, size: 50, stroke: '#4f46e5', fill: 'none', strokeWidth: 3, sides: 3 + (rand(4)) })}
      <circle cx="100" cy="100" r="10" fill="#4f46e5" />
    </svg>
  `;
};
