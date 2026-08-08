// 打 ZIP 包 - 用纯 Node.js 写入，保留目录结构
// 路径：项目根目录 deploy/pack.cjs
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 解析根目录（deploy 的父目录）
const ROOT = path.resolve(__dirname, '..');
const RELEASES = path.join(ROOT, 'releases');
if (!fs.existsSync(RELEASES)) fs.mkdirSync(RELEASES, { recursive: true });

const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
const VERSION = process.env.VERSION || '1.3.0';
const outZip = path.join(RELEASES, `hardproblems-v${VERSION}-source-${ts}.zip`);

const excludes = [
  'node_modules', 'data', 'screenshots', '.git', 'releases',
  '*.log', '*.zip', '*.tar.gz', '*.tgz',
  'dist', '.cache', 'coverage', '.nyc_output',
  '.DS_Store', 'Thumbs.db', 'pack.cjs', 'screenshot*.cjs',
  'e2e_test.cjs', 'e2e_test_v2.cjs', 'e2e_v*.cjs', 'perf_audit.cjs', 'verify_mcode.cjs',
  'check_*.js', 'debug_*.cjs',
  // 大图：保留到 192，384/512 太大省略（生成时再生成）
  'icon-512.png', 'icon-384.png'
];

function shouldExclude(p) {
  const rel = p.replace(ROOT + path.sep, '').replace(/\\/g, '/');
  const base = path.basename(p);
  for (const ex of excludes) {
    if (rel === ex) return true;
    if (rel.startsWith(ex + '/')) return true;
    if (rel.includes('/' + ex + '/')) return true;
    if (base === ex) return true;  // 任意目录下的同名文件
  }
  return false;
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (shouldExclude(full)) continue;
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT);
console.log(`[INFO] 找到 ${files.length} 个文件`);

// 写 ZIP（store + deflate 混合）
function crc32(buf) {
  let c, crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crcTable[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const chunks = [];
const central = [];
let offset = 0;

for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const data = fs.readFileSync(f);
  const compressed = zlib.deflateRawSync(data, { level: 9 });
  const useDeflate = compressed.length < data.length;
  const final = useDeflate ? compressed : data;
  const method = useDeflate ? 8 : 0;
  const crc = crc32(data);

  // Local file header
  const nameBuf = Buffer.from(rel, 'utf-8');
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);     // signature
  local.writeUInt16LE(20, 4);              // version
  local.writeUInt16LE(0, 6);               // flags
  local.writeUInt16LE(method, 8);          // method
  local.writeUInt16LE(0, 10);              // time
  local.writeUInt16LE(0, 12);              // date
  local.writeUInt32LE(crc, 14);            // crc
  local.writeUInt32LE(final.length, 18);   // compressed size
  local.writeUInt32LE(data.length, 22);    // uncompressed size
  local.writeUInt16LE(nameBuf.length, 26); // name len
  local.writeUInt16LE(0, 28);              // extra len
  chunks.push(local, nameBuf, final);

  // Central directory header
  const cd = Buffer.alloc(46);
  cd.writeUInt32LE(0x02014b50, 0);         // signature
  cd.writeUInt16LE(20, 4);                  // version made by
  cd.writeUInt16LE(20, 6);                  // version needed
  cd.writeUInt16LE(0, 8);                   // flags
  cd.writeUInt16LE(method, 10);             // method
  cd.writeUInt16LE(0, 12);                  // time
  cd.writeUInt16LE(0, 14);                  // date
  cd.writeUInt32LE(crc, 16);                // crc
  cd.writeUInt32LE(final.length, 20);       // compressed
  cd.writeUInt32LE(data.length, 24);        // uncompressed
  cd.writeUInt16LE(nameBuf.length, 28);     // name len
  cd.writeUInt16LE(0, 30);                  // extra
  cd.writeUInt16LE(0, 32);                  // comment
  cd.writeUInt16LE(0, 34);                  // disk
  cd.writeUInt16LE(0, 36);                  // internal attrs
  cd.writeUInt32LE(0, 38);                  // external attrs
  cd.writeUInt32LE(offset, 42);             // local header offset
  central.push(cd, nameBuf);

  offset += local.length + nameBuf.length + final.length;
}

const localSize = offset;

// End of central directory
const eocd = Buffer.alloc(22);
eocd.writeUInt32LE(0x06054b50, 0);
eocd.writeUInt16LE(0, 4);
eocd.writeUInt16LE(0, 6);
eocd.writeUInt16LE(files.length, 8);
eocd.writeUInt16LE(files.length, 10);
eocd.writeUInt32LE(Buffer.concat(central).length, 12);
eocd.writeUInt32LE(localSize, 16);
eocd.writeUInt16LE(0, 20);

const out = Buffer.concat([...chunks, ...central, eocd]);
fs.writeFileSync(outZip, out);

const stat = fs.statSync(outZip);
console.log(`[OK] ${outZip}`);
console.log(`[OK] ${files.length} files, ${(stat.size / 1024).toFixed(1)} KB`);

// 验证
console.log('\n[INFO] ZIP 内容预览:');
for (let i = 0; i < Math.min(20, files.length); i++) {
  const rel = path.relative(ROOT, files[i]).replace(/\\/g, '/');
  const sz = fs.statSync(files[i]).size;
  console.log(`  ${rel.padEnd(50)} ${sz.toString().padStart(8)} bytes`);
}
console.log(`  ... and ${files.length - 20} more`);
