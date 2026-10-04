import Phaser from 'phaser';

export function createNeonTextures(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics();

  graphics.fillStyle(0x10182a, 1);
  graphics.fillRect(0, 0, 256, 128);
  graphics.lineStyle(1, 0x233b58, 0.75);
  for (let x = 0; x <= 256; x += 32) graphics.lineBetween(x, 0, x, 128);
  for (let y = 0; y <= 128; y += 32) graphics.lineBetween(0, y, 256, y);
  graphics.lineStyle(2, 0x19d7ec, 0.85);
  graphics.lineBetween(0, 3, 256, 3);
  graphics.generateTexture('neon-ground', 256, 128);
  graphics.clear();

  graphics.fillStyle(0x0b1020, 0.96);
  graphics.fillRect(0, 0, 1024, 360);
  for (let x = 8; x < 1024; x += 46) {
    const width = 24 + ((x * 13) % 22);
    const height = 70 + ((x * 7) % 210);
    graphics.fillStyle(x % 3 === 0 ? 0x111a30 : 0x0e1729, 1);
    graphics.fillRect(x, 360 - height, width, height);
    graphics.lineStyle(1, x % 2 === 0 ? 0x243552 : 0x3d2346, 0.72);
    graphics.strokeRect(x, 360 - height, width, height);
    for (let wy = 360 - height + 14; wy < 342; wy += 21) {
      graphics.fillStyle((x + wy) % 4 === 0 ? 0x35d5e8 : 0xc343a7, 0.58);
      graphics.fillRect(x + 6, wy, 4, 8);
      if (width > 34) graphics.fillRect(x + 16, wy, 4, 8);
    }
  }
  graphics.lineStyle(2, 0x283553, 0.9);
  graphics.lineBetween(0, 359, 1024, 359);
  graphics.generateTexture('city-far', 1024, 360);
  graphics.clear();

  graphics.fillStyle(0x101428, 0.94);
  graphics.fillRect(0, 0, 1024, 260);
  for (let x = 0; x < 1024; x += 68) {
    const width = 38 + ((x * 5) % 26);
    const height = 65 + ((x * 11) % 160);
    graphics.fillStyle(0x11182b, 1);
    graphics.fillRect(x, 260 - height, width, height);
    graphics.lineStyle(2, x % 2 === 0 ? 0x8a39a5 : 0x14758e, 0.7);
    graphics.strokeRect(x + 1, 260 - height + 1, width - 2, height - 1);
    graphics.fillStyle(0x17243a, 1);
    for (let wy = 260 - height + 15; wy < 250; wy += 24) {
      graphics.fillRect(x + 8, wy, width - 16, 3);
    }
  }
  graphics.generateTexture('city-mid', 1024, 260);
  graphics.clear();

  graphics.fillStyle(0x142036, 1);
  graphics.fillRect(4, 4, 104, 84);
  graphics.lineStyle(4, 0x21d8eb, 1);
  graphics.strokeRect(4, 4, 104, 84);
  graphics.lineStyle(2, 0x9c55ff, 0.88);
  graphics.lineBetween(12, 25, 100, 25);
  graphics.lineBetween(12, 64, 100, 64);
  graphics.generateTexture('obstacle-vault', 112, 92);
  graphics.clear();

  graphics.fillStyle(0x163045, 0.98);
  graphics.fillRect(2, 2, 156, 28);
  graphics.lineStyle(3, 0x21d8eb, 1);
  graphics.strokeRect(2, 2, 156, 28);
  graphics.lineStyle(2, 0xf04fba, 0.92);
  graphics.lineBetween(12, 16, 148, 16);
  graphics.generateTexture('obstacle-slide', 160, 32);
  graphics.clear();

  graphics.fillStyle(0x371c3c, 1);
  graphics.fillRect(4, 4, 80, 116);
  graphics.lineStyle(5, 0xec4dbb, 1);
  graphics.strokeRect(4, 4, 80, 116);
  graphics.lineStyle(2, 0x27d8ed, 0.92);
  graphics.lineBetween(18, 16, 70, 108);
  graphics.lineBetween(70, 16, 18, 108);
  graphics.generateTexture('obstacle-jump', 88, 124);
  graphics.clear();

  graphics.fillStyle(0x182138, 1);
  graphics.fillRoundedRect(4, 4, 152, 28, 14);
  graphics.lineStyle(3, 0x9c55ff, 1);
  graphics.strokeRoundedRect(4, 4, 152, 28, 14);
  graphics.lineStyle(2, 0x21d8eb, 0.92);
  graphics.lineBetween(20, 18, 140, 18);
  graphics.generateTexture('obstacle-roll', 160, 36);
  graphics.clear();

  graphics.fillStyle(0x102737, 0.98);
  graphics.fillRect(6, 5, 168, 18);
  graphics.fillRect(6, 5, 12, 75);
  graphics.fillRect(162, 5, 12, 75);
  graphics.lineStyle(3, 0x21d8eb, 1);
  graphics.strokeRect(6, 5, 168, 75);
  graphics.lineStyle(2, 0xf04fba, 0.92);
  graphics.lineBetween(23, 16, 157, 16);
  graphics.generateTexture('obstacle-dash', 180, 84);
  graphics.clear();

  graphics.fillStyle(0x111b31, 1);
  graphics.fillRect(4, 4, 120, 156);
  graphics.lineStyle(4, 0xa644c4, 1);
  graphics.strokeRect(4, 4, 120, 156);
  graphics.lineStyle(2, 0x22d9ed, 0.86);
  for (let y = 24; y < 150; y += 24) graphics.lineBetween(12, y, 116, y);
  for (let x = 30; x < 112; x += 28) graphics.lineBetween(x, 12, x, 148);
  graphics.fillStyle(0xf04fba, 0.95);
  graphics.fillRect(9, 9, 110, 4);
  graphics.generateTexture('obstacle-wall', 128, 168);
  graphics.clear();

  graphics.fillStyle(0xe8faff, 1);
  graphics.fillCircle(6, 6, 6);
  graphics.generateTexture('neon-particle', 12, 12);
  graphics.destroy();
}
