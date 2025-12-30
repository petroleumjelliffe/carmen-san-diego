import L from 'leaflet';

/**
 * Create a custom Leaflet icon with emoji and variant styling
 * @param {string} emoji - The emoji to display (e.g., "🏛️", "🔍")
 * @param {string} variant - The style variant: 'current', 'destination', or 'disabled'
 * @returns {L.DivIcon} - Leaflet DivIcon instance
 */
export const createCustomIcon = (emoji, variant = 'destination') => {
  return L.divIcon({
    html: `
      <div class="custom-marker ${variant}">
        <span class="emoji">${emoji}</span>
      </div>
    `,
    className: 'leaflet-custom-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};
