import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Import your new assets
import maleSprite      from './assets/male_sprite_cropped.png';
import bottleIcon      from './assets/bottle_icon.png';
import canIcon         from './assets/can.png';
import greenBottleIcon from './assets/greenbottle.png';

export default function App() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('connecting…');
  const dirRef = useRef({ up: 0, down: 0, left: 0, right: 0 });
  const socketRef = useRef(null);
  // holds players, cans, walls, and doorPosition returned by server
  const stateRef = useRef({ players: {}, cans: [], walls: [], doorPosition: null });

  useEffect(() => {
    const socket = io();           // connect to server
    socketRef.current = socket;

    // Pre-load images
    const spriteImg = new Image();
    spriteImg.src = maleSprite;
    const bottleImg = new Image();
    bottleImg.src = bottleIcon;
    const canImg = new Image();
    canImg.src = canIcon;
    const greenImg = new Image();
    greenImg.src = greenBottleIcon;

    // Connection status updates
    socket.on('connect',    () => setStatus(`connected: ${socket.id}`));
    socket.on('disconnect', () => setStatus('disconnected'));

    // Receive entire game state from server
    socket.on('state', (gameState) => {
      stateRef.current = gameState;
    });

    // Handle key presses
    const handleKey = (e, down) => {
      const d = dirRef.current;
      const v = down ? 1 : 0;
      switch (e.key) {
        case 'w':
        case 'ArrowUp':    d.up    = v; break;
        case 's':
        case 'ArrowDown':  d.down  = v; break;
        case 'a':
        case 'ArrowLeft':  d.left  = v; break;
        case 'd':
        case 'ArrowRight': d.right = v; break;
        default:
          return;
      }
      // Normalize direction and send to server
      const dx = (d.right ? 1 : 0) - (d.left ? 1 : 0);
      const dy = (d.down  ? 1 : 0) - (d.up   ? 1 : 0);
      const len = Math.hypot(dx, dy) || 1;
      socket.emit('input', { dx: dx / len, dy: dy / len });
    };

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup',   (e) => handleKey(e, false));

    const ctx = canvasRef.current.getContext('2d');

    // Main render loop
    function loop() {
      const canvas = canvasRef.current;
      const w = canvas.width, h = canvas.height;
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(0, 0, w, h);

      const { players, cans, walls, doorPosition } = stateRef.current;

      // Draw walls if defined
      if (Array.isArray(walls)) {
        ctx.fillStyle = '#444';
        walls.forEach((wall) => {
          ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });
      }

      // Draw door if defined
      if (doorPosition) {
        ctx.fillStyle = '#888';
        ctx.fillRect(doorPosition.x - 5, doorPosition.y - 10, 10, 20);
      }

      // Draw cans / empties with alternating icons
      if (Array.isArray(cans)) {
        const icons = [bottleImg, canImg, greenImg];
        cans.forEach((c, idx) => {
          const icon = icons[idx % icons.length];
          if (icon.complete) {
            // adjust drawing size as needed
            ctx.drawImage(icon, c.x - 12, c.y - 24, 24, 48);
          } else {
            // fallback rectangle while loading
            ctx.fillStyle = '#fa0';
            ctx.fillRect(c.x - 4, c.y - 8, 8, 16);
          }
        });
      }

      // Draw all players with the male sprite
      if (players) {
        Object.values(players).forEach((p) => {
          if (spriteImg.complete) {
            ctx.drawImage(spriteImg, p.x - 16, p.y - 32, 32, 64);
          } else {
            // fallback circle before sprite loads
            ctx.fillStyle = p.color || '#6cf';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // cleanup
    return () => {
      window.removeEventListener('keydown', (e) => handleKey(e, true));
      window.removeEventListener('keyup',   (e) => handleKey(e, false));
      socket.close();
    };
  }, []);

  return (
    <div style={{ color: '#ddd', padding: 16, fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: 8 }}>Brians Empties</h1>
      <div style={{ marginBottom: 8, opacity: 0.8 }}>{status}</div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid #333', background: '#111', width: '800px', height: '600px' }}
      />
      <p style={{ opacity: 0.7, marginTop: 8 }}>WASD / Arrow keys to move</p>
    </div>
  );
}
