import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function App() {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('connecting…');
  const dirRef = useRef({dx:0, dy:0});
  const socketRef = useRef(null);
  const stateRef = useRef({}); // players

  useEffect(() => {
    const socket = io(); // same-origin
    socketRef.current = socket;

    socket.on('connect', () => setStatus(`connected: ${socket.id}`));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('state', (players) => {
      stateRef.current = players;
    });

    const key = (e, down) => {
      const d = dirRef.current;
      const set = (k, v) => { d[k] = v; };
      const on = down ? 1 : 0;

      if (e.key === 'w' || e.key === 'ArrowUp')    set('up', on);
      if (e.key === 's' || e.key === 'ArrowDown')  set('down', on);
      if (e.key === 'a' || e.key === 'ArrowLeft')  set('left', on);
      if (e.key === 'd' || e.key === 'ArrowRight') set('right', on);

      const dx = (d.right?1:0) - (d.left?1:0);
      const dy = (d.down?1:0)  - (d.up?1:0);
      const len = Math.hypot(dx, dy) || 1;
      socket.emit('input', { dx: dx/len, dy: dy/len });
    };

    window.addEventListener('keydown', e => key(e, true));
    window.addEventListener('keyup',   e => key(e, false));

    const ctx = canvasRef.current.getContext('2d');

    function loop() {
      const w = canvasRef.current.width;
      const h = canvasRef.current.height;
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(0,0,w,h);

      const players = stateRef.current;
      for (const id in players) {
        const p = players[id];
        ctx.beginPath();
        ctx.fillStyle = p.color || '#6cf';
        ctx.arc(p.x, p.y, 10, 0, Math.PI*2);
        ctx.fill();
      }

      requestAnimationFrame(loop);
    }
    loop();

    return () => {
      window.removeEventListener('keydown', e => key(e, true));
      window.removeEventListener('keyup',   e => key(e, false));
      socket.close();
    };
  }, []);

  return (
    <div style={{color:'#ddd', padding:16, fontFamily:'system-ui'}}>
      <h1 style={{marginBottom:8}}>Brians Empties</h1>
      <div style={{marginBottom:8, opacity:.8}}>{status}</div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{border:'1px solid #333', background:'#111', width:'800px', height:'600px'}}
      />
      <p style={{opacity:.7, marginTop:8}}>WASD / Arrow keys to move</p>
    </div>
  );
}
