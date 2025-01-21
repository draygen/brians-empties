import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Trash2, Beer, DoorClosed } from 'lucide-react';

// Replace the socket connection line with:
const socket = io(window.location.origin);

const Game = () => {
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState({
    players: {},
    cans: [],
    walls: [],
    doorPosition: { x: 350, y: 50 }
  });

  useEffect(() => {
    socket.on('game_state', (newState) => {
      setGameState(newState);
    });

    return () => {
      socket.off('game_state');
      socket.disconnect();
    };
  }, []);

  const handleStartGame = () => {
    if (playerName.trim()) {
      socket.emit('join_game', { playerName });
      setGameStarted(true);
    }
  };

  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyPress = (e) => {
      const moveSpeed = 5;
      const player = gameState.players[socket.id];
      if (!player) return;

      let newPos = { x: player.x, y: player.y };

      switch(e.key) {
        case 'ArrowUp':
          newPos.y = Math.max(0, player.y - moveSpeed);
          break;
        case 'ArrowDown':
          newPos.y = Math.min(350, player.y + moveSpeed);
          break;
        case 'ArrowLeft':
          newPos.x = Math.max(0, player.x - moveSpeed);
          break;
        case 'ArrowRight':
          newPos.x = Math.min(350, player.x + moveSpeed);
          break;
        default:
          return;
      }

      // Check wall collisions
      const hasCollision = gameState.walls.some(wall => (
        newPos.x > wall.x - 15 && 
        newPos.x < wall.x + wall.width + 15 && 
        newPos.y > wall.y - 15 && 
        newPos.y < wall.y + wall.height + 15
      ));

      if (!hasCollision) {
        socket.emit('player_move', newPos);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameState]);

  useEffect(() => {
    if (!gameStarted) return;

    const player = gameState.players[socket.id];
    if (!player) return;

    // Check for can collection
    if (!player.carrying) {
      const canCollected = gameState.cans.find(can => 
        Math.abs(can.x - player.x) < 20 && 
        Math.abs(can.y - player.y) < 20
      );

      if (canCollected) {
        socket.emit('collect_can', canCollected.id);
      }
    }

    // Check for delivery to door
    if (player.carrying && 
        Math.abs(gameState.doorPosition.x - player.x) < 30 && 
        Math.abs(gameState.doorPosition.y - player.y) < 30) {
      socket.emit('deliver_cans');
    }
  }, [gameStarted, gameState]);

  if (!gameStarted) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Enter your name to start
              </label>
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-2 border-2 border-gray-300 rounded-lg"
                placeholder="Your name"
              />
            </div>
            <button
              onClick={handleStartGame}
              className="w-full bg-blue-500 text-white rounded-lg py-2 px-4 hover:bg-blue-600"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="bg-blue-50 relative w-96 h-96 border-4 border-gray-800 rounded-lg overflow-hidden">
        {gameState.walls.map((wall, index) => (
          <div
            key={index}
            className="absolute bg-gray-700"
            style={{
              left: wall.x,
              top: wall.y,
              width: wall.width,
              height: wall.height
            }}
          />
        ))}

        {Object.values(gameState.players).map(player => (
          <div 
            key={player.id}
            className="absolute transition-all duration-100 animate-bounce"
            style={{ 
              left: player.x, 
              top: player.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div 
              className={`absolute w-32 text-center -top-6 left-1/2 transform -translate-x-1/2 
                         bg-white bg-opacity-75 rounded px-2 py-1 text-sm font-bold text-${player.color}-500`}
            >
              {player.name}
            </div>
            <Trash2 
              size={32} 
              className={`${player.carrying ? 'text-yellow-500' : `text-${player.color}-500`} 
                         transition-colors duration-300`}
            />
          </div>
        ))}

        {gameState.cans.map(can => (
          <div
            key={can.id}
            className="absolute animate-pulse"
            style={{
              left: can.x,
              top: can.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Beer size={24} className="text-amber-500" />
          </div>
        ))}

        <div 
          className="absolute animate-pulse"
          style={{
            left: gameState.doorPosition.x,
            top: gameState.doorPosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <DoorClosed size={40} className="text-brown-700" />
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="flex justify-center gap-8">
          {Object.values(gameState.players).map(player => (
            <p key={player.id} className={`text-xl font-bold text-${player.color}-500`}>
              {player.name}: {player.score} cans
            </p>
          ))}
        </div>
        <p className="mt-2 text-gray-600">
          Use arrow keys to move. Pick up cans and take them to the door.
        </p>
      </div>
    </div>
  );
};

export default Game;