const MAX_PROJECT_BYTES = 100000;
function validateProject(value) {
  if (!value || value.format !== 'oled-studio' || value.version !== 1) throw new Error('This is not a supported OLED Studio project.');
  if (value.width !== 128 || ![32, 64].includes(value.height)) throw new Error('Unsupported display resolution.');
  if (!Array.isArray(value.pixels) || value.pixels.length !== 128 * value.height || value.pixels.some(p => p !== 0 && p !== 1)) throw new Error('The project pixel data is invalid.');
  const s = value.settings;
  if (!s || !['SH1106','SSD1306'].includes(s.controller) || !['0x3C','0x3D'].includes(s.address) || !['esp32','arduino','pi'].includes(s.board)) throw new Error('The project display settings are invalid.');
  if (value.height === 32 && s.controller === 'SH1106') throw new Error('SH1106 projects require 128 × 64 pixels.');
  for (const key of ['sda','scl']) if (!Number.isInteger(s[key]) || s[key] < 0 || s[key] > 48) throw new Error('Invalid ESP32 pin settings.');
  return {format:'oled-studio', version:1, width:128, height:value.height, pixels:[...value.pixels], settings:{controller:s.controller,address:s.address,board:s.board,sda:s.sda,scl:s.scl}};
}
function parseProject(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > MAX_PROJECT_BYTES) throw new Error('The project file is too large.');
  return validateProject(JSON.parse(text));
}
module.exports = {validateProject,parseProject,MAX_PROJECT_BYTES};
