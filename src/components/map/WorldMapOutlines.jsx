/**
 * Simplified but recognizable world map continents (equirectangular projection, 800x400)
 * Coordinates roughly: x = (lon + 180) / 360 * 800, y = (90 - lat) / 180 * 400
 *
 * Use transform prop to scale/position for different coordinate systems
 */
export function WorldMapOutlines({
  opacity = 0.15,
  stroke = '#4a90d9',
  strokeWidth = 1,
  fill = 'none',
  className = '',
}) {
  return (
    <g
      className={`world-map ${className}`}
      opacity={opacity}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    >
      {/* North America */}
      <path d="M 80 80 L 120 70 L 160 75 L 180 90 L 200 85 L 220 95 L 210 120 L 195 140 L 180 135 L 165 150 L 140 160 L 120 155 L 100 165 L 85 150 L 75 120 L 80 80 Z" />
      {/* Central America */}
      <path d="M 140 160 L 150 175 L 145 190 L 135 195 L 130 180 L 135 165 Z" />
      {/* South America */}
      <path d="M 155 195 L 175 200 L 185 220 L 195 250 L 185 290 L 170 320 L 150 340 L 140 320 L 145 280 L 140 250 L 150 220 L 155 195 Z" />
      {/* Europe */}
      <path d="M 380 75 L 420 70 L 450 80 L 460 95 L 440 100 L 420 95 L 400 105 L 385 95 L 380 75 Z" />
      {/* British Isles */}
      <path d="M 375 80 L 385 75 L 385 90 L 375 90 Z" />
      {/* Africa */}
      <path d="M 400 130 L 440 125 L 470 140 L 485 170 L 480 210 L 460 250 L 430 280 L 400 270 L 385 240 L 390 200 L 400 160 L 400 130 Z" />
      {/* Middle East */}
      <path d="M 470 120 L 510 115 L 530 130 L 520 150 L 490 155 L 470 140 L 470 120 Z" />
      {/* Russia/Asia */}
      <path d="M 460 65 L 520 55 L 600 50 L 680 60 L 720 75 L 700 95 L 650 90 L 600 95 L 550 90 L 500 95 L 470 85 L 460 65 Z" />
      {/* India */}
      <path d="M 540 150 L 570 145 L 585 170 L 570 210 L 545 200 L 535 170 L 540 150 Z" />
      {/* Southeast Asia */}
      <path d="M 590 160 L 620 155 L 640 170 L 635 190 L 610 195 L 595 180 L 590 160 Z" />
      {/* China/East Asia */}
      <path d="M 600 95 L 660 90 L 700 100 L 695 130 L 670 145 L 630 140 L 600 125 L 600 95 Z" />
      {/* Japan */}
      <path d="M 710 100 L 720 95 L 725 115 L 715 130 L 705 120 L 710 100 Z" />
      {/* Indonesia */}
      <path d="M 620 210 L 680 205 L 710 215 L 700 230 L 650 235 L 620 225 L 620 210 Z" />
      {/* Australia */}
      <path d="M 660 260 L 720 250 L 760 265 L 770 300 L 750 330 L 710 340 L 670 325 L 655 295 L 660 260 Z" />
      {/* New Zealand */}
      <path d="M 785 320 L 795 315 L 800 335 L 790 345 L 785 320 Z" />
    </g>
  );
}

export default WorldMapOutlines;
