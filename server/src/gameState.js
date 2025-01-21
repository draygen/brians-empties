class GameState {
  constructor() {
    this.players = new Map();
    this.cans = [
      { id: 1, x: 150, y: 100 },
      { id: 2, x: 200, y: 150 },
      { id: 3, x: 300, y: 200 },
      { id: 4, x: 250, y: 250 },
      { id: 5, x: 180, y: 300 },
    ];
    this.walls = [
      { x: 100, y: 100, width: 20, height: 200 },
      { x: 200, y: 50, width: 200, height: 20 },
      { x: 300, y: 200, width: 20, height: 150 },
    ];
    this.doorPosition = { x: 350, y: 50 };
    this.colors = ['red', 'blue', 'green', 'purple', 'orange'];
  }

  addPlayer(id, name) {
    const colorIndex = this.players.size % this.colors.length;
    this.players.set(id, {
      id,
      name,
      x: 50 + Math.random() * 50,
      y: 50 + Math.random() * 50,
      carrying: false,
      score: 0,
      color: this.colors[colorIndex]
    });
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  updatePlayerPosition(id, x, y) {
    const player = this.players.get(id);
    if (player) {
      player.x = x;
      player.y = y;
    }
  }

  collectCan(playerId, canId) {
    const player = this.players.get(playerId);
    if (player && !player.carrying) {
      const canIndex = this.cans.findIndex(can => can.id === canId);
      if (canIndex !== -1) {
        this.cans.splice(canIndex, 1);
        player.carrying = true;
      }
    }
  }

  deliverCans(playerId) {
    const player = this.players.get(playerId);
    if (player && player.carrying) {
      player.carrying = false;
      player.score += 1;
    }
  }

  getState() {
    return {
      players: Object.fromEntries(this.players),
      cans: this.cans,
      walls: this.walls,
      doorPosition: this.doorPosition
    };
  }
}

module.exports = { GameState };