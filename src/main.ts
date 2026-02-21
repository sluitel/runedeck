import { GameManager } from './game/GameManager';
import { Renderer } from './ui/Renderer';

// Initialize game
const gameRoot = document.getElementById('game-root');
if (!gameRoot) {
  throw new Error('Game root element not found');
}

const gameManager = new GameManager();
const renderer = new Renderer(gameRoot, gameManager);

// Initial render
renderer.render();

// Prevent default touch behaviors that interfere with gameplay
document.addEventListener('touchmove', (e) => {
  if (e.target && (e.target as HTMLElement).closest('.hand-cards')) {
    // Allow card dragging
    return;
  }
  // Prevent pull-to-refresh and overscroll
  if ((e.target as HTMLElement).closest('.deck-view-cards, .shop-content, .vault-content, .reward-content')) {
    return; // Allow scrolling in scrollable areas
  }
}, { passive: true });

// Prevent double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// Prevent context menu on long press
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Log startup
console.log('Runedeck initialized');
