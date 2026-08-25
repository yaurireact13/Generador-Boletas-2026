let items = [];
let editIdx = null;
let bNum = 1;
const FILLER = 5;

function fmtD(d) {
  return [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('/');
}

const NOW = new Date();
document.getElementById('f-emision').textContent = fmtD(NOW);
document.getElementById('f-venc').textContent = fmtD(NOW);
document.getElementById('stamp-usr').textContent = `anvicol-caja ${fmtD(NOW)} ${NOW.toTimeString().slice(0, 5)}`;
actualizarNumBoleta();

document.getElementById('ruc-edit').addEventListener('input', function () {
  document.getElementById('ruc-mirror').textContent = this.textContent.trim();
});

function actualizarNumBoleta() {
  document.getElementById('num-boleta').textContent = `B001-${String(bNum).padStart(8, '0')}`;
}

function genCod() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => c[Math.random() * c.length | 0]).join('');
}

function abrirModal(idx = null) {
  editIdx = idx;
  if (idx !== null) {
    const it = items[idx];
    document.getElementById('m-desc').value = it.desc;
    document.getElementById('m-cant').value = it.cant;
    document.getElementById('m-unid').value = it.unid;
    document.getElementById('m-precio').value = it.punit.toFixed(2);
  } else {
    document.getElementById('m-desc').value = '';
    document.getElementById('m-cant').value = '1';
    document.getElementById('m-unid').value = 'UNIDAD';
    document.getElementById('m-precio').value = '';
  }
  calcPrev();
  document.getElementById('overlay').classList.add('open');
  setTimeout(() => document.getElementById('m-desc').focus(), 80);
}

function cerrarModal() {
  document.getElementById('overlay').classList.remove('open');
  editIdx = null;
}

document.getElementById('overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('overlay')) cerrarModal();
});

function calcPrev() {
  const cant = parseFloat(document.getElementById('m-cant').value) || 0;
  const punit = parseFloat(document.getElementById('m-precio').value) || 0;
  const vunit = punit / 1.18;
  const igvU = punit - vunit;
  document.getElementById('pv-vu').textContent = `S/ ${vunit.toFixed(2)}`;
  document.getElementById('pv-ig').textContent = `S/ ${igvU.toFixed(2)}`;
  document.getElementById('pv-pu').textContent = `S/ ${punit.toFixed(2)}`;
  document.getElementById('pv-tt').textContent = `S/ ${(punit * cant).toFixed(2)}`;
}

function guardarItem() {
  const desc = document.getElementById('m-desc').value.trim();
  const cant = parseFloat(document.getElementById('m-cant').value) || 1;
  const unid = document.getElementById('m-unid').value.trim() || 'UNIDAD';
  const punit = parseFloat(document.getElementById('m-precio').value) || 0;
  if (!desc) { alert('Ingresa una descripción.'); return; }
  if (!punit) { alert('Ingresa el precio unitario.'); return; }
  const vunit = punit / 1.18;
  const igvU = punit - vunit;
  const total = punit * cant;
  const item = { desc, cant, unid, punit, vunit, igvU, total, codigo: editIdx !== null ? items[editIdx].codigo : genCod() };
  if (editIdx !== null) items[editIdx] = item; else items.push(item);
  cerrarModal();
  render();
}

function render() {
  const tbody = document.getElementById('tbody');
  let html = '';
  items.forEach((it, i) => {
    html += `<tr>
      <td>${i + 1}</td><td>${it.cant.toFixed(3)}</td><td class="td-d">${it.desc}</td>
      <td><b>${it.total.toFixed(2)}</b></td>
      <td class="no-print" style="white-space:nowrap;padding:3px 4px;">
        <button class="btn btn-edit btn-sm" onclick="abrirModal(${i})">✎</button>
        <button class="btn btn-del btn-sm" onclick="delItem(${i})">✕</button>
      </td>
    </tr>`;
  });
  const fill = Math.max(0, FILLER - items.length);
  for (let f = 0; f < fill; f++) html += '<tr class="empty-row"><td colspan="5">&nbsp;</td></tr>';
  tbody.innerHTML = html;
  totales();
  qrGen();
}

function delItem(i) { items.splice(i, 1); render(); }

function totales() {
  const tot = items.reduce((s, it) => s + it.total, 0);
  const igv = items.reduce((s, it) => s + it.igvU * it.cant, 0);
  const sub = tot - igv;
  document.getElementById('t-grav').textContent = sub.toFixed(2);
  document.getElementById('t-sub').textContent = sub.toFixed(2);
  document.getElementById('t-igv').textContent = igv.toFixed(2);
  document.getElementById('t-total').textContent = tot.toFixed(2);
  document.getElementById('letras').textContent = 'SON: ' + numLetras(tot) + ' SOLES';
}

function numLetras(n) {
  const ent = Math.floor(n), dec = Math.round((n - ent) * 100);
  return enL(ent).toUpperCase() + ' CON ' + String(dec).padStart(2, '0') + '/100';
}

function enL(n) {
  if (!n) return 'CERO';
  const u = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const d = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const c = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
  if (n < 20) return u[n];
  if (n < 100) return d[n / 10 | 0] + (n % 10 ? ' Y ' + u[n % 10] : '');
  if (n === 100) return 'CIEN';
  if (n < 1000) return c[n / 100 | 0] + (n % 100 ? ' ' + enL(n % 100) : '');
  if (n === 1000) return 'MIL';
  if (n < 2000) return 'MIL ' + (n % 1000 ? enL(n % 1000) : '');
  if (n < 1e6) return enL(n / 1000 | 0) + ' MIL' + (n % 1000 ? ' ' + enL(n % 1000) : '');
  return n.toString();
}

function qrGen() {
  const cliente = document.getElementById('cliente').value || 'CLIENTE';
  const dni = document.getElementById('dni').value || '00000000';
  const boleta = document.getElementById('num-boleta').textContent;
  const total = document.getElementById('t-total').textContent;
  const fecha = document.getElementById('f-emision').textContent;
  const ruc = document.getElementById('ruc-edit').textContent.trim();
  const txt = `RUC:${ruc}|${boleta}|${fecha}|${cliente}|DNI:${dni}|TOTAL:S/${total}|www.smartclic.pe`;
  const box = document.getElementById('qr-box');
  box.innerHTML = '';
  new QRCode(box, { text: txt, width: 100, height: 100, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M });
}

['cliente', 'dni'].forEach(id => document.getElementById(id).addEventListener('input', qrGen));

function nuevaBoleta() {
  if (items.length && !confirm('¿Crear nueva boleta? Se perderán los datos actuales.')) return;
  items = []; editIdx = null; bNum++;
  actualizarNumBoleta();
  ['cliente', 'dni', 'direccion', 'obs'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('forma-pago').value = 'YAPE';
  const n = new Date();
  document.getElementById('f-emision').textContent = fmtD(n);
  document.getElementById('f-venc').textContent = fmtD(n);
  document.getElementById('stamp-usr').textContent = `anvicol-caja ${fmtD(n)} ${n.toTimeString().slice(0, 5)}`;
  render();
}

window.addEventListener('load', render);
