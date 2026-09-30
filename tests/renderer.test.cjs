const fs=require('fs'),vm=require('vm'),assert=require('assert');
const els=new Map();
function el(id){if(!els.has(id))els.set(id,{value:'',checked:false,style:{},dataset:{},textContent:'',tagName:'DIV',classList:{toggle(){}},setAttribute(){},addEventListener(){},append(){},getContext(){return{createImageData(w,h){return{data:new Uint8ClampedArray(w*h*4)}},putImageData(){}}}});return els.get(id)}
Object.entries({controller:'SH1106',resolution:'64',address:'0x3C',board:'esp32',sda:'21',scl:'22',textSize:'1',text:'HELLO OLED'}).forEach(([k,v])=>el(k).value=v);
const sandbox={document:{getElementById:el,querySelectorAll(){return[]},querySelector:el,createElement:el,addEventListener(){}},window:{},Uint8Array,console,setTimeout(){},clearTimeout(){},Blob,URL};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../renderer/app.js'),'utf8'),sandbox);
vm.runInContext(`
function check(v,m){if(!v)throw Error(m)}
check(bitmap().length===1024,'64px bitmap size');
pixels.fill(0);put(0,0);put(7,0);put(8,1);put(127,63);
let packed=bitmap();check(packed[0]===0x81,'MSB left bit order');check(packed[17]===0x80,'row-major layout');check(packed[1023]===1,'bottom-right bit');
for(let y=0;y<H;y++)for(let x=0;x<W;x++)check(Boolean(packed[y*16+(x>>3)]&(0x80>>(x%8)))===Boolean(pixels[y*128+x]),'bitmap roundtrip');
mutate(()=>rect(10,10,20,20));check(pixels[10*128+10]===1,'rectangle');$('undo').onclick();check(pixels[10*128+10]===0,'undo');$('redo').onclick();check(pixels[10*128+10]===1,'redo');
pixels.fill(0);line(0,0,127,63);check(pixels[0]&&pixels[8191],'line endpoints');
ellipse(10,10,30,30);check(pixels[20*128+30]===1,'ellipse edge');
pixels.fill(0);text('A',0,0);check(pixels[1]===1&&pixels[0]===0,'font');
$('resolution').value='32';$('resolution').onchange();check(H===32&&bitmap().length===512&&$('controller').value==='SSD1306','resize controller compatibility');$('undo').onclick();check(H===64,'resize undo');
$('board').value='esp32';$('controller').value='SH1106';check(generate().includes('Wire.begin(SDA_PIN, SCL_PIN)')&&generate().includes('Adafruit_SH1106G'),'ESP32 SH1106');
$('board').value='arduino';$('controller').value='SSD1306';check(generate().includes('SSD1306_SWITCHCAPVCC')&&generate().includes('Wire.begin();'),'Arduino SSD1306');
$('board').value='pi';$('controller').value='SH1106';window.pythonCode=generate();check(window.pythonCode.includes('from luma.oled.device import sh1106'),'Pi controller');
console.log('PASS: pixel packing, full bitmap roundtrip, shapes, text, undo/redo, resize, and three code targets.');
`,sandbox);

