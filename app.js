/* ============================================================================
   ENIGMA MOSTRADOR — app de la tablet
   Buscar / crear artículos en Loyverse, etiquetas 50x30 (normal y oferta), ticket de cambio para
   regalos, registro del cambio en Loyverse, costos (encargada), precios en lote, stock y equipo.
   Imprime directo desde la tablet: USB, Bluetooth BLE, RawBT (USB/BT clásico/red), compartir, sistema.
   ============================================================================ */
(function () {
  'use strict';

  // ── Constantes ───────────────────────────────────────────────────────────
  var API_DEFECTO = 'https://script.google.com/macros/s/AKfycbyYWy1wrOxgNs-Ol0j8hV-odmaUL0rX-tpzlwvBX0n8av9SZWsBIJ6c6z2SeMRX4jggYg/exec';
  var DPMM = 8; // 203 dpi
  var RESERVA_SKUS = 10;   // códigos guardados en la tablet para poder dar de alta sin internet
  var VERSION_APP = '21'; // tiene que coincidir con <meta name="app-version"> de index.html
  var ESPERA_API = 35000;  // ms antes de dar una llamada por perdida
  var DISENO_FABRICA = {
    encabezado: 'Enigma', encFuente: "'Pinyon Script', Georgia, serif", encTam: 38, encTrazo: 0.8,
    nomTam: 22, nomLineas: 2, preTam: 34, preFormato: '$ #',
    barAlto: 60, barMod: 2, barTexto: true, marco: false,
    ofertaTexto: 'OFERTA', ofertaTachado: true,
    anchoMm: 50, altoMm: 30, margenMm: 1.5, gapMm: 2,
    densidad: 8, velocidad: 4, direccion: 1, invertirBits: false, ticketAncho: 48
  };
  // Los iconos que el JS necesita dibujar. Mismos trazos que los del HTML.
  var I_ = {
    aviso: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/></svg>',
    baja: '<svg class="i" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14"/></svg>',
    cambio: '<svg class="i" viewBox="0 0 24 24"><path d="M3 8h13a4 4 0 0 1 0 8h-2"/><path d="m6 5-3 3 3 3"/><path d="M21 16H8a4 4 0 0 1 0-8h2"/><path d="m18 19 3-3-3-3"/></svg>',
    candado: '<svg class="i" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    costo: '<svg class="i" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 12h.01M18 12h.01"/></svg>',
    deshacer: '<svg class="i" viewBox="0 0 24 24"><path d="M4 9h11a5 5 0 0 1 0 10h-3"/><path d="m8 5-4 4 4 4"/></svg>',
    etiqueta: '<svg class="i" viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z"/><path d="M7.5 7.5h.01"/></svg>',
    mas: '<svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    oferta: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3c1.5 3.5 5 4.5 5 8.5A5 5 0 0 1 7 12c0-1.5.5-2.5 1.5-3.5C9 11 11 11 11 11s-1.5-4 1-8Z"/></svg>',
    precio: '<svg class="i" viewBox="0 0 24 24"><path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2.2 2.8 5 3.5 5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3"/></svg>',
    regalo: '<svg class="i" viewBox="0 0 24 24"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z"/></svg>',
    stock: '<svg class="i" viewBox="0 0 24 24"><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    usuario: '<svg class="i" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="8" r="3.6"/></svg>',
    _: 0
  };
  var EJEMPLO = { nombre: 'Buzo Oversize Gris Melange', sku: '11917', precio: 45000, precioAnterior: 52000 };
  var PALABRAS_CATEGORIA = [
    ['camisa', 'camisas'], ['remera', 'remeras'], ['buzo', 'buzo'], ['sueter', 'sueteres'], ['sweater', 'sueteres'], ['pantalon', 'pantalones'], ['jean', 'pantalones'],
    ['pollera', 'pollera'], ['falda', 'pollera'], ['vestido', 'vestidos'], ['campera', 'camperas'], ['tapado', 'camperas'], ['blazer', 'blazers'], ['saco', 'blazers'],
    ['top', 'top'], ['conjunto', 'conjuntos'], ['short', 'short'], ['musculosa', 'musculosas'], ['body', 'bodys'], ['polera', 'poleras'], ['chaleco', 'chalecos'],
    ['camiseta', 'camisetas'], ['cinto', 'accesorios'], ['cartera', 'accesorios'], ['gorro', 'accesorios'], ['bufanda', 'accesorios'], ['aro', 'accesorios'], ['collar', 'accesorios']
  ];

  // ── Estado ───────────────────────────────────────────────────────────────
  var S = {
    api: localStorage.getItem('em_api') || API_DEFECTO,
    key: localStorage.getItem('em_key') || '',
    dev: localStorage.getItem('em_dev') || '',   // esta tablet, vinculada con un codigo de un solo uso
    alertas: [],
    dispositivo: localStorage.getItem('em_dispositivo') || 'Tablet mostrador',
    transporte: localStorage.getItem('em_transporte') || 'usb',
    transporteTicket: localStorage.getItem('em_transporte_ticket') || 'rawbt',
    diseno: cargarDisenoLocal_(),
    nombreConPrecio: localStorage.getItem('em_nombre_precio') !== 'no',
    diasCambio: 30, ticketTexto: '', controlStock: true, enUso: false,
    sesion: localStorage.getItem('em_sesion') || '', empleado: null, bloqueado: false, destinoLogin: '',
    bloqueoMin: Number(localStorage.getItem('em_bloqueo') || 60),
    online: navigator.onLine !== false, flushing: false,
    cola: [], skus: [], verificadores: {}, skuDesde: 20001,
    catalogo: [], categorias: [], pagos: [], proximoSku: null, ultimaSync: '',
    actual: null, vista: 'buscar', etiquetaOferta: false,
    // La última actividad se guarda en la tablet: cerrar y abrir la app no reinicia la hora sin uso.
    recientes: [], ultimaActividad: Number(localStorage.getItem('em_ultima_actividad') || 0),
    impresora: { conectada: false, nombre: '', usb: null, usbEp: 0, ble: null, bleChar: null, bleSinRespuesta: false },
    ticketera: { conectada: false, nombre: '', usb: null, usbEp: 0, ble: null, bleChar: null, bleSinRespuesta: false },
    tc: { venta: null }, cb: { venta: null, devolver: {}, entregar: [], pagoId: '', resultado: null }, pr: { seleccion: {}, modo: 'porcentaje', cambiados: [] }
  };
  try { S.empleado = JSON.parse(localStorage.getItem('em_empleado') || 'null'); } catch (e) { S.empleado = null; }

  function cargarDisenoLocal_() {
    try { var d = JSON.parse(localStorage.getItem('em_diseno') || 'null'); return migrarMarca_(Object.assign({}, DISENO_FABRICA, d || {})); }
    catch (e) { return Object.assign({}, DISENO_FABRICA); }
  }
  /**
   * Hasta el 23/08/2026 el encabezado de la etiqueta iba en Georgia. Ahora va en la caligrafia
   * del logo de Enigma. Las tablets que ya tenian un diseno guardado se pasan UNA sola vez;
   * si despues alguien elige otra letra a mano, se respeta.
   */
  function migrarMarca_(d) {
    if (localStorage.getItem('em_marca') === '1') return d;
    if (/Times New Roman/.test(String(d.encFuente || ''))) { d.encFuente = DISENO_FABRICA.encFuente; d.encTam = DISENO_FABRICA.encTam; }
    if (d.encTrazo === undefined) d.encTrazo = DISENO_FABRICA.encTrazo;
    try { localStorage.setItem('em_marca', '1'); } catch (e) {}
    return d;
  }
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ── API ──────────────────────────────────────────────────────────────────
  function api(accion, datos, metodo) {
    var body = Object.assign({ a: accion, k: S.key, s: S.sesion, d: S.dev }, datos || {});
    var url = S.api, opts;
    var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    if (metodo === 'GET') {
      var qs = Object.keys(body).filter(function (k) { return body[k] !== undefined && body[k] !== null; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(typeof body[k] === 'object' ? JSON.stringify(body[k]) : body[k]); }).join('&');
      url += (url.indexOf('?') >= 0 ? '&' : '?') + qs;
      opts = { method: 'GET', redirect: 'follow' };
    } else {
      opts = { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) };
    }
    if (ctl) opts.signal = ctl.signal;
    var reloj = ctl ? setTimeout(function () { ctl.abort(); }, ESPERA_API) : null;
    return fetch(url, opts).then(function (r) { return r.text(); }).then(function (t) {
      if (reloj) clearTimeout(reloj);
      marcarOnline(true);
      var j; try { j = JSON.parse(t); } catch (e) { throw new Error('El sistema no respondió bien. Probá de nuevo en un momento.'); }
      if (!j.ok) {
        if (j.error === 'SIN_SESION') { cerrarSesionLocal(); mostrarPin('Tu sesión venció. Ingresá el PIN de nuevo.'); revisarBootstrap(); }
        throw Object.assign(new Error(mensajeError_(j.error)), { codigo: j.error, datos: j });
      }
      return j;
    }, function (err) {
      if (reloj) clearTimeout(reloj);
      marcarOnline(false);
      throw Object.assign(new Error('Sin internet en este momento.'), { codigo: 'SIN_RED', original: err });
    });
  }
  function mensajeError_(c) {
    return ({
      CLAVE_INVALIDA: 'Esta tablet no está vinculada al sistema. Pedile a Diego un código de vinculación.',
      DEMASIADOS_INTENTOS: 'Demasiados intentos seguidos. Esperá un momento y probá de nuevo.',
      CODIGO_INVALIDO: 'Ese código no sirve o ya venció. Pedile uno nuevo a Diego.',
      CLAVE_CORTA: 'La clave tiene que ser más larga.', NO_EXISTE: 'Ese dispositivo ya no está.', SIN_SESION: 'Hay que ingresar el PIN de nuevo.', SOLO_ADMIN: 'Esto lo puede hacer solo la encargada.',
      PIN_INCORRECTO: 'PIN incorrecto', PIN_INVALIDO: 'El PIN son 4 números', PIN_REPETIDO: 'Ese PIN ya lo tiene otra persona', PRIMERO_UN_ADMIN: 'La primera persona tiene que ser Encargada',
      DUPLICADO: 'Ya existe un artículo con ese nombre.', FALTA_NOMBRE: 'Falta el nombre.', PRECIO_INVALIDO: 'El precio no es válido.', SIN_CAMBIOS: 'No había nada para cambiar.',
      SIN_RED: 'Sin internet en este momento.', SOLO_DUENIO: 'Esto lo puede hacer solo Diego.',
      PRECIO_SOLO_ADMIN: 'Los precios los cambian solo Jaque o Diego.',
      EN_PRUEBAS: 'Todavía estamos en pruebas: esta función se destraba cuando Diego ponga el sistema en uso real.',
      VALE_NO_EXISTE: 'Ese vale no existe.', VALE_USADO: 'Ese vale ya se usó.', VALE_VENCIDO: 'Ese vale está vencido.',
      ARTICULO_DESCONOCIDO: 'Hay un artículo que no está en el catálogo. Actualizalo y probá de nuevo.', FALTA_MEDIO_PAGO: 'Elegí cómo paga la diferencia.', SIN_ARTICULO_CAMBIO: 'No pude crear en Loyverse el artículo para cobrar la diferencia. No se registró nada: avisale a Diego.', VENTA_NO_REGISTRADA: 'Loyverse no tomó el cobro. No se registró nada: probá de nuevo.',
      DEMASIADAS_LINEAS: 'Son demasiados artículos para un solo cambio.',
      PIN_STOCK_INCORRECTO: 'PIN incorrecto.', CANTIDAD_INVALIDA: 'La cantidad tiene que ser un número entre 1 y 999.',
      FALTA_PIN_STOCK: 'Falta configurar el PIN de stock. Avisale a Diego.', STOCK_ILEGIBLE: 'No pude leer el stock de la planilla. Avisale a Diego.',
      NO_REVERSIBLE: 'Esa acción no se puede deshacer sola.', YA_REVERTIDO: 'Eso ya se deshizo.', VENTA_NO_EXISTE: 'No encontré ninguna venta con ese número.', VENTA_CON_VARIOS_PAGOS: 'Esa venta se pagó con dos medios: el cambio hay que hacerlo desde Loyverse.', FALTAN_DATOS: 'Faltan datos.'
    })[c] || ('Error: ' + c);
  }

  // ── Utilidades ───────────────────────────────────────────────────────────
  function normalizar(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function sinSufijoPrecio(n) { return String(n || '').replace(/\s*\$[\d.,]*\s*$/, ''); }
  function fmtPesos(n) { return '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR'); }
  function fmtPrecio(n, formato) { return (formato || S.diseno.preFormato || '$ #').replace('#', Math.round(Number(n) || 0).toLocaleString('es-AR')); }
  function sufijoPrecio(precio) { precio = Math.round(Number(precio) || 0); if (precio <= 0) return ''; if (precio >= 10000 && precio % 1000 === 0) return '$' + (precio / 1000); return '$' + String(precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function toast(msg, tipo) { var t = $('toast'); t.textContent = msg; t.className = 'toast ver ' + (tipo || ''); clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = 'toast'; }, 3000); }
  function vibrar(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 30); } catch (e) {} }
  function cargando(txt) { var c = $('cargando'); if (txt === false) { c.classList.add('oculto'); return; } $('cargandoTxt').textContent = txt || 'Un segundo…'; c.classList.remove('oculto'); }
  function nombreCategoria(id) { var c = S.categorias.filter(function (x) { return x.id === id; })[0]; return c ? c.nombre : ''; }
  function escapar(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function esAdmin() { return !!(S.empleado && S.empleado.rol === 'admin'); }
  function esDuenio() { return !!(S.empleado && S.empleado.duenio); }
  function porVariant(vid) { return S.catalogo.filter(function (x) { return x.variantId === vid; })[0] || null; }
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function fechaCorta(iso) { var d = new Date(iso); if (isNaN(d.getTime())) return ''; return dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes()); }
  function horaCorta(iso) { var d = new Date(iso); if (isNaN(d.getTime())) return ''; return dos(d.getHours()) + ':' + dos(d.getMinutes()); }

  // ── Conexión y cola de cambios ───────────────────────────────────────────
  // La app tiene que seguir andando sin internet: todo lo que se puede resolver en la tablet se
  // resuelve al toque (buscar, imprimir, crear con un código reservado) y lo que necesita el
  // servidor queda en una cola que se sube sola apenas vuelve la señal.
  function marcarOnline(v) {
    if (S.online === v) return;
    S.online = v;
    pintarEstadoCatalogo();
    if (v) { toast('Volvió el internet', 'ok'); flushCola(); }
    else toast('Sin internet: sigo funcionando y guardo los cambios', 'mal');
  }
  function nuevoId() { return 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function guardarCola() { try { localStorage.setItem('em_cola', JSON.stringify(S.cola)); } catch (e) {} pintarCola(); }
  function pintarCola() {
    var c = $('chipCola');
    c.classList.toggle('oculto', !S.cola.length);
    c.textContent = '⏳ ' + S.cola.length + (S.cola.length === 1 ? ' cambio' : ' cambios');
  }
  function encolar(accion, datos, desc) {
    var item = Object.assign({ id: nuevoId(), a: accion, _desc: desc || accion, _ts: Date.now() }, datos);
    S.cola.push(item);
    if (S.cola.length > 200) S.cola = S.cola.slice(-200);
    guardarCola();
    return item;
  }
  /**
   * Manda una acción al servidor. Si no hay internet (o se corta en el intento) la deja en la cola
   * y sigue: la pantalla ya se actualizó, así que la chica no espera nada.
   */
  function accionar(accion, datos, opts) {
    opts = opts || {};
    datos = Object.assign({ idem: nuevoId() }, datos || {});
    if (!S.online && opts.encolable !== false) { encolar(accion, datos, opts.desc); return Promise.resolve({ encolado: true, offline: true }); }
    return api(accion, datos).catch(function (e) {
      if (e.codigo === 'SIN_RED' && opts.encolable !== false) { encolar(accion, datos, opts.desc); return { encolado: true, offline: true }; }
      throw e;
    }).then(function (r) {
      if (r && r.encolado) return r;
      return r;
    });
  }
  function esReintentable(codigo) { return codigo === 'SIN_RED' || codigo === 'SIN_SESION'; }
  function flushCola() {
    if (S.flushing || !S.cola.length || !S.sesion || !S.online) return Promise.resolve();
    S.flushing = true;
    var tanda = S.cola.slice(0, 8);
    return api('lote', { acciones: tanda }).then(function (r) {
      var listos = {};
      (r.resultados || []).forEach(function (x) {
        var enc = S.cola.filter(function (c) { return c.id === x.id; })[0];
        if (x.r && x.r.ok) { listos[x.id] = 1; aplicarResultadoCola(enc, x.r); }
        else if (x.r && !esReintentable(x.r.error)) { listos[x.id] = 1; log('COLA_FALLO', (enc ? enc._desc : x.a) + ': ' + (x.r ? x.r.error : '?')); }
      });
      S.cola = S.cola.filter(function (c) { return !listos[c.id]; });
      guardarCola();
      if (!S.cola.length) toast('Todo sincronizado ✓', 'ok');
    }).catch(function () { /* queda en la cola para el próximo intento */ })
      .then(function () {
        S.flushing = false; pintarCola();
        if (S.cola.length && S.online) setTimeout(flushCola, 5000);
      });
  }
  /** Cuando sube un alta hecha sin internet, se reemplazan los ids provisorios por los de Loyverse. */
  function aplicarResultadoCola(enc, r) {
    if (!enc) return;
    if (enc.a === 'crear' && r.item) {
      var a = S.catalogo.filter(function (x) { return x._pendiente && x.sku === String(enc.skuForzado); })[0];
      if (a) {
        a.itemId = r.item.itemId; a.variantId = r.item.variantId; a.sku = r.item.sku;
        a.nombre = r.item.nombre; a.barcode = r.item.barcode; a._pendiente = false;
        if (r.item.sku !== String(enc.skuForzado)) toast('Ojo: «' + sinSufijoPrecio(r.item.nombre) + '» quedó con el código ' + r.item.sku + ' (el ' + enc.skuForzado + ' ya estaba usado). Reimprimí la etiqueta.', 'mal');
      }
      guardarCatalogoLocal(); buscar();
    }
    if (r.items) aplicarActualizacion(r.items);
  }
  function log(tipo, detalle) {
    try {
      var l = JSON.parse(localStorage.getItem('em_log') || '[]');
      l.push({ t: new Date().toISOString(), tipo: tipo, d: String(detalle).slice(0, 300) });
      localStorage.setItem('em_log', JSON.stringify(l.slice(-60)));
    } catch (e) {}
  }

  // ── PIN local (entra al instante, también sin internet) ──────────────────
  /**
   * Verificador del PIN para poder entrar sin internet. Se estira con PBKDF2 (200.000 vueltas):
   * si alguien se llevara el contenido de la tablet, probar los 10.000 PIN posibles le costaria
   * horas de máquina en vez de un parpadeo. La sal es la clave propia de esta tablet, así que el
   * mismo PIN da un hash distinto en cada aparato.
   */
  function hashLocal(pin) {
    if (!(window.crypto && crypto.subtle && crypto.subtle.importKey)) return Promise.resolve('');
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) {
        return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(S.key + '|' + S.dev + '|local'), iterations: 200000, hash: 'SHA-256' }, k, 256);
      })
      .then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); })
      .catch(function () { return ''; });
  }
  function cargarVerificadores() { try { S.verificadores = JSON.parse(localStorage.getItem('em_verificadores') || '{}'); } catch (e) { S.verificadores = {}; } }
  function guardarVerificador(hash, emp, sesion) {
    if (!hash) return;
    S.verificadores[hash] = { id: emp.id, nombre: emp.nombre, rol: emp.rol, loyverseId: emp.loyverseId || '', sesion: sesion };
    try { localStorage.setItem('em_verificadores', JSON.stringify(S.verificadores)); } catch (e) {}
  }

  // ── PIN / sesión ─────────────────────────────────────────────────────────
  var pinBuf = '';
  function mostrarPin(msg) {
    ocultarPantallas_(); $('pantallaPin').classList.remove('oculto');
    $('pinInicio').classList.toggle('oculto', !sesionValida_()); // «volver» solo si ya hay alguien adentro (cambio de persona)
    $('pinEstado').textContent = msg || ''; pinBuf = ''; pintarPin();
    $('pinTitulo').textContent = 'Ingresá tu PIN';
    pintarVinculacion();
  }
  function pintarPin() { $$('#pinPuntos span').forEach(function (s, i) { s.classList.toggle('lleno', i < pinBuf.length); }); }
  function teclaPin(d) {
    if (d === 'borrar') { pinBuf = pinBuf.slice(0, -1); pintarPin(); return; }
    if (d === 'ok') { if (pinBuf.length >= 4) enviarPin(); return; }
    if (pinBuf.length >= 6) return;
    pinBuf += d; pintarPin(); vibrar(10);
    if (pinBuf.length === 4) setTimeout(function () { if (pinBuf.length === 4) enviarPin(); }, 120);
  }
  function pinMal(msg) {
    $('pinPuntos').classList.add('error'); setTimeout(function () { $('pinPuntos').classList.remove('error'); }, 450);
    $('pinEstado').textContent = msg; pinBuf = ''; pintarPin(); vibrar([40, 40, 40]);
  }
  /**
   * Entrada instantánea: si el PIN ya se usó en esta tablet, se abre en el acto (sin esperar al
   * servidor y aunque no haya internet) reusando la sesión guardada. Si es la primera vez, se valida
   * contra el servidor como siempre.
   */
  function enviarPin() {
    var pin = pinBuf;
    $('pinEstado').textContent = 'Un segundo…';
    hashLocal(pin).then(function (hash) { try { entrarConPin_(pin, hash); } catch (e) { errorAlEntrar_(e); } });
  }
  // Si algo falla al abrir (16/09: la tablet quedó con app.js nueva e index.html viejo), se avisa
  // y se recarga la app entera, en vez de quedar trabada en «Un segundo…».
  function errorAlEntrar_(e) {
    $('pinEstado').textContent = 'Actualizando la app… un momento.';
    try { console.error(e); } catch (x) {}
    recargarLimpio_();
  }
  function recargarLimpio_() {
    var borrar = window.caches ? caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }) : Promise.resolve();
    borrar.catch(function () {}).then(function () { location.reload(); });
  }
  function entrarConPin_(pin, hash) {
    {
      var v = hash && S.verificadores[hash];
      if (v) {
        S.sesion = v.sesion || S.sesion; S.empleado = { id: v.id, nombre: v.nombre, rol: v.rol, loyverseId: v.loyverseId };
        localStorage.setItem('em_sesion', S.sesion || ''); localStorage.setItem('em_empleado', JSON.stringify(S.empleado));
        S.ultimaActividad = Date.now();
        entrar();
        // por detrás: renueva la sesión y confirma el PIN contra el servidor
        if (S.online) api('login', { pin: pin }).then(function (r) {
          S.sesion = r.sesion; localStorage.setItem('em_sesion', S.sesion);
          S.empleado = r.empleado; localStorage.setItem('em_empleado', JSON.stringify(S.empleado));
          guardarVerificador(hash, r.empleado, r.sesion);
          $$('.admin').forEach(function (el) { el.classList.toggle('oculto', !esAdmin()); });
          flushCola();
        }).catch(function () {});
        return;
      }
      if (!S.online) { pinMal('Ese PIN todavía no se usó en esta tablet y no hay internet para verificarlo.'); return; }
      api('login', { pin: pin }).then(function (r) {
        S.sesion = r.sesion; S.empleado = r.empleado;
        localStorage.setItem('em_sesion', S.sesion); localStorage.setItem('em_empleado', JSON.stringify(S.empleado));
        guardarVerificador(hash, r.empleado, r.sesion);
        S.ultimaActividad = Date.now();
        try { entrar(); } catch (e) { errorAlEntrar_(e); }
      }).catch(function (e) {
        var esp = e.datos && e.datos.esperar;
        pinMal(esp ? ('Demasiados intentos. Probá de nuevo en ' + (esp < 90 ? esp + ' segundos' : Math.ceil(esp / 60) + ' minutos') + '.') : e.message);
      });
    }
  }
  // ── Vinculación de la tablet ─────────────────────────────────────────────
  /**
   * La tablet no guarda ninguna clave que venga en un link. Se vincula UNA vez con un código
   * de 8 letras que Diego genera, dura 15 minutos y sirve una sola vez; a cambio recibe una
   * clave propia. Si mañana alguien comparte el link de la app, del otro lado no hay nada.
   */
  function vincular(codigo, nombre) {
    var body = { a: 'canjear', codigo: String(codigo || '').trim(), nombre: nombre || S.dispositivo };
    return fetch(S.api, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        var j; try { j = JSON.parse(t); } catch (e) { throw new Error('El sistema no respondió bien.'); }
        if (!j.ok) throw new Error(mensajeError_(j.error));
        S.dev = j.deviceId; S.key = j.clave; S.dispositivo = j.nombre;
        localStorage.setItem('em_dev', S.dev); localStorage.setItem('em_key', S.key); localStorage.setItem('em_dispositivo', S.dispositivo);
        localStorage.removeItem('em_verificadores'); S.verificadores = {};
        cerrarSesionLocal();
        return j;
      });
  }
  function pintarVinculacion() {
    var falta = !S.key;
    $('pinVincular').classList.toggle('oculto', !falta);
    $('pinPuntos').classList.toggle('oculto', falta);
    $$('.pin-teclado')[0].classList.toggle('oculto', falta);
    if (falta) { $('pinTitulo').textContent = 'Tablet sin vincular'; $('pinAyuda').textContent = 'Pedile a Diego el código de vinculación.'; }
  }
  function enviarVinculo() {
    var cod = $('vinCodigo').value.trim();
    if (cod.replace(/[^A-Za-z0-9]/g, '').length < 8) { $('vinEstado').textContent = 'El código son 8 letras y números.'; return; }
    $('vinEstado').textContent = 'Vinculando…';
    vincular(cod, $('vinNombre').value.trim() || 'Tablet mostrador').then(function (j) {
      $('vinEstado').textContent = 'Listo: esta tablet quedó vinculada como «' + j.nombre + '».';
      $('vinCodigo').value = '';
      pintarVinculacion(); mostrarPin('Ahora sí: ingresá tu PIN.'); revisarBootstrap();
    }).catch(function (e) { $('vinEstado').textContent = e.message; });
  }

  function cerrarSesionLocal() { S.sesion = ''; localStorage.removeItem('em_sesion'); }
  function cerrarSesion() { var s = S.sesion; cerrarSesionLocal(); if (s) api('logout', { s: s }).catch(function () {}); mostrarPin(); }

  /** Después del PIN se va a donde iba: la portada al abrir, o la pantalla donde se venció la hora. */
  function entrar() {
    var destino = S.destinoLogin || 'portada';
    S.destinoLogin = ''; S.bloqueado = false;
    marcarActividad_(true);
    if (destino === 'stock') { abrirStockLocal(); return; }
    if (destino === 'carga') { entrarCarga(); return; }
    if (destino === 'cambios') { abrirCambios(); return; }
    mostrarPortada();
  }
  function entrarCarga() {
    ocultarPantallas_(); $('app').classList.remove('oculto');
    $('chipUsuario').innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="8" r="3.6"/></svg> ' + escapar(S.empleado.nombre) + (esAdmin() ? ' · Encargada' : '');
    $$('.admin').forEach(function (el) { el.classList.toggle('oculto', !esAdmin()); });
    $$('.duenio').forEach(function (el) { el.classList.toggle('oculto', !esDuenio()); });
    pintarCandados();
    toast('Hola, ' + S.empleado.nombre + ' 👋', 'ok');
    mostrarVista('buscar');
    pintarEstadoCatalogo(); pintarCola();
    cargarCatalogo(true).then(function () { if (esAdmin()) revisarCostos(); });
    flushCola();
    // Sin foco automático en el buscador (15/09, Diego): en la tablet abría el teclado solo y
    // había que buscar un lugar vacío para bajarlo. El lector de códigos igual escribe ahí solo.
  }
  /**
   * Inicio de sesión (15/09/2026, pedido de Diego): se entra con el PIN al abrir la app y con eso
   * se usa todo (stock y carga) sin volver a pedirlo. Pasada 1 hora sin actividad —contando el
   * tiempo con la app cerrada— se pide el PIN de nuevo y se vuelve a donde estaba.
   */
  function sesionValida_() { return !!(S.sesion && S.empleado && !S.bloqueado); }
  function pantallaActual_() {
    if (!$('pantallaCambios').classList.contains('oculto')) return 'cambios';
    if (!$('pantallaStock').classList.contains('oculto')) return 'stock';
    if (!$('app').classList.contains('oculto')) return 'carga';
    return 'portada';
  }
  function venceInactividad_(ahora) {
    return !!(S.bloqueoMin && S.sesion && !S.bloqueado && $('pantallaPin').classList.contains('oculto') &&
      ahora - S.ultimaActividad > S.bloqueoMin * 60000);
  }
  function bloquearPorInactividad_() {
    S.destinoLogin = pantallaActual_(); S.bloqueado = true;
    if (typeof SL !== 'undefined' && SL.f) slCerrarFlujo(true);
    mostrarPin('Pasó un rato sin uso: poné tu PIN para seguir.');
  }
  function marcarActividad_(forzar) {
    var ahora = Date.now();
    if (forzar || ahora - S.ultimaActividad > 20000) { try { localStorage.setItem('em_ultima_actividad', String(ahora)); } catch (e) {} }
    S.ultimaActividad = ahora;
  }
  // Primero se mira si ya venció: un toque después de una hora sin uso pide el PIN, no lo renueva.
  function tocarActividad() {
    if (venceInactividad_(Date.now())) { bloquearPorInactividad_(); return; }
    if (sesionValida_()) marcarActividad_(false);
  }
  setInterval(function () { if (venceInactividad_(Date.now())) bloquearPorInactividad_(); }, 30000);

  // ── Catálogo ─────────────────────────────────────────────────────────────
  function setChipSync(estado, texto) { var c = $('chipSync'); c.className = 'chip ' + estado; c.textContent = '● ' + texto; }
  function mapearItem(a) {
    return { itemId: a[0], variantId: a[1], sku: String(a[2]), nombre: a[3], precio: a[4], categoriaId: a[5], barcode: String(a[6] || ''),
      precioAnterior: a[8] || 0, trackStock: !!a[9], sinCosto: !!a[10], stock: (a[11] === '' || a[11] === undefined || a[11] === null) ? null : Number(a[11]),
      _pendiente: !!a[12], _n: normalizar(a[3]) };
  }
  function aItemPlano(a) {
    return [a.itemId, a.variantId, a.sku, a.nombre, a.precio, a.categoriaId, a.barcode, 0, a.precioAnterior || 0, a.trackStock ? 1 : 0, a.sinCosto ? 1 : 0, a.stock === null || a.stock === undefined ? '' : a.stock, a._pendiente ? 1 : 0];
  }
  function guardarCatalogoLocal() {
    try {
      localStorage.setItem('em_catalogo', JSON.stringify({ items: S.catalogo.map(aItemPlano), categorias: S.categorias, proximoSku: S.proximoSku, ultimaSync: S.ultimaSync }));
    } catch (e) {}
  }
  /** Cuenta cuánto del catálogo ya está con el sistema nuevo y cuánto falta rotar. */
  function renovacion() {
    var nuevos = 0;
    S.catalogo.forEach(function (a) { var n = parseInt(a.sku, 10); if (!isNaN(n) && n >= S.skuDesde) nuevos++; });
    return { total: S.catalogo.length, nuevos: nuevos, viejos: S.catalogo.length - nuevos, pct: S.catalogo.length ? Math.round(nuevos / S.catalogo.length * 100) : 0 };
  }
  function pintarEstadoCatalogo() {
    var r = renovacion();
    var guardado = !S.ultimaSync;
    if (!S.online) setChipSync('mal', 'sin internet · ' + r.total + ' art.');
    else setChipSync(guardado ? '' : 'ok', r.total + ' art. · ' + r.nuevos + ' nuevos');
    var det = r.total + ' artículos · ' + r.nuevos + ' con el sistema nuevo, ' + r.viejos + ' de la base vieja (' + r.pct + '% renovado) · actualizado ' + (S.ultimaSync ? horaCorta(S.ultimaSync) : '—');
    var el = $('infoCatalogo'); if (el) el.textContent = det;
  }
  function abrirEstadoCatalogo() {
    var r = renovacion();
    $('cxNuevos').textContent = r.nuevos; $('cxViejos').textContent = r.viejos;
    $('cxNuevosDet').textContent = 'código ' + S.skuDesde + ' en adelante';
    $('cxBarra').style.width = r.pct + '%';
    $('cxTexto').textContent = r.pct >= 100 ? '¡Listo! Todo el catálogo está con el sistema nuevo y el stock es confiable.'
      : 'Falta rotar ' + r.viejos + (r.viejos === 1 ? ' artículo' : ' artículos') + ' de la base vieja. A medida que se venden y se dan de baja, el stock se va acomodando solo. Vas ' + r.pct + '%.';
    $('cxActualizado').textContent = 'Última actualización: ' + (S.ultimaSync ? fechaCorta(S.ultimaSync) : 'nunca') + (S.online ? '' : ' · ahora mismo sin internet');
    $('dlgCatalogo').showModal();
  }
  function aplicarCatalogo(r) {
    var pendientes = S.catalogo.filter(function (a) { return a._pendiente; });
    S.catalogo = r.items.map(mapearItem);
    pendientes.forEach(function (a) { if (!S.catalogo.some(function (x) { return x.sku === a.sku; })) S.catalogo.push(a); });
    if (r.categorias && r.categorias.length) S.categorias = r.categorias;
    S.proximoSku = r.proximoSku; S.ultimaSync = r.ultimaSync;
    aplicarConfigServidor(r.config);
    guardarCatalogoLocal();
    pintarEstadoCatalogo(); renderCategorias(); buscar(); actualizarBadgeCostos();
  }
  function guardarSkus() { try { localStorage.setItem('em_skus', JSON.stringify(S.skus)); } catch (e) {} }
  /** Arranque y refresco: catálogo + config + medios de pago + códigos reservados, en UNA llamada. */
  function cargarCatalogo(silencioso) {
    if (!S.key) { setChipSync('mal', 'sin clave'); return Promise.resolve(); }
    if (!silencioso) setChipSync('trabajando', 'actualizando…');
    var faltan = Math.max(0, RESERVA_SKUS - S.skus.length);
    return api('bootstrap', faltan >= 5 ? { reservar: faltan } : {}, 'GET').then(function (r) {
      aplicarCatalogo(r);
      if (r.pagos && r.pagos.length) { S.pagos = r.pagos; try { localStorage.setItem('em_pagos', JSON.stringify(r.pagos)); } catch (e) {} }
      if (r.skus && r.skus.length) { S.skus = S.skus.concat(r.skus); guardarSkus(); }
      if (r.bootstrapEquipo && r.equipo) mostrarBootstrap(r.equipo);
      if (S.cola.length) flushCola();
    }).catch(function (e) {
      pintarEstadoCatalogo();
      if (!silencioso && e.codigo !== 'SIN_RED') toast(e.message, 'mal');
    });
  }
  function cargarCatalogoLocal() {
    try {
      var c = JSON.parse(localStorage.getItem('em_catalogo') || 'null'); if (!c) return;
      S.catalogo = c.items.map(mapearItem); S.categorias = c.categorias || []; S.proximoSku = c.proximoSku; S.ultimaSync = c.ultimaSync;
      pintarEstadoCatalogo(); renderCategorias();
    } catch (e) {}
    try { S.pagos = JSON.parse(localStorage.getItem('em_pagos') || '[]'); } catch (e) {}
    try { S.skus = JSON.parse(localStorage.getItem('em_skus') || '[]'); } catch (e) {}
    try { S.cola = JSON.parse(localStorage.getItem('em_cola') || '[]'); } catch (e) {}
  }
  function aplicarConfigServidor(cfg) {
    if (!cfg) return;
    if (cfg.diseno && !localStorage.getItem('em_diseno')) { S.diseno = migrarMarca_(Object.assign({}, DISENO_FABRICA, cfg.diseno)); localStorage.setItem('em_diseno', JSON.stringify(S.diseno)); }
    if (typeof cfg.nombreConPrecio === 'boolean') { S.nombreConPrecio = cfg.nombreConPrecio; localStorage.setItem('em_nombre_precio', cfg.nombreConPrecio ? 'si' : 'no'); }
    if (cfg.diasCambio) S.diasCambio = Number(cfg.diasCambio);
    if (typeof cfg.ticketTexto === 'string') S.ticketTexto = cfg.ticketTexto;
    if (typeof cfg.controlStock === 'boolean') S.controlStock = cfg.controlStock;
    if (cfg.skuDesde) S.skuDesde = Number(cfg.skuDesde);
    if (typeof cfg.enUso === 'boolean') { S.enUso = cfg.enUso; pintarCandados(); }
    $('nStockLabel').classList.toggle('oculto', !S.controlStock);
    actualizarPreview();
  }
  function actualizarBadgeCostos() {
    if (!esAdmin()) return;
    var n = S.catalogo.filter(function (a) { return a.sinCosto && a.precio > 0; }).length;
    $('tileCostosBadge').textContent = n; $('tileCostosBadge').classList.toggle('oculto', !n);
    $('tileCostosSub').textContent = n ? n + ' nuevos sin costo' : 'todo al día ✓';
  }
  function revisarCostos() {
    var n = S.catalogo.filter(function (a) { return a.sinCosto && a.precio > 0; }).length;
    if (!n || sessionStorage.getItem('em_costos_luego')) return;
    $('avisoCostosTitulo').textContent = S.empleado.nombre + ', aún necesitamos que cargues el precio de costo de ' + n + (n === 1 ? ' artículo nuevo' : ' artículos nuevos');
    $('avisoCostosTexto').textContent = ' — los cargados más recientemente primero. Lo podés hacer ahora mismo desde acá.';
    $('avisoCostos').classList.remove('oculto');
  }

  /** Mientras el sistema esté en pruebas, las funciones de riesgo se ven con candado. */
  var TILES_TRABADOS = { cambio: 1, precios: 1 };
  function pintarCandados() {
    $$('.tile[data-ir]').forEach(function (t) {
      var d = t.getAttribute('data-ir');
      var trabado = !S.enUso && TILES_TRABADOS[d];
      t.classList.toggle('trabado', !!trabado);
      var c = t.querySelector('.candado');
      if (trabado && !c) { var sp = document.createElement('span'); sp.className = 'candado'; sp.innerHTML = '<svg class="i" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'; t.appendChild(sp); }
      if (!trabado && c) c.remove();
    });
    var chk = $('sEnUso'); if (chk) chk.checked = !!S.enUso;
  }
  function trabado(destino) {
    if (S.enUso || !TILES_TRABADOS[destino]) return false;
    toast('Todavía en pruebas: esto se destraba cuando Diego ponga el sistema en uso real.', 'mal');
    return true;
  }

  // ── Buscar ───────────────────────────────────────────────────────────────
  function esNumeroDeVenta(q) { return /^(TC-?)?\d{1,3}-\d{1,6}$/i.test(q) || /^TC-?\d+$/i.test(q); }
  function buscar() {
    var q = $('inputBuscar').value.trim();
    var cont = $('resultados');
    $('inicio').classList.toggle('oculto', !!q);
    if (!q) { cont.innerHTML = ''; return; }
    if (esNumeroDeVenta(q)) { cont.innerHTML = '<div class="vacio">Parece un <b>ticket de cambio</b> o número de venta. Tocá Enter o el botón para abrirlo en <b>Cambio o devolución</b>.<br><button class="primario chico" data-ir-cambio="' + escapar(q) + '" style="margin-top:10px">Abrir venta ' + escapar(q.replace(/^TC-?/i, '')) + '</button></div>'; return; }
    var qn = normalizar(q), tokens = qn.split(' ').filter(Boolean);
    var esCodigo = /^\d{3,}$/.test(q);
    var res = [];
    for (var i = 0; i < S.catalogo.length; i++) {
      var a = S.catalogo[i];
      var exacto = esCodigo && (a.sku === q || a.barcode === q);
      var ok = exacto || tokens.every(function (t) { return a._n.indexOf(t) >= 0 || a.sku.indexOf(t) === 0; });
      if (ok) res.push({ a: a, exacto: exacto, score: (exacto ? 1000 : 0) + (a._n.indexOf(qn) === 0 ? 100 : 0) + (a._n.indexOf(qn) >= 0 ? 10 : 0) });
      if (res.length > 400) break;
    }
    res.sort(function (x, y) { return y.score - x.score || x.a.nombre.localeCompare(y.a.nombre); });
    res = res.slice(0, 60);
    if (!res.length) {
      cont.innerHTML = '<div class="vacio">No hay ningún artículo que coincida con <b>' + escapar(q) + '</b>.' + (esCodigo ? '<br>Ese código no está en Loyverse.' : '<br><button class="primario chico" data-ir="nuevo" style="margin-top:10px">＋ Crear «' + escapar(q) + '»</button>') + '</div>';
      return;
    }
    cont.innerHTML = res.map(function (r) { return filaArticulo(r.a, r.exacto); }).join('');
    if (esCodigo && res.length && res[0].exacto && buscar._enter) { buscar._enter = false; abrirFicha(res[0].a); }
  }
  function filaArticulo(a, exacto, extraAttr) {
    return '<button class="res' + (exacto ? ' exacto' : '') + '" data-vid="' + escapar(a.variantId) + '" ' + (extraAttr || '') + '>' +
      '<div><div class="nombre">' + escapar(a.nombre) + (a.precioAnterior ? '<span class="pill">OFERTA</span>' : '') + (a._pendiente ? '<span class="esperando">esperando internet</span>' : '') + '</div><div class="meta"><span class="mono">' + escapar(a.sku) + '</span>' +
      (a.categoriaId ? '<span class="cat">' + escapar(nombreCategoria(a.categoriaId)) + '</span>' : '') + '</div></div>' +
      '<div class="precio">' + fmtPesos(a.precio) + (a.precioAnterior ? '<div class="tachado" style="margin:0;font-size:13px">' + fmtPesos(a.precioAnterior) + '</div>' : '') + '</div></button>';
  }

  function mostrarVista(v) {
    S.vista = v;
    $$('.vista').forEach(function (el) { el.classList.remove('activa'); });
    var el = $('vista' + v.charAt(0).toUpperCase() + v.slice(1)); if (el) el.classList.add('activa');
    if (v === 'buscar') { renderRecientes(); } // sin foco automático: no abre el teclado
    window.scrollTo(0, 0);
  }
  function irA(destino, arg) {
    if (trabado(destino)) return;
    if (destino === 'bitacora') return abrirBitacora();
    if (destino === 'nuevo') return abrirNuevo(arg || $('inputBuscar').value.trim());
    if (destino === 'ticketCambio') return abrirTicketCambio();
    if (destino === 'cambio') return abrirCambio(arg);
    if (destino === 'costos') return abrirCostos();
    if (destino === 'precios') return abrirPrecios();
    if (destino === 'equipo') return abrirEquipo();
  }

  // ── Ficha ────────────────────────────────────────────────────────────────
  function abrirFicha(a) {
    S.actual = a; S.etiquetaOferta = !!a.precioAnterior;
    $('fNombre').textContent = a.nombre; $('fSku').textContent = a.sku; $('fPrecio').textContent = fmtPesos(a.precio);
    $('fCategoria').textContent = nombreCategoria(a.categoriaId) || '—';
    $('fOferta').classList.toggle('oculto', !a.precioAnterior);
    $('fPrecioAnt').classList.toggle('oculto', !a.precioAnterior); $('fPrecioAnt').textContent = a.precioAnterior ? fmtPesos(a.precioAnterior) : '';
    $('btnOferta').innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M12 3c1.5 3.5 5 4.5 5 8.5A5 5 0 0 1 7 12c0-1.5.5-2.5 1.5-3.5C9 11 11 11 11 11s-1.5-4 1-8Z"/></svg> ' + (a.precioAnterior ? 'Terminar oferta' : 'Poner en oferta');
    pintarStockFicha(a);
    mostrarVista('ficha'); actualizarPreview();
    // el stock ya viene con el catálogo: se muestra al toque y solo se refresca por detrás
    if (a.trackStock && S.online && !a._pendiente) {
      api('stock_get', { variantIds: a.variantId }, 'GET').then(function (r) {
        var n = r.niveles[a.variantId];
        if (n !== undefined) { a.stock = n; guardarCatalogoLocal(); if (S.actual === a) pintarStockFicha(a); }
      }).catch(function () {});
    }
  }
  function pintarStockFicha(a) {
    var el = $('fStock');
    if (!a.trackStock) { el.textContent = 'sin control'; el.className = 'stock'; return; }
    el.textContent = (a.stock === null || a.stock === undefined) ? '—' : a.stock;
    el.className = 'stock' + (a.stock !== null && a.stock !== undefined && a.stock <= 0 ? ' bajo' : '');
  }
  /** Aplica el cambio en la pantalla ANTES de que conteste el servidor y devuelve cómo volver atrás. */
  function optimista(a, cambios) {
    var antes = {};
    Object.keys(cambios).forEach(function (k) { antes[k] = a[k]; });
    Object.keys(cambios).forEach(function (k) { a[k] = cambios[k]; });
    if (cambios.nombre !== undefined) a._n = normalizar(a.nombre);
    guardarCatalogoLocal();
    if (S.actual === a && S.vista === 'ficha') abrirFicha(a);
    buscar(); actualizarBadgeCostos();
    return function revertir() {
      Object.keys(antes).forEach(function (k) { a[k] = antes[k]; });
      a._n = normalizar(a.nombre); guardarCatalogoLocal();
      if (S.actual === a && S.vista === 'ficha') abrirFicha(a);
      buscar(); actualizarBadgeCostos();
    };
  }
  function avisoGuardado(r) { toast(r && r.encolado ? 'Guardado acá; se sube cuando vuelva el internet' : 'Guardado ✓', 'ok'); }
  function bloqueadoPendiente(a) {
    if (!a || !a._pendiente) return false;
    toast('Este artículo todavía no subió a Loyverse. Esperá a que haya internet.', 'mal');
    return true;
  }
  /**
   * Cuadro de un número. No se confía solo en el evento `close` del diálogo (no siempre dispara):
   * se resuelve en el propio botón. Y Cancelar es type=button, si no el Enter del teclado
   * numérico activaba Cancelar en vez de Guardar.
   */
  function pedirNumero(titulo, ayuda, valor, prefijo, botonTxt) {
    return new Promise(function (resolve) {
      $('dlgNumeroTitulo').textContent = titulo; $('dlgNumeroAyuda').textContent = ayuda || ''; $('dlgNumeroPrefijo').textContent = prefijo || '$';
      $('dlgNumeroInput').value = valor == null ? '' : valor; $('dlgNumeroOk').textContent = botonTxt || 'Guardar';
      var d = $('dlgNumero'), listo = false;
      function terminar(v) {
        if (listo) return; listo = true;
        d.onclose = null; $('dlgNumeroOk').onclick = null; $('dlgNumeroCancelar').onclick = null;
        try { if (d.open) d.close(); } catch (e) {}
        resolve(v);
      }
      d.onclose = function () { terminar(d.returnValue === 'ok' ? Number($('dlgNumeroInput').value) : null); };
      $('dlgNumeroOk').onclick = function () { terminar(Number($('dlgNumeroInput').value)); };
      $('dlgNumeroCancelar').onclick = function () { terminar(null); };
      d.showModal(); setTimeout(function () { $('dlgNumeroInput').select(); }, 80);
    });
  }
  function cambiarPrecio() {
    if (!S.actual) return;
    var a = S.actual;
    if (bloqueadoPendiente(a)) return;
    pedirNumero('Nuevo precio', a.nombre, a.precio, '$', 'Guardar y reimprimir').then(function (precio) {
      if (precio == null || !(precio >= 0)) return;
      var nuevoNombre = S.nombreConPrecio && /\$[\d.,]*\s*$/.test(a.nombre) ? sinSufijoPrecio(a.nombre).trim() + ' ' + sufijoPrecio(precio) : a.nombre;
      var revertir = optimista(a, { precio: precio, nombre: nuevoNombre });
      vibrar();
      imprimirActual('precio');
      accionar('actualizar', { itemId: a.itemId, variantId: a.variantId, precio: precio }, { desc: 'precio de ' + a.sku })
        .then(function (r) { if (r && r.items) aplicarActualizacion(r.items); avisoGuardado(r); })
        .catch(function (e) { revertir(); toast('No se pudo cambiar el precio: ' + e.message, 'mal'); });
    });
  }
  function editarNombre() {
    if (!S.actual) return;
    $('eNombre').value = sinSufijoPrecio(S.actual.nombre);
    var d = $('dlgNombre'), hecho = false;
    function guardar() {
      if (hecho) return; hecho = true;
      d.onclose = null; $('eNombreOk').onclick = null; $('eNombreCancelar').onclick = null;
      try { if (d.open) d.close(); } catch (e) {}
      var nombre = $('eNombre').value.trim(); if (!nombre) return;
      var a = S.actual; if (bloqueadoPendiente(a)) return;
      var completo = S.nombreConPrecio ? nombre + ' ' + sufijoPrecio(a.precio) : nombre;
      var revertir = optimista(a, { nombre: completo.trim() });
      accionar('actualizar', { itemId: a.itemId, nombre: nombre }, { desc: 'nombre de ' + a.sku })
        .then(function (r) { if (r && r.items) aplicarActualizacion(r.items); avisoGuardado(r); })
        .catch(function (e) { revertir(); toast('No se pudo cambiar el nombre: ' + e.message, 'mal'); });
    }
    d.onclose = function () { if (d.returnValue === 'ok') guardar(); else hecho = true; };
    $('eNombreOk').onclick = guardar;
    $('eNombreCancelar').onclick = function () { hecho = true; d.onclose = null; try { if (d.open) d.close(); } catch (e) {} };
    d.showModal();
  }
  function toggleOferta() {
    if (!S.actual) return;
    var a = S.actual;
    if (bloqueadoPendiente(a)) return;
    if (a.precioAnterior) {
      var vuelve = a.precioAnterior;
      var revertirF = optimista(a, { precio: vuelve, precioAnterior: 0, nombre: S.nombreConPrecio && /\$[\d.,]*\s*$/.test(a.nombre) ? sinSufijoPrecio(a.nombre).trim() + ' ' + sufijoPrecio(vuelve) : a.nombre });
      S.etiquetaOferta = false; actualizarPreview();
      imprimirActual('oferta_fin');
      accionar('oferta_sacar', { itemId: a.itemId, variantId: a.variantId }, { desc: 'fin de oferta ' + a.sku })
        .then(function (r) { if (r && r.items) aplicarActualizacion(r.items); toast('Vuelve a ' + fmtPesos(vuelve), 'ok'); })
        .catch(function (e) { revertirF(); toast('No se pudo terminar la oferta: ' + e.message, 'mal'); });
      return;
    }
    pedirNumero('Precio de oferta', 'Ahora ' + fmtPesos(a.precio) + '. El precio anterior queda guardado y sale tachado en la etiqueta.', Math.round(a.precio * 0.8 / 500) * 500, '$', 'Poner oferta e imprimir').then(function (precio) {
      if (precio == null || !(precio >= 0)) return;
      var antesPrecio = a.precio;
      var revertirO = optimista(a, { precio: precio, precioAnterior: antesPrecio, nombre: S.nombreConPrecio && /\$[\d.,]*\s*$/.test(a.nombre) ? sinSufijoPrecio(a.nombre).trim() + ' ' + sufijoPrecio(precio) : a.nombre });
      S.etiquetaOferta = true; actualizarPreview(); vibrar();
      imprimirActual('oferta');
      accionar('oferta_poner', { itemId: a.itemId, variantId: a.variantId, precioOferta: precio }, { desc: 'oferta de ' + a.sku })
        .then(function (r) { if (r && r.items) aplicarActualizacion(r.items); avisoGuardado(r); })
        .catch(function (e) { revertirO(); toast('No se pudo poner la oferta: ' + e.message, 'mal'); });
    });
  }
  function ingresarStock() {
    if (!S.actual) return;
    var a = S.actual;
    pedirNumero('¿Cuántas entran?', a.nombre + (a.trackStock ? '' : ' · este artículo todavía no tiene control de stock: se lo activo'), 1, '+', 'Sumar al stock').then(function (n) {
      if (n == null || isNaN(n)) return;
      if (bloqueadoPendiente(a)) return;
      var base = (a.stock === null || a.stock === undefined) ? 0 : a.stock;
      var revertirS = optimista(a, { trackStock: true, stock: base + n });
      vibrar();
      accionar('stock_ingresar', { itemId: a.itemId, variantId: a.variantId, cantidad: n }, { desc: 'stock de ' + a.sku })
        .then(function (r) { if (r && r.stock !== undefined) { a.stock = r.stock; guardarCatalogoLocal(); pintarStockFicha(a); } toast('Stock: ' + (r && r.stock !== undefined ? r.stock : base + n) + (r && r.encolado ? ' (se sube después)' : ''), 'ok'); })
        .catch(function (e) { revertirS(); toast('No se pudo cargar el stock: ' + e.message, 'mal'); });
    });
  }
  function cargarCostoFicha() {
    if (!S.actual || !esAdmin()) return;
    var a = S.actual;
    pedirNumero('Costo de compra', a.nombre + ' · solo lo ve la encargada', '', '$', 'Guardar costo').then(function (c) {
      if (c == null || !(c >= 0)) return;
      if (bloqueadoPendiente(a)) return;
      var revertirC = optimista(a, { sinCosto: !(c > 0) });
      accionar('costo_set', { itemId: a.itemId, variantId: a.variantId, costo: c }, { desc: 'costo de ' + a.sku })
        .then(function (r) { if (r && r.items) aplicarActualizacion(r.items); avisoGuardado(r); })
        .catch(function (e) { revertirC(); toast('No se pudo guardar el costo: ' + e.message, 'mal'); });
    });
  }
  function aplicarActualizacion(items) {
    (items || []).forEach(function (it) {
      var a = porVariant(it.variantId);
      if (a) { a.nombre = it.nombre; a.precio = it.precio; a.categoriaId = it.categoriaId; a.barcode = it.barcode; a.precioAnterior = it.precioAnterior || 0; a.trackStock = !!it.trackStock; a.sinCosto = !!it.sinCosto; a._n = normalizar(it.nombre); }
      else { var n = Object.assign({}, it, { _n: normalizar(it.nombre) }); S.catalogo.push(n); a = n; }
      if (S.actual && S.actual.variantId === it.variantId) S.actual = a;
    });
    if (S.actual && S.vista === 'ficha') abrirFicha(S.actual);
  }

  // ── Nuevo artículo ───────────────────────────────────────────────────────
  function renderCategorias() {
    var cont = $('nCategorias');
    var actual = cont.getAttribute('data-sel') || '';
    cont.innerHTML = S.categorias.map(function (c) { return '<button type="button" class="chip-sel' + (c.id === actual ? ' activo' : '') + '" data-id="' + escapar(c.id) + '">' + escapar(c.nombre) + '</button>'; }).join('') +
      '<button type="button" class="chip-sel' + (!actual ? ' activo' : '') + '" data-id="">Sin categoría</button><button type="button" class="chip-sel" data-id="__nueva"><svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Otra…</button>';
    cont.setAttribute('data-sel', actual);
    $('prCategorias').innerHTML = S.categorias.map(function (c) { return '<button type="button" class="chip-sel" data-id="' + escapar(c.id) + '">' + escapar(c.nombre) + '</button>'; }).join('');
  }
  function categoriaElegida() { return $('nCategorias').getAttribute('data-sel') || ''; }
  function elegirCategoria(id) {
    $('nCategorias').setAttribute('data-sel', id);
    $$('#nCategorias .chip-sel').forEach(function (x) { x.classList.toggle('activo', x.getAttribute('data-id') === id); x.classList.remove('sugerida'); });
  }
  function sugerirCategoria() {
    var n = normalizar($('nNombre').value);
    if (!n) return;
    // gana la palabra que aparece PRIMERO en el nombre ("campera de jean" → camperas, no pantalones)
    var hit = null, pos = 1e9;
    PALABRAS_CATEGORIA.forEach(function (par) { var m = new RegExp('(^| )' + par[0] + '(s|es)?( |$)').exec(n); if (m && m.index < pos) { pos = m.index; hit = par[1]; } });
    if (!hit) return;
    var cat = S.categorias.filter(function (c) { var cn = normalizar(c.nombre); return cn === hit || cn.indexOf(hit) === 0 || hit.indexOf(cn) === 0; })
      .sort(function (a, b) { return normalizar(a.nombre).length - normalizar(b.nombre).length; })[0];
    if (cat && !sugerirCategoria._manual) { elegirCategoria(cat.id); $$('#nCategorias .chip-sel').forEach(function (x) { if (x.getAttribute('data-id') === cat.id) x.classList.add('sugerida'); }); }
  }
  function abrirNuevo(nombreSugerido) {
    $('nNombre').value = nombreSugerido || ''; $('nPrecio').value = ''; $('nCosto').value = ''; $('nStock').value = 1; $('nEtiquetas').value = 1; $('nEtiquetas').dataset.tocado = '';
    $('nSku').textContent = proximoCodigo() || '—'; $('nAviso').classList.add('oculto'); $('nCatNueva').classList.add('oculto');
    sugerirCategoria._manual = false;
    var ultima = localStorage.getItem('em_ultima_cat') || ''; elegirCategoria(ultima); sugerirCategoria();
    mostrarVista('nuevo'); S.actual = null; S.etiquetaOferta = false; actualizarPreview();
    setTimeout(function () { ($('nNombre').value ? $('nPrecio') : $('nNombre')).focus(); }, 60);
  }
  function avisarParecidos() {
    var n = normalizar($('nNombre').value), av = $('nAviso');
    if (n.length < 3) { av.classList.add('oculto'); return; }
    var tokens = n.split(' ');
    var parecidos = S.catalogo.filter(function (a) { var an = normalizar(sinSufijoPrecio(a.nombre)); return an === n || tokens.every(function (t) { return an.indexOf(t) >= 0; }); }).slice(0, 3);
    if (!parecidos.length) { av.classList.add('oculto'); return; }
    av.classList.remove('oculto');
    av.innerHTML = '⚠️ Ya hay parecidos: ' + parecidos.map(function (a) { return '<button type="button" data-vid="' + escapar(a.variantId) + '">' + escapar(a.nombre) + ' (' + escapar(a.sku) + ')</button>'; }).join(' · ');
  }
  function actualizarNombreLoyverse() {
    var n = $('nNombre').value.trim(), p = Number($('nPrecio').value);
    var suf = S.nombreConPrecio ? sufijoPrecio(p) : '';
    $('nNombreLoy').textContent = n ? '· en Loyverse: «' + sinSufijoPrecio(n) + (suf ? ' ' + suf : '') + '»' : '';
  }
  /** Próximo código: sale del bloque reservado en la tablet (por eso el alta anda sin internet). */
  function proximoCodigo() { return S.skus.length ? S.skus[0] : (S.proximoSku || ''); }
  function crear(forzar) {
    if (crear._ocupado && Date.now() - crear._ocupado < 1500) return;
    crear._ocupado = Date.now();
    var nombre = $('nNombre').value.trim(), precio = Number($('nPrecio').value);
    if (!nombre) { toast('Falta el nombre', 'mal'); $('nNombre').focus(); return; }
    if ($('nPrecio').value === '' || !(precio >= 0)) { toast('Falta el precio', 'mal'); $('nPrecio').focus(); return; }
    // segunda barrera de duplicados, también sin internet
    if (!forzar) {
      var n = normalizar(sinSufijoPrecio(nombre));
      var dup = S.catalogo.filter(function (x) { return normalizar(sinSufijoPrecio(x.nombre)) === n; });
      if (dup.length) { mostrarDuplicados(dup.map(function (x) { return { sku: x.sku, nombre: x.nombre, precio: x.precio, variantId: x.variantId }; })); return; }
    }
    var etiquetas = Math.max(0, parseInt($('nEtiquetas').value, 10) || 0);
    var categoria = categoriaElegida();
    var sku = String(S.skus.length ? S.skus.shift() : (S.proximoSku || ''));
    if (!sku) { toast('No tengo códigos reservados y no hay internet. Probá cuando vuelva la señal.', 'mal'); return; }
    guardarSkus();
    var datos = { nombre: nombre, precio: precio, categoriaId: categoria, forzar: 1, skuForzado: sku, idem: nuevoId() };
    if (S.controlStock) datos.stockInicial = Math.max(0, parseInt($('nStock').value, 10) || 0);
    if (esAdmin() && $('nCosto').value !== '') datos.costo = Number($('nCosto').value);

    // El artículo aparece YA en la tablet con su código: la etiqueta se imprime sin esperar a Loyverse.
    var nombreLoy = S.nombreConPrecio ? sinSufijoPrecio(nombre).trim() + (sufijoPrecio(precio) ? ' ' + sufijoPrecio(precio) : '') : nombre;
    var a = { itemId: 'tmp-' + sku, variantId: 'tmp-' + sku, sku: sku, nombre: nombreLoy, precio: precio, categoriaId: categoria,
      barcode: sku, precioAnterior: 0, trackStock: S.controlStock, stock: datos.stockInicial === undefined ? null : datos.stockInicial,
      sinCosto: !(datos.costo > 0), _pendiente: true, _n: normalizar(nombreLoy) };
    S.catalogo.push(a);
    S.recientes.unshift({ variantId: a.variantId, ts: Date.now() });
    try { localStorage.setItem('em_recientes', JSON.stringify(S.recientes.slice(0, 60))); } catch (e) {}
    localStorage.setItem('em_ultima_cat', categoria);
    guardarCatalogoLocal(); actualizarBadgeCostos();
    vibrar([30, 30, 30]);

    if (etiquetas > 0) { S.actual = a; S.etiquetaOferta = false; $('cantidad').value = etiquetas; imprimirActual('nuevo'); }

    // se limpia el formulario para cargar el siguiente sin esperar nada
    var creado = a;
    $('nNombre').value = ''; $('nPrecio').value = ''; $('nCosto').value = ''; $('nStock').value = 1;
    $('nEtiquetas').value = 1; $('nEtiquetas').dataset.tocado = ''; $('nAviso').classList.add('oculto');
    $('nSku').textContent = proximoCodigo() || '—';
    sugerirCategoria._manual = false;
    S.actual = creado; actualizarPreview();
    setTimeout(function () { $('nNombre').focus(); }, 40);
    mostrarAvisoNuevo(creado, etiquetas, false);

    if (S.skus.length < 4 && S.online) api('sku_reservar', { cuantos: RESERVA_SKUS }).then(function (r) { if (r.skus && r.skus.length) { S.skus = S.skus.concat(r.skus); guardarSkus(); $('nSku').textContent = proximoCodigo() || '—'; } }).catch(function () {});
    accionar('crear', datos, { desc: 'alta de ' + sku + ' ' + sinSufijoPrecio(nombre) }).then(function (r) {
      if (r && r.encolado) { mostrarAvisoNuevo(creado, etiquetas, true); return; }
      var it = r.item;
      creado.itemId = it.itemId; creado.variantId = it.variantId; creado.sku = it.sku; creado.nombre = it.nombre;
      creado.barcode = it.barcode; creado.trackStock = !!it.trackStock; creado.sinCosto = !!it.sinCosto;
      if (it.stock !== null && it.stock !== undefined) creado.stock = it.stock;
      creado._pendiente = false; creado._n = normalizar(it.nombre);
      if (String(it.sku) !== sku) toast('Ojo: quedó con el código ' + it.sku + ' (el ' + sku + ' ya estaba usado). Reimprimí la etiqueta.', 'mal');
      guardarCatalogoLocal(); buscar(); actualizarBadgeCostos(); pintarEstadoCatalogo();
      if (S.actual === creado) actualizarPreview();
    }).catch(function (e) {
      S.catalogo = S.catalogo.filter(function (x) { return x !== creado; });
      S.skus.unshift(Number(sku)); guardarSkus(); guardarCatalogoLocal(); buscar();
      $('avisoNuevo').classList.add('oculto');
      toast('No se pudo crear: ' + e.message, 'mal');
    });
  }
  function mostrarAvisoNuevo(a, etiquetas, offline) {
    $('avisoNuevoTxt').textContent = '✓ ' + a.sku + ' · ' + sinSufijoPrecio(a.nombre) + ' · ' + fmtPesos(a.precio) +
      (etiquetas ? ' · ' + etiquetas + (etiquetas === 1 ? ' etiqueta' : ' etiquetas') : '') +
      (offline ? ' — guardado en la tablet, sube cuando vuelva el internet' : '');
    $('avisoNuevo').classList.remove('oculto');
    $('avisoNuevo').dataset.vid = a.variantId;
    clearTimeout(mostrarAvisoNuevo._t);
    mostrarAvisoNuevo._t = setTimeout(function () { $('avisoNuevo').classList.add('oculto'); }, 20000);
  }
  function mostrarDuplicados(lista) {
    $('dupLista').innerHTML = lista.map(function (d) { var a = porVariant(d.variantId) || S.catalogo.filter(function (x) { return x.sku === d.sku; })[0]; return '<button class="res" data-vid="' + escapar(a ? a.variantId : '') + '"><div><div class="nombre">' + escapar(d.nombre) + '</div><div class="meta mono">' + escapar(d.sku) + '</div></div><div class="precio">' + fmtPesos(d.precio) + '</div></button>'; }).join('');
    $('dlgDuplicado').showModal();
  }
  function crearCategoriaDesdeForm() {
    var nombre = $('nCatNombre').value.trim(); if (!nombre) return;
    cargando('Creando categoría…');
    api('categoria_crear', { nombre: nombre }).then(function (r) { S.categorias = r.categorias; renderCategorias(); elegirCategoria(r.categoria.id); $('nCatNueva').classList.add('oculto'); $('nCatNombre').value = ''; toast('Categoría lista: ' + r.categoria.nombre, 'ok'); })
      .catch(function (e) { toast(e.message, 'mal'); }).finally(function () { cargando(false); });
  }
  function renderRecientes() {
    var hoy = new Date().toDateString();
    S.recientes = S.recientes.filter(function (r) { return new Date(r.ts).toDateString() === hoy && porVariant(r.variantId); });
    var cont = $('recientes'); cont.classList.toggle('oculto', !S.recientes.length);
    if (!S.recientes.length) return;
    $('recientesCant').textContent = '(' + S.recientes.length + ')';
    $('recientesLista').innerHTML = S.recientes.map(function (r) { var a = porVariant(r.variantId); return '<button data-vid="' + escapar(a.variantId) + '"><span class="mono">' + escapar(a.sku) + '</span> ' + escapar(sinSufijoPrecio(a.nombre)) + '</button>'; }).join('');
  }

  // ── Etiqueta: render ─────────────────────────────────────────────────────
  function medidasPx(d) { return { w: Math.round(d.anchoMm * DPMM), h: Math.round(d.altoMm * DPMM), m: Math.round(d.margenMm * DPMM) }; }
  function fuenteConTam(fuente, tam) { var m = fuente.match(/^(bold italic|italic bold|italic|bold)?\s*(.*)$/); return (m[1] ? m[1] + ' ' : '') + tam + 'px ' + m[2]; }
  function ajustarTexto(ctx, texto, maxAncho, maxLineas, fuenteBase, tam) {
    for (var t = tam; t >= 8; t -= 1) {
      ctx.font = fuenteConTam(fuenteBase, t);
      var palabras = texto.split(/\s+/), lineas = [], actual = '';
      for (var i = 0; i < palabras.length; i++) {
        var prueba = actual ? actual + ' ' + palabras[i] : palabras[i];
        if (ctx.measureText(prueba).width <= maxAncho) actual = prueba; else { if (actual) lineas.push(actual); actual = palabras[i]; }
      }
      if (actual) lineas.push(actual);
      if (lineas.length <= maxLineas && lineas.every(function (l) { return ctx.measureText(l).width <= maxAncho; })) return { lineas: lineas, tam: t };
    }
    return { lineas: [texto], tam: 8 };
  }
  /**
   * La etiqueta se dibuja en un canvas y de ahí sale el mapa de bits que va a la impresora.
   * Si la caligrafía todavía no terminó de cargar, el canvas dibujaría con la letra de respaldo
   * y saldría impresa mal. Por eso se espera una sola vez y se vuelve a dibujar.
   */
  var _fuenteMarcaLista = false;
  function fuenteMarcaLista() {
    if (_fuenteMarcaLista) return Promise.resolve();
    if (!(document.fonts && document.fonts.load)) { _fuenteMarcaLista = true; return Promise.resolve(); }
    // Se piden las tres de una: la de la etiqueta y las dos de pantalla. Así ninguna vista
    // que se abra después tiene que esperar a que llegue su letra ni parpadea al cambiarla.
    document.fonts.load("30px 'Bodoni Moda'").catch(function () {});
    document.fonts.load("17px 'Instrument Sans'").catch(function () {});
    return document.fonts.load("40px 'Pinyon Script'").then(function () { _fuenteMarcaLista = true; })
      .catch(function () { _fuenteMarcaLista = true; });
  }

  function renderEtiqueta(canvas, d, art, oferta) {
    if (!_fuenteMarcaLista) fuenteMarcaLista().then(function () { renderEtiqueta(canvas, d, art, oferta); });  // solo el primer segundo
    var px = medidasPx(d);
    canvas.width = px.w; canvas.height = px.h;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, px.w, px.h);
    ctx.fillStyle = '#000'; ctx.textBaseline = 'top'; ctx.textAlign = 'center';
    var cx = px.w / 2, y = px.m, anchoUtil = px.w - 2 * px.m;
    var esOferta = !!(oferta && art && art.precioAnterior);

    if (esOferta) {
      var bandaAlto = Math.round(px.h * 0.15);
      ctx.fillRect(0, 0, px.w, bandaAlto);
      ctx.fillStyle = '#fff'; ctx.font = fuenteConTam("bold 'Arial', 'Roboto', sans-serif", Math.round(bandaAlto * 0.7));
      ctx.fillText(String(d.ofertaTexto || 'OFERTA'), cx, Math.round(bandaAlto * 0.13));
      ctx.fillStyle = '#000'; y = bandaAlto + 3;
    } else if (d.encabezado && d.encTam > 0) {
      var enc = ajustarTexto(ctx, d.encabezado, anchoUtil, 1, d.encFuente, d.encTam);
      ctx.font = fuenteConTam(d.encFuente, enc.tam); ctx.fillText(enc.lineas[0], cx, y);
      // La caligrafía tiene trazos finísimos y la térmica de 203 dpi se los come:
      // se repasa el contorno para engrosarlos. Se regula desde 🎨 Diseño.
      var trazo = Number(d.encTrazo);
      if (trazo > 0) { ctx.lineWidth = trazo; ctx.strokeStyle = ctx.fillStyle; ctx.lineJoin = 'round'; ctx.strokeText(enc.lineas[0], cx, y); }
      y += enc.tam * 1.05;
      if (d.marco) { ctx.fillRect(px.m, Math.round(y + 2), anchoUtil, 2); y += 6; } else { y += 2; }
    }

    var barAlto = Math.max(20, Number(d.barAlto) || 60), textoAlto = d.barTexto ? 16 : 0;
    var yBar = px.h - px.m - (barAlto + textoAlto + 2);
    var espacio = yBar - y;
    var nombre = sinSufijoPrecio((art && art.nombre) || '');
    var precioTxt = fmtPrecio(art ? art.precio : 0, d.preFormato);
    var preTam = Number(d.preTam) || 34, nomTam = Number(d.nomTam) || 20;
    var antTam = esOferta && d.ofertaTachado ? Math.round(preTam * 0.5) : 0;
    var nom = ajustarTexto(ctx, nombre, anchoUtil, Number(d.nomLineas) || 2, "'Arial', 'Roboto', sans-serif", nomTam);
    var altoNombre = nom.lineas.length * nom.tam * 1.12;
    var total = altoNombre + preTam * 1.1 + (antTam ? antTam * 1.2 : 0);
    if (total > espacio) {
      var f = Math.max(0.4, espacio / total);
      preTam = Math.floor(preTam * f); nomTam = Math.floor(nomTam * f); antTam = Math.floor(antTam * f);
      nom = ajustarTexto(ctx, nombre, anchoUtil, Number(d.nomLineas) || 2, "'Arial', 'Roboto', sans-serif", nomTam);
      altoNombre = nom.lineas.length * nom.tam * 1.12;
    }
    var sobra = Math.max(0, espacio - (altoNombre + preTam * 1.1 + (antTam ? antTam * 1.2 : 0)));
    y += sobra / 3;
    ctx.font = fuenteConTam("'Arial', 'Roboto', sans-serif", nom.tam);
    nom.lineas.forEach(function (l) { ctx.fillText(l, cx, y); y += nom.tam * 1.12; });
    y += sobra / 3;
    if (antTam) {
      ctx.font = fuenteConTam("'Arial', 'Roboto', sans-serif", antTam);
      var antTxt = 'antes ' + fmtPrecio(art.precioAnterior, d.preFormato);
      var w = ctx.measureText(antTxt).width;
      ctx.fillText(antTxt, cx, y);
      ctx.fillRect(Math.round(cx - w / 2), Math.round(y + antTam * 0.55), Math.round(w), Math.max(2, Math.round(antTam / 9)));
      y += antTam * 1.2;
    }
    ctx.font = fuenteConTam("bold 'Arial', 'Roboto', sans-serif", preTam);
    ctx.fillText(precioTxt, cx, y);

    var codigo = (art && (art.barcode || art.sku)) || '';
    if (codigo) {
      var bc = document.createElement('canvas');
      try {
        JsBarcode(bc, codigo, { format: 'CODE128', width: Number(d.barMod) || 2, height: barAlto, displayValue: false, margin: 0 });
        if (bc.width > anchoUtil && (Number(d.barMod) || 2) > 1) JsBarcode(bc, codigo, { format: 'CODE128', width: 1, height: barAlto, displayValue: false, margin: 0 });
        ctx.imageSmoothingEnabled = false; ctx.drawImage(bc, Math.round(cx - bc.width / 2), yBar);
      } catch (e) {}
      if (d.barTexto) { ctx.font = fuenteConTam("'Arial', 'Roboto', sans-serif", 13); ctx.fillText(codigo, cx, yBar + barAlto + 3); }
    }
    return canvas;
  }
  function actualizarPreview() {
    var art = S.actual || (S.vista === 'nuevo' ? { nombre: $('nNombre').value || 'Nombre del artículo', precio: Number($('nPrecio').value) || 0, sku: String(S.proximoSku || '00000') } : null);
    actualizarNombreLoyverse();
    var cv = $('preview');
    var oferta = S.etiquetaOferta && art && art.precioAnterior;
    $('etqTipo').classList.toggle('oculto', !oferta);
    if (!art) { renderEtiqueta(cv, S.diseno, EJEMPLO, false); $('previewInfo').textContent = 'Ejemplo. Elegí o creá un artículo para imprimir su etiqueta.'; $('btnImprimir').disabled = true; return; }
    renderEtiqueta(cv, S.diseno, art, oferta);
    $('previewInfo').textContent = (S.actual ? 'Lista para imprimir · ' : 'Vista previa · ') + S.diseno.anchoMm + '×' + S.diseno.altoMm + ' mm' + (oferta ? ' · etiqueta de oferta' : '');
    $('btnImprimir').disabled = !S.actual;
  }

  // ── TSPL ─────────────────────────────────────────────────────────────────
  function canvasABitmapTspl(canvas, invertir) {
    var w = canvas.width, h = canvas.height, wb = Math.ceil(w / 8);
    var data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    var out = new Uint8Array(wb * h);
    for (var y = 0; y < h; y++) for (var xb = 0; xb < wb; xb++) {
      var byte = 0;
      for (var bit = 0; bit < 8; bit++) {
        var x = xb * 8 + bit, blanco = true;
        if (x < w) { var i = (y * w + x) * 4; var lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; blanco = data[i + 3] < 128 || lum > 140; }
        var v = invertir ? !blanco : blanco;
        if (v) byte |= (0x80 >> bit);
      }
      out[y * wb + xb] = byte;
    }
    return { bytes: out, wb: wb, h: h };
  }
  function armarTspl(canvas, d, copias) {
    var bm = canvasABitmapTspl(canvas, !!d.invertirBits), enc = new TextEncoder();
    var cab = 'SIZE ' + d.anchoMm + ' mm,' + d.altoMm + ' mm\r\nGAP ' + d.gapMm + ' mm,0 mm\r\nDIRECTION ' + (Number(d.direccion) || 0) + '\r\nDENSITY ' + (Number(d.densidad) || 8) + '\r\nSPEED ' + (Number(d.velocidad) || 4) + '\r\nCLS\r\nBITMAP 0,0,' + bm.wb + ',' + bm.h + ',0,';
    var pie = '\r\nPRINT 1,' + (Number(copias) || 1) + '\r\n';
    var a = enc.encode(cab), c = enc.encode(pie), todo = new Uint8Array(a.length + bm.bytes.length + c.length);
    todo.set(a, 0); todo.set(bm.bytes, a.length); todo.set(c, a.length + bm.bytes.length);
    return todo;
  }

  // ── ESC/POS (ticket de cambio y comprobante) ─────────────────────────────
  function ascii(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/g, 'n').replace(/Ñ/g, 'N').replace(/[^\x20-\x7E]/g, '?'); }
  function EscPos(ancho) {
    var partes = [], enc = new TextEncoder();
    var o = {
      raw: function (arr) { partes.push(Uint8Array.from(arr)); return o; },
      txt: function (s) { partes.push(enc.encode(ascii(s))); return o; },
      // El salto de línea va aparte: ascii() lo cambiaba por «?» y todo el ticket salía en un solo renglón.
      ln: function (s) { return o.txt(s || '').raw([0x0A]); },
      init: function () { return o.raw([0x1B, 0x40]); },
      center: function () { return o.raw([0x1B, 0x61, 1]); }, left: function () { return o.raw([0x1B, 0x61, 0]); },
      grande: function (on) { return o.raw([0x1D, 0x21, on ? 0x11 : 0x00]); }, negrita: function (on) { return o.raw([0x1B, 0x45, on ? 1 : 0]); },
      ancho: ancho,
      sep: function () { return o.ln(new Array(ancho + 1).join('-')); },
      puntos: function () { return o.ln(new Array(ancho + 1).join('.')); },
      envolver: function (s) { envolverTexto_(s, ancho).forEach(function (l) { o.ln(l); }); return o; },
      filaGrande: function (izq, der) { var a = ancho; ancho = Math.floor(a / 2); o.grande(true).fila(izq, der).grande(false); ancho = a; return o; },
      // Imagen en blanco y negro (GS v 0): el logo sale igual que en el ticket de ventas.
      imagen: function (cv) {
        var w = cv.width, h = cv.height, bw = Math.ceil(w / 8), px = cv.getContext('2d').getImageData(0, 0, w, h).data, datos = new Uint8Array(bw * h);
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
          var i = (y * w + x) * 4;
          if (px[i + 3] > 127 && px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11 < 128) datos[y * bw + (x >> 3)] |= 0x80 >> (x & 7);
        }
        o.raw([0x1D, 0x76, 0x30, 0, bw & 255, bw >> 8, h & 255, h >> 8]); partes.push(datos); return o;
      },
      fila: function (izq, der) { izq = ascii(izq); der = ascii(der); var esp = ancho - izq.length - der.length; if (esp < 1) { izq = izq.slice(0, ancho - der.length - 1); esp = 1; } return o.ln(izq + new Array(esp + 1).join(' ') + der); },
      barcode128: function (data) { var d = enc.encode('{B' + ascii(data)); o.raw([0x1D, 0x48, 2, 0x1D, 0x68, 70, 0x1D, 0x77, 2, 0x1D, 0x6B, 73, d.length]); partes.push(d); return o.ln(); },
      feed: function (n) { return o.raw([0x1B, 0x64, n || 3]); }, cortar: function () { return o.raw([0x1D, 0x56, 0]); }, // GS V 0: corte total, el que anda en la Nexuspos (probado en RawBT el 16/09)
      bytes: function () { var len = partes.reduce(function (s, p) { return s + p.length; }, 0), out = new Uint8Array(len), i = 0; partes.forEach(function (p) { out.set(p, i); i += p.length; }); return out; }
    };
    return o;
  }
  function envolverTexto_(s, w) {
    var out = [], linea = '';
    ascii(s).split(' ').forEach(function (p) {
      while (p.length > w) { if (linea) { out.push(linea); linea = ''; } out.push(p.slice(0, w)); p = p.slice(w); }
      if (!linea) linea = p; else if ((linea + ' ' + p).length <= w) linea += ' ' + p; else { out.push(linea); linea = p; }
    });
    if (linea || !out.length) out.push(linea);
    return out;
  }

  // ── Tickets con la cara del de ventas (16/09/2026) ───────────────────────
  // Pedido de Diego: el vale, el ticket de cambio y los comprobantes tienen que parecerse al ticket
  // que Loyverse entrega en cada venta (logo, datos del local, empleado, pie con el Club y las redes),
  // no un boletito corto. La ticketera es una Nexuspos Z-NX 88 UB de 80 mm (48 caracteres).
  var TICKET_LOCAL = {
    nombre: 'EnigmaBA',
    lineas: ['Av. Gral paz y 27 de Febrero (LA GRAN DULCE) LOCAL 69/70, Tapiales', '', 'Indumentaria Femenina', 'Local 69/70 Sector A1 La Gran Dulce'],
    tpv: 'Tablet local',
    pie: ['Gracias por elegir Enigma!', '', 'Sumate al Club y llevate un 10% OFF en efectivo hoy mismo.', '', 'Escanea el QR del mostrador para activar tus beneficios exclusivos.', '', 'IG: @enigma._bs | WhatsApp: 1161369396']
  };
  function anchoTicket_() { return Number(S.diseno.ticketAncho) || 48; }
  function fmtTicket_(n) { return '$' + (Number(n) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fechaTicket_(iso) { var d = new Date(iso); if (isNaN(d.getTime())) d = new Date(); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + dos(d.getHours()) + ':' + dos(d.getMinutes()); }
  /** El «Enigma» en letra cursiva (la de las etiquetas), dibujado para imprimirlo como imagen. */
  function logoTicket_(ancho) {
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    var w = ancho >= 48 ? 576 : 384, tam = ancho >= 48 ? 92 : 66, fuente = tam + "px 'Pinyon Script', Georgia, serif";
    ctx.font = fuente;
    var m = ctx.measureText('Enigma'), sube = Math.ceil(m.actualBoundingBoxAscent || tam * 0.8), baja = Math.ceil(m.actualBoundingBoxDescent || tam * 0.3);
    cv.width = w; cv.height = sube + baja + 8;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.font = fuente; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.2; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Enigma', w / 2, sube + 4); ctx.strokeText('Enigma', w / 2, sube + 4);
    return cv;
  }
  /** Encabezado igual al del ticket de ventas; devuelve el armador para seguir escribiendo. */
  function ticketNuevo_(titulo) {
    var e = EscPos(anchoTicket_()).init().center();
    try { e.imagen(logoTicket_(e.ancho)); } catch (x) { e.grande(true).ln('Enigma').grande(false); }
    e.ln('').negrita(true).ln(TICKET_LOCAL.nombre).negrita(false);
    TICKET_LOCAL.lineas.forEach(function (l) { if (l) e.envolver(l); else e.ln(''); });
    e.left().ln('').ln('Empleado: ' + (S.empleado ? S.empleado.nombre : '')).ln('TPV: ' + TICKET_LOCAL.tpv).puntos();
    if (titulo) e.center().negrita(true).ln(titulo).negrita(false).left().puntos();
    return e;
  }
  /** Pie igual al del ticket de ventas: gracias, el Club, las redes, y fecha y número abajo. */
  function ticketCerrar_(e, fecha, numero) {
    e.puntos().center();
    TICKET_LOCAL.pie.forEach(function (l) { if (l) e.envolver(l); else e.ln(''); });
    e.ln('').left().fila(fechaTicket_(fecha), numero ? '#' + numero : '');
    return e.feed(4).cortar().bytes();
  }
  function lineaArticulo_(e, cantidad, nombre, precio) { e.fila(nombre, fmtTicket_(precio * cantidad)).ln(cantidad + ' x ' + fmtTicket_(precio)); }

  function textoTicketCambio(venta, items, vence) {
    var w = anchoTicket_();
    function rep(c, n) { return new Array(n + 1).join(c); }
    function centrar(s, n) { s = String(s); var esp = Math.max(0, Math.floor((n - s.length) / 2)); return rep(' ', esp) + s; }
    var lineas = [centrar('ENIGMA', w), centrar('TICKET DE CAMBIO', w), rep('-', w), 'Fecha: ' + fechaCorta(venta.fecha), 'Venta: ' + venta.numero, rep('-', w)];
    items.forEach(function (it) { lineas.push((it.cantidad > 1 ? it.cantidad + ' x ' : '') + it.sku + '  ' + sinSufijoPrecio(it.nombre)); });
    lineas.push(rep('-', w), centrar('Valido hasta ' + vence, w));
    if (S.ticketTexto) lineas.push(centrar(S.ticketTexto, w));
    lineas.push('', centrar('[ TC-' + venta.numero + ' ]', w));
    return lineas.join('\n');
  }
  function bytesTicketCambio(venta, items, vence) {
    var e = ticketNuevo_('TICKET DE CAMBIO');
    e.ln('Venta: #' + venta.numero).ln('Fecha de compra: ' + fechaTicket_(venta.fecha)).puntos();
    items.forEach(function (it) { e.envolver((it.cantidad > 1 ? it.cantidad + ' x ' : '') + sinSufijoPrecio(it.nombre) + ' (' + it.sku + ')'); });
    e.puntos().center().negrita(true).ln('Valido hasta ' + vence).negrita(false);
    if (S.ticketTexto) e.envolver(S.ticketTexto);
    e.ln('').barcode128('TC-' + venta.numero).ln('Presentar este ticket para cambios');
    return ticketCerrar_(e, new Date().toISOString(), venta.numero);
  }
  function bytesComprobanteCambio(res) {
    var e = ticketNuevo_('COMPROBANTE DE CAMBIO');
    e.ln('Venta original: #' + res.original).puntos();
    e.negrita(true).ln('Devuelve (#' + res.reembolso.numero + ')').negrita(false);
    res.reembolso.items.forEach(function (it) { e.fila((it.cantidad > 1 ? it.cantidad + ' x ' : '') + sinSufijoPrecio(it.nombre), fmtTicket_(it.totalPagado)); });
    if (res.ventaNueva) {
      e.puntos().negrita(true).ln('Se lleva (#' + res.ventaNueva.numero + ')').negrita(false);
      res.ventaNueva.items.forEach(function (it) { e.fila((it.cantidad > 1 ? it.cantidad + ' x ' : '') + sinSufijoPrecio(it.nombre), fmtTicket_(it.totalPagado)); });
    }
    e.puntos().negrita(true).filaGrande(res.diferencia > 0 ? 'Paga' : res.diferencia < 0 ? 'Devuelve' : 'Parejo', fmtTicket_(Math.abs(res.diferencia))).negrita(false);
    if (res.medio) e.ln(res.medio);
    return ticketCerrar_(e, new Date().toISOString(), res.original);
  }

  // ── Transportes ──────────────────────────────────────────────────────────
  var AYUDA_TRANSPORTE = {
    usb: 'La impresora va con cable USB‑C (OTG) a la tablet. La primera vez tocá «Conectar» y elegila de la lista; después queda recordada.',
    ble: 'La impresora se empareja por Bluetooth BLE. Tocá «Conectar» y elegila de la lista.',
    rawbt: 'Usa la app gratuita RawBT (Play Store) instalada en esta tablet: ella le habla a la impresora por USB, Bluetooth clásico o red. En RawBT activá «Servidor WebSocket» para que sea a un toque.',
    share: 'Se genera la etiqueta como imagen y se manda a la app de Xprinter con «Compartir». Sirve de respaldo.',
    sistema: 'Usa el cuadro de impresión de Android. Solo si la impresora está instalada como impresora del sistema.'
  };
  var AYUDA_TICKET = {
    rawbt: 'RawBT le manda el ticket a la impresora de tickets por USB, Bluetooth clásico o red (la misma que usa Loyverse). Es la opción más compatible.',
    ble: 'Directo por Bluetooth BLE (si la impresora de tickets lo soporta).',
    usb: 'Directo por cable USB‑C (OTG). Si Loyverse la tiene tomada, usá RawBT.'
  };
  function setChipImpresora() {
    var c = $('chipImpresora');
    var nombre = { usb: 'USB', ble: 'Bluetooth', rawbt: 'RawBT', share: 'app Xprinter', sistema: 'sistema' }[S.transporte];
    if (S.transporte !== 'usb' && S.transporte !== 'ble') { c.className = 'chip ok'; c.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z"/><path d="M7.5 7.5h.01"/></svg> ' + escapar(nombre); }
    else { c.className = 'chip ' + (S.impresora.conectada ? 'ok' : 'mal'); c.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4.8A2 2 0 0 1 4.8 2.8H12a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.8Z"/><path d="M7.5 7.5h.01"/></svg> ' + escapar(nombre + (S.impresora.conectada ? ' · ' + (S.impresora.nombre || 'conectada') : ' · sin conectar')); }
    $('estadoConexion').textContent = (S.transporte === 'usb' || S.transporte === 'ble') ? (S.impresora.conectada ? 'Conectada: ' + (S.impresora.nombre || '') : 'Sin conectar') : 'Listo';
    $('estadoConexionTicket').textContent = (S.transporteTicket === 'rawbt') ? 'Vía RawBT' : (S.ticketera.conectada ? 'Conectada: ' + (S.ticketera.nombre || '') : 'Sin conectar');
  }

  function usbPreparar(dev, slot) {
    return dev.open().then(function () { if (dev.configuration === null) return dev.selectConfiguration(1); }).then(function () {
      var elegido = null;
      dev.configuration.interfaces.forEach(function (iface) { iface.alternates.forEach(function (alt) { var ep = alt.endpoints.filter(function (e) { return e.direction === 'out' && e.type === 'bulk'; })[0]; if (ep && (!elegido || alt.interfaceClass === 7)) elegido = { n: iface.interfaceNumber, ep: ep.endpointNumber }; }); });
      if (!elegido) throw new Error('La impresora USB no expone un canal de impresión');
      return dev.claimInterface(elegido.n).then(function () { slot.usb = dev; slot.usbEp = elegido.ep; slot.conectada = true; slot.nombre = dev.productName || 'USB'; setChipImpresora(); });
    });
  }
  function usbConectar(slot, interactivo) {
    if (!navigator.usb) return Promise.reject(new Error('Este navegador no permite USB. Usá Chrome en la tablet.'));
    var p = interactivo ? navigator.usb.requestDevice({ filters: [] }) : navigator.usb.getDevices().then(function (ds) { if (!ds.length) throw new Error('Todavía no hay impresora USB autorizada'); return ds[slot === S.ticketera && ds.length > 1 ? 1 : 0]; });
    return p.then(function (dev) { return usbPreparar(dev, slot); });
  }
  function usbEnviar(slot, bytes) {
    var ini = (slot.conectada && slot.usb) ? Promise.resolve() : usbConectar(slot, false);
    return ini.then(function () {
      var dev = slot.usb, TAM = 4096, i = 0;
      function paso() { if (i >= bytes.length) return Promise.resolve(); var trozo = bytes.slice(i, i + TAM); i += TAM; return dev.transferOut(slot.usbEp, trozo).then(paso); }
      return paso();
    });
  }
  var BLE_SERVICIOS = ['000018f0-0000-1000-8000-00805f9b34fb', '0000ff00-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ff80-0000-1000-8000-00805f9b34fb', '0000fee7-0000-1000-8000-00805f9b34fb', '0000ae30-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '0000fff0-0000-1000-8000-00805f9b34fb'];
  /**
   * 16/09/2026: con el permiso de Bluetooth guardado (flag de Chrome), al abrir la app Chrome ya sabe
   * cuál es la impresora, pero si se conecta de golpe contesta «Bluetooth Device is no longer in range».
   * Hay que escucharla primero (watchAdvertisements) y conectarse cuando se anuncia. Se espera hasta 8 s.
   */
  function bleDespertar_(dev) {
    if (!dev.watchAdvertisements) return Promise.resolve();
    return new Promise(function (resolve) {
      var listo = false, ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      function fin() {
        if (listo) return; listo = true;
        dev.removeEventListener('advertisementreceived', fin);
        try { if (ctl) ctl.abort(); else if (dev.unwatchAdvertisements) dev.unwatchAdvertisements(); } catch (e) {}
        resolve();
      }
      dev.addEventListener('advertisementreceived', fin);
      try { (ctl ? dev.watchAdvertisements({ signal: ctl.signal }) : dev.watchAdvertisements()).catch(fin); } catch (e) { fin(); }
      setTimeout(fin, 8000);
    });
  }
  function bleConectarGatt_(dev, intentos) {
    return dev.gatt.connect().catch(function (e) {
      if (intentos <= 0) throw e;
      return bleDespertar_(dev).then(function () { return bleConectarGatt_(dev, intentos - 1); });
    });
  }
  function bleClave_(slot) { return slot === S.ticketera ? 'em_ble_ticket' : 'em_ble_etiqueta'; }
  function blePreparar(dev, slot) {
    return bleConectarGatt_(dev, 2).then(function (server) { return server.getPrimaryServices(); }).then(function (servicios) {
      var cadena = Promise.resolve(null);
      servicios.forEach(function (sv) { cadena = cadena.then(function (enc) { if (enc) return enc; return sv.getCharacteristics().then(function (chs) { return chs.filter(function (c) { return c.properties.writeWithoutResponse || c.properties.write; }).sort(function (a, b) { return (b.properties.writeWithoutResponse ? 1 : 0) - (a.properties.writeWithoutResponse ? 1 : 0); })[0] || null; }).catch(function () { return null; }); }); });
      return cadena;
    }).then(function (ch) {
      if (!ch) throw new Error('No encontré el canal de escritura de la impresora Bluetooth');
      slot.ble = dev; slot.bleChar = ch; slot.bleSinRespuesta = !!ch.properties.writeWithoutResponse; slot.conectada = true; slot.nombre = dev.name || 'Bluetooth';
      try { localStorage.setItem(bleClave_(slot), JSON.stringify({ id: dev.id, nombre: dev.name || '' })); } catch (e) {}
      dev.addEventListener('gattserverdisconnected', function () { slot.conectada = false; setChipImpresora(); });
      setChipImpresora();
    });
  }
  function bleConectar(slot, interactivo) {
    if (!navigator.bluetooth) return Promise.reject(new Error('Este navegador no permite Bluetooth. Usá Chrome en la tablet.'));
    var p;
    if (interactivo) p = navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: BLE_SERVICIOS });
    else if (navigator.bluetooth.getDevices) p = navigator.bluetooth.getDevices().then(function (ds) {
      if (!ds.length) throw new Error('Todavía no hay impresora Bluetooth autorizada');
      var mia = null; try { mia = JSON.parse(localStorage.getItem(bleClave_(slot)) || 'null'); } catch (e) {}
      var otro = null; try { otro = JSON.parse(localStorage.getItem(bleClave_(slot === S.ticketera ? S.impresora : S.ticketera)) || 'null'); } catch (e) {}
      var dev = (mia && (ds.filter(function (d) { return d.id === mia.id; })[0] || ds.filter(function (d) { return mia.nombre && d.name === mia.nombre; })[0])) ||
        ds.filter(function (d) { return !otro || (d.id !== otro.id && d.name !== otro.nombre); })[0];
      if (!dev) throw new Error('Tocá «Conectar» para elegir esta impresora');
      return dev;
    });
    else p = Promise.reject(new Error('Tocá «Conectar impresora» en ⚙️ Ajustes'));
    return p.then(function (dev) { return blePreparar(dev, slot); });
  }
  function bleEnviar(slot, bytes) {
    var ini = (slot.conectada && slot.ble && slot.ble.gatt.connected) ? Promise.resolve() : (slot.ble ? blePreparar(slot.ble, slot) : bleConectar(slot, false));
    return ini.then(function () {
      var ch = slot.bleChar, TAM = 120, i = 0;
      function paso() { if (i >= bytes.length) return Promise.resolve(); var trozo = bytes.slice(i, i + TAM); i += TAM; var w = slot.bleSinRespuesta ? ch.writeValueWithoutResponse(trozo) : ch.writeValue(trozo); return w.then(function () { return new Promise(function (r) { setTimeout(r, slot.bleSinRespuesta ? 12 : 0); }); }).then(paso); }
      return paso();
    });
  }
  function rawbtEnviar(bytes) {
    return new Promise(function (resolve, reject) {
      var hecho = false, ws;
      var timer = setTimeout(function () { if (!hecho) { hecho = true; try { ws && ws.close(); } catch (e) {} rawbtEsquema(bytes).then(resolve, reject); } }, 1500);
      try {
        ws = new WebSocket('ws://127.0.0.1:40213/');
        ws.binaryType = 'arraybuffer';
        ws.onopen = function () { try { ws.send(bytes); setTimeout(function () { if (!hecho) { hecho = true; clearTimeout(timer); ws.close(); resolve(); } }, 300); } catch (e) { if (!hecho) { hecho = true; clearTimeout(timer); rawbtEsquema(bytes).then(resolve, reject); } } };
        ws.onerror = function () { if (!hecho) { hecho = true; clearTimeout(timer); rawbtEsquema(bytes).then(resolve, reject); } };
      } catch (e) { if (!hecho) { hecho = true; clearTimeout(timer); rawbtEsquema(bytes).then(resolve, reject); } }
    });
  }
  function rawbtEsquema(bytes) {
    return new Promise(function (resolve, reject) {
      try {
        var b64 = btoa(Array.prototype.map.call(bytes, function (b) { return String.fromCharCode(b); }).join(''));
        window.location.href = 'intent:base64,' + b64 + '#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;';
        setTimeout(resolve, 400);
      } catch (e) { reject(new Error('No pude abrir RawBT: ' + e.message)); }
    });
  }
  function compartirImagen(canvas, nombreArchivo) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        var file = new File([blob], nombreArchivo + '.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: 'Etiqueta ' + nombreArchivo }).then(resolve).catch(function (e) { reject(new Error(e.name === 'AbortError' ? 'Compartir cancelado' : e.message)); });
        else { var a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = nombreArchivo + '.png'; a.click(); resolve(); }
      }, 'image/png');
    });
  }
  function imprimirSistema(canvas, d, copias) {
    var w = window.open('', '_blank');
    if (!w) return Promise.reject(new Error('El navegador bloqueó la ventana de impresión'));
    var src = canvas.toDataURL('image/png'), paginas = '';
    for (var i = 0; i < copias; i++) paginas += '<img src="' + src + '">';
    w.document.write('<!DOCTYPE html><html><head><title>Etiqueta</title><style>@page{size:' + d.anchoMm + 'mm ' + d.altoMm + 'mm;margin:0}body{margin:0}img{width:' + d.anchoMm + 'mm;height:' + d.altoMm + 'mm;display:block;page-break-after:always}</style></head><body>' + paginas + '</body></html>');
    w.document.close();
    return new Promise(function (resolve) { setTimeout(function () { w.focus(); w.print(); resolve(); }, 300); });
  }
  function conectarImpresora(slot, transporte) {
    var p = transporte === 'usb' ? usbConectar(slot, true) : transporte === 'ble' ? bleConectar(slot, true) : Promise.resolve();
    var est = slot === S.ticketera ? $('estadoConexionTicket') : $('estadoConexion');
    est.textContent = 'Conectando…';
    return p.then(function () { toast('Impresora conectada', 'ok'); setChipImpresora(); }).catch(function (e) { slot.conectada = false; setChipImpresora(); est.textContent = 'No se pudo: ' + e.message; toast(e.message, 'mal'); });
  }
  function imprimirCanvas(canvas, copias, nombreArchivo) {
    var d = S.diseno, t = S.transporte;
    if (t === 'usb' || t === 'ble' || t === 'rawbt') { var datos = armarTspl(canvas, d, copias); return t === 'usb' ? usbEnviar(S.impresora, datos) : t === 'ble' ? bleEnviar(S.impresora, datos) : rawbtEnviar(datos); }
    if (t === 'share') return compartirImagen(canvas, nombreArchivo || 'etiqueta');
    return imprimirSistema(canvas, d, copias);
  }
  function imprimirTicket(bytes) {
    var t = S.transporteTicket;
    if (t === 'usb') return usbEnviar(S.ticketera, bytes);
    if (t === 'ble') return bleEnviar(S.ticketera, bytes);
    return rawbtEnviar(bytes);
  }
  function imprimirArticulo(a, copias, origen, oferta) {
    // La caligrafía se carga al arrancar la app, así que a la hora de imprimir ya está y
    // esto sigue derecho, sin un solo salto de más. El rodeo es solo por si alguien imprime
    // en el primer segundo de vida de la app, antes de que la letra terminara de leerse.
    if (!_fuenteMarcaLista) return fuenteMarcaLista().then(function () { return imprimirArticulo(a, copias, origen, oferta); });
    var cv = document.createElement('canvas');
    renderEtiqueta(cv, S.diseno, a, oferta && a.precioAnterior);
    return imprimirCanvas(cv, copias, a.sku + '-' + sinSufijoPrecio(a.nombre).replace(/[^\w]+/g, '_').slice(0, 30)).then(function () {
      accionar('etiqueta', { sku: a.sku, nombre: a.nombre, precio: a.precio, cantidad: copias, origen: origen || 'reimpresion', dispositivo: S.dispositivo }, { desc: 'etiquetas ' + a.sku }).catch(function () {});
    });
  }
  function imprimirActual(origen) {
    if (!S.actual) return Promise.resolve();
    var copias = Math.max(1, Math.min(200, parseInt($('cantidad').value, 10) || 1));
    var msg = $('msgImprimir'); msg.className = 'msg'; msg.textContent = 'Imprimiendo ' + copias + (copias === 1 ? ' etiqueta…' : ' etiquetas…');
    $('btnImprimir').disabled = true;
    return imprimirArticulo(S.actual, copias, origen, S.etiquetaOferta).then(function () { msg.className = 'msg ok'; msg.textContent = '✓ Enviado a la impresora (' + copias + ')'; vibrar(); })
      .catch(function (e) { msg.className = 'msg mal'; msg.textContent = '✗ ' + e.message; toast(e.message, 'mal'); })
      .finally(function () { $('btnImprimir').disabled = !S.actual; });
  }
  function imprimirVarios(lista, origen) {
    var i = 0;
    if (!lista.length) { toast('No hay nada para imprimir', 'mal'); return Promise.resolve(); }
    cargando('Imprimiendo etiquetas… 0/' + lista.length);
    function paso() {
      if (i >= lista.length) { cargando(false); toast('Listo: ' + lista.length + ' etiquetas', 'ok'); return Promise.resolve(); }
      var x = lista[i++]; $('cargandoTxt').textContent = 'Imprimiendo etiquetas… ' + i + '/' + lista.length;
      return imprimirArticulo(x.a, x.copias || 1, origen, !!x.a.precioAnterior).then(paso);
    }
    return paso().catch(function (e) { cargando(false); toast('Se cortó en la ' + i + ': ' + e.message, 'mal'); });
  }
  function imprimirPrueba() {
    $('estadoConexion').textContent = 'Enviando prueba…';
    if (!_fuenteMarcaLista) return fuenteMarcaLista().then(imprimirPrueba);
    var cv = document.createElement('canvas');
    renderEtiqueta(cv, S.diseno, { nombre: 'PRUEBA DE IMPRESIÓN', sku: '12345', precio: 99999 }, false);
    return imprimirCanvas(cv, 1, 'prueba').then(function () { $('estadoConexion').textContent = 'Prueba enviada.'; toast('Prueba enviada', 'ok'); }).catch(function (e) { $('estadoConexion').textContent = 'No se pudo: ' + e.message; toast(e.message, 'mal'); });
  }
  function imprimirPruebaTicket() {
    if (!_fuenteMarcaLista) return fuenteMarcaLista().then(imprimirPruebaTicket);
    var e = ticketNuevo_('PRUEBA DE IMPRESION');
    e.center().envolver('Si esto se ve como el ticket de ventas, la impresora quedo bien configurada.').ln('').barcode128('TC-PRUEBA');
    var bytes = ticketCerrar_(e, new Date().toISOString(), 'PRUEBA');
    $('estadoConexionTicket').textContent = 'Enviando prueba…';
    return imprimirTicket(bytes).then(function () { $('estadoConexionTicket').textContent = 'Prueba enviada.'; toast('Prueba enviada', 'ok'); }).catch(function (e2) { $('estadoConexionTicket').textContent = 'No se pudo: ' + e2.message; toast(e2.message, 'mal'); });
  }

  // ── Ticket de cambio ─────────────────────────────────────────────────────
  function abrirTicketCambio() {
    mostrarVista('ticketCambio'); pasoTc(1); S.tc.venta = null;
    $('tcNumero').value = ''; $('tcVentas').innerHTML = '<div class="vacio">Cargando ventas de hoy…</div>';
    api('ventas_hoy', { limite: 30 }, 'GET').then(function (r) {
      var ventas = r.ventas.filter(function (v) { return v.tipo === 'SALE' && !v.cancelado; });
      S.tc.guardadas = ventas;
      try { localStorage.setItem('em_ventas', JSON.stringify({ ts: Date.now(), ventas: ventas })); } catch (e) {}
      if (!ventas.length) { $('tcVentas').innerHTML = '<div class="vacio">Todavía no hay ventas hoy. Tipeá el número de la venta arriba.</div>'; return; }
      $('tcVentas').innerHTML = ventas.map(filaVenta).join('');
    }).catch(function (e) {
      var g = null; try { g = JSON.parse(localStorage.getItem('em_ventas') || 'null'); } catch (e2) {}
      if (g && g.ventas && g.ventas.length && new Date(g.ts).toDateString() === new Date().toDateString()) {
        S.tc.guardadas = g.ventas;
        $('tcVentas').innerHTML = '<div class="vacio">Sin internet: estas son las ventas que alcancé a ver. Si falta la última, esperá a que vuelva la señal.</div>' + g.ventas.map(filaVenta).join('');
      } else $('tcVentas').innerHTML = '<div class="vacio">' + escapar(e.message) + '</div>';
    });
  }
  function filaVenta(v) {
    return '<button class="venta" data-num="' + escapar(v.numero) + '"><div class="hora">' + horaCorta(v.fecha) + '</div><div class="det"><b>Ticket ' + escapar(v.numero) + '</b> · ' + v.items.length + (v.items.length === 1 ? ' artículo' : ' artículos') + ' · ' + escapar((v.pagos[0] || {}).nombre || '') + '<br>' + escapar(v.items.map(function (i) { return sinSufijoPrecio(i.nombre); }).join(', ').slice(0, 90)) + '</div><div class="tot">' + fmtPesos(v.total) + '</div></button>';
  }
  function pasoTc(n) {
    $$('#vistaTicketCambio .paso').forEach(function (p, i) { p.classList.toggle('activo', i + 1 === n); p.classList.toggle('hecho', i + 1 < n); });
    $('tcPaso1').classList.toggle('oculto', n !== 1); $('tcPaso2').classList.toggle('oculto', n !== 2); $('tcPaso3').classList.toggle('oculto', n !== 3);
  }
  function tcElegirVenta(numero) {
    var guardada = (S.tc.guardadas || []).filter(function (v) { return v.numero === numero; })[0];
    if (!S.online && guardada) { tcPintarVenta(Object.assign({ ticketsCambio: [], cambios: [] }, guardada)); return; }
    cargando('Buscando la venta…');
    api('venta_buscar', { numero: numero }, 'GET').then(function (r) {
      var v = r.venta;
      if (v.tipo !== 'SALE') { toast('Ese número es un reembolso, no una venta', 'mal'); return; }
      tcPintarVenta(v);
    }).catch(function (e) { toast(e.message, 'mal'); }).finally(function () { cargando(false); });
  }
  function tcPintarVenta(v) {
    {
      S.tc.venta = v;
      $('tcVentaCab').innerHTML = '<b>Ticket ' + escapar(v.numero) + '</b><span>' + fechaCorta(v.fecha) + '</span><span>' + fmtPesos(v.total) + ' · ' + escapar((v.pagos[0] || {}).nombre || '') + '</span>' + (v.ticketsCambio.length ? '<span class="pill">ya tiene ' + v.ticketsCambio.length + ' ticket(s) de cambio</span>' : '');
      $('tcItems').innerHTML = v.items.map(function (it, i) { return '<div class="item-check marcado" data-i="' + i + '"><div class="cb">✓</div><div><div class="nom">' + escapar(sinSufijoPrecio(it.nombre)) + '</div><div class="sub mono">' + escapar(it.sku) + (it.cantidad > 1 ? ' · x' + it.cantidad : '') + '</div></div><div class="der"></div></div>'; }).join('');
      pasoTc(2);
    }
  }
  function tcImprimir() {
    var v = S.tc.venta; if (!v) return;
    var items = $$('#tcItems .item-check.marcado').map(function (el) { return v.items[Number(el.getAttribute('data-i'))]; }).map(function (it) { return { sku: it.sku, nombre: it.nombre, cantidad: it.cantidad, lineId: it.lineId }; });
    if (!items.length) { toast('Marcá al menos un artículo', 'mal'); return; }
    cargando('Registrando e imprimiendo…');
    accionar('ticket_cambio', { numero: v.numero, items: items, dispositivo: S.dispositivo }, { desc: 'ticket de cambio ' + v.numero }).then(function (r) {
      if (r && r.encolado) { var f = new Date(Date.now() + (S.diasCambio || 30) * 86400000); r = { vence: dos(f.getDate()) + '/' + dos(f.getMonth() + 1) + '/' + f.getFullYear() }; }
      S.tc.ultimo = { venta: v, items: items, vence: r.vence };
      $('tcPreview').textContent = textoTicketCambio(v, items, r.vence);
      return imprimirTicket(bytesTicketCambio(v, items, r.vence)).then(function () { $('tcListo').textContent = 'Ticket de cambio impreso. Vale hasta el ' + r.vence + '.'; }, function (e) { $('tcListo').textContent = 'Quedó registrado, pero la impresora no respondió: ' + e.message + '. Tocá «Reimprimir».'; });
    }).then(function () { pasoTc(3); vibrar([30, 30, 30]); }).catch(function (e) { toast(e.message, 'mal'); }).finally(function () { cargando(false); });
  }

  // ── Cambio / devolución ──────────────────────────────────────────────────
  function abrirCambio(numero) {
    mostrarVista('cambio'); pasoCb(1); S.cb = { venta: null, devolver: {}, entregar: [], pagoId: '', resultado: null };
    $('cbNumero').value = numero || ''; $('cbEstado').textContent = '';
    if (!S.pagos.length) api('pagos', {}, 'GET').then(function (r) { S.pagos = r.pagos; renderCbPagos(); }).catch(function () {});
    if (numero) cbBuscar(); else setTimeout(function () { $('cbNumero').focus(); }, 60);
  }
  function pasoCb(n) { $('cbPaso1').classList.toggle('oculto', n !== 1); $('cbPaso2').classList.toggle('oculto', n !== 2); $('cbPaso3').classList.toggle('oculto', n !== 3); }
  function cbBuscar() {
    var numero = $('cbNumero').value.trim().replace(/^TC-?/i, ''); if (!numero) return;
    $('cbEstado').textContent = 'Buscando…'; cargando('Buscando la venta…');
    api('venta_buscar', { numero: numero }, 'GET').then(function (r) {
      var v = r.venta;
      if (v.tipo !== 'SALE') { $('cbEstado').textContent = 'Ese número es un reembolso (' + v.refundFor + '), no una venta.'; return; }
      S.cb.venta = v; S.cb.devolver = {}; S.cb.entregar = []; S.cb.pagoId = (v.pagos[0] || {}).id || '';
      $('cbVentaCab').innerHTML = '<b>Ticket ' + escapar(v.numero) + '</b><span>' + fechaCorta(v.fecha) + '</span><span>' + fmtPesos(v.total) + ' · ' + escapar((v.pagos[0] || {}).nombre || '') + '</span>';
      var avisos = [];
      var tc = v.ticketsCambio[0];
      if (tc) { var vencido = new Date(tc.vence) < new Date(); avisos.push('<div class="aviso">🎁 Tiene ticket de cambio emitido el ' + fechaCorta(tc.fecha) + ', válido hasta ' + new Date(tc.vence).toLocaleDateString('es-AR') + (vencido ? ' — <b>VENCIDO</b>' : '') + '.</div>'); }
      if (v.cambios.length) avisos.push('<div class="aviso">🔁 Ya se registraron ' + v.cambios.length + ' cambio(s) de esta venta: ' + v.cambios.map(function (c) { return 'reembolso ' + c.reembolso + (c.ventaNueva ? ' + venta ' + c.ventaNueva : ''); }).join('; ') + '.</div>');
      if (v.pagos.length > 1) avisos.push('<div class="aviso">⚠️ Esta venta se pagó con dos medios: Loyverse no deja reembolsarla por acá. Hacé el cambio desde la caja de Loyverse.</div>');
      $('cbAvisos').innerHTML = avisos.join('');
      renderCbDevolver(); renderCbEntregar(); renderCbPagos(); calcularCambio();
      pasoCb(2); $('cbEstado').textContent = '';
      setTimeout(function () { $('cbBuscarArt').focus(); }, 80);
    }).catch(function (e) { $('cbEstado').textContent = e.message; }).finally(function () { cargando(false); });
  }
  function renderCbDevolver() {
    var v = S.cb.venta;
    $('cbDevolver').innerHTML = v.items.map(function (it, i) {
      var sel = S.cb.devolver[i] || 0;
      var dif = it.precioActual !== null && it.precioActual !== it.precioPagado ? '<div class="dif-precio">hoy vale ' + fmtPesos(it.precioActual) + '</div>' : '';
      return '<div class="item-check' + (sel ? ' marcado' : '') + '" data-i="' + i + '"><div class="cb">✓</div><div><div class="nom">' + escapar(sinSufijoPrecio(it.nombre)) + '</div><div class="sub"><span class="mono">' + escapar(it.sku) + '</span> · pagó ' + fmtPesos(it.precioPagado) + (it.cantidad > 1 ? ' c/u · llevó ' + it.cantidad : '') + '</div>' + dif + '</div><div class="der">' +
        (it.cantidad > 1 ? '<div class="cant"><button data-dev="' + i + '" data-d="-1">−</button><span>' + sel + '</span><button data-dev="' + i + '" data-d="1">+</button></div>' : '') + '<b>' + fmtPesos(it.precioPagado * (sel || 0)) + '</b></div></div>';
    }).join('');
  }
  function renderCbEntregar() {
    $('cbEntregar').innerHTML = S.cb.entregar.map(function (e, i) { var a = e.a; return '<div class="item-check marcado" data-e="' + i + '"><div class="cb">✓</div><div><div class="nom">' + escapar(sinSufijoPrecio(a.nombre)) + '</div><div class="sub"><span class="mono">' + escapar(a.sku) + '</span> · ' + fmtPesos(a.precio) + ' c/u</div></div><div class="der"><div class="cant"><button data-ent="' + i + '" data-d="-1">−</button><span>' + e.cantidad + '</span><button data-ent="' + i + '" data-d="1">+</button></div><b>' + fmtPesos(a.precio * e.cantidad) + '</b></div></div>'; }).join('') || '<div class="vacio">Nada por ahora. Si solo devuelve, dejalo vacío.</div>';
  }
  function renderCbPagos() {
    $('cbPagos').innerHTML = S.pagos.map(function (p) { return '<button type="button" class="chip-sel' + (p.id === S.cb.pagoId ? ' activo' : '') + '" data-pago="' + escapar(p.id) + '">' + escapar(p.nombre) + '</button>'; }).join('');
  }
  function calcularCambio() {
    var v = S.cb.venta; if (!v) return;
    var dev = 0; Object.keys(S.cb.devolver).forEach(function (i) { dev += v.items[i].precioPagado * S.cb.devolver[i]; });
    var ent = S.cb.entregar.reduce(function (s, e) { return s + e.a.precio * e.cantidad; }, 0);
    var dif = ent - dev;
    $('cbTotDev').textContent = fmtPesos(dev); $('cbTotEnt').textContent = fmtPesos(ent);
    $('cbDif').textContent = fmtPesos(Math.abs(dif)); $('cbDifEtq').textContent = dif > 0 ? 'El cliente paga' : dif < 0 ? 'Se le devuelve' : 'Sin diferencia';
    $('cbPagoBox').classList.toggle('oculto', !S.cb.entregar.length);
    $('cbRegistrar').disabled = !Object.keys(S.cb.devolver).length || v.pagos.length > 1;
  }
  function cbBuscarArticulo() {
    var q = $('cbBuscarArt').value.trim(), cont = $('cbSugerencias');
    if (!q) { cont.innerHTML = ''; return; }
    var qn = normalizar(q), tokens = qn.split(' ').filter(Boolean), esCodigo = /^\d{3,}$/.test(q);
    var res = S.catalogo.filter(function (a) { return esCodigo ? (a.sku === q || a.barcode === q) : tokens.every(function (t) { return a._n.indexOf(t) >= 0 || a.sku.indexOf(t) === 0; }); }).slice(0, 6);
    if (esCodigo && res.length === 1 && cbBuscarArticulo._enter) { cbBuscarArticulo._enter = false; cbAgregar(res[0]); $('cbBuscarArt').value = ''; cont.innerHTML = ''; return; }
    cont.innerHTML = res.map(function (a) { return filaArticulo(a, false, 'data-cb-add="1"'); }).join('');
  }
  function cbAgregar(a) {
    var ex = S.cb.entregar.filter(function (e) { return e.a.variantId === a.variantId; })[0];
    if (ex) ex.cantidad++; else S.cb.entregar.push({ a: a, cantidad: 1 });
    renderCbEntregar(); calcularCambio(); vibrar(15);
  }
  function cbRegistrar() {
    var v = S.cb.venta;
    var devolver = Object.keys(S.cb.devolver).filter(function (i) { return S.cb.devolver[i] > 0; }).map(function (i) { return { lineId: v.items[i].lineId, cantidad: S.cb.devolver[i], sku: v.items[i].sku, nombre: v.items[i].nombre }; });
    var entregar = S.cb.entregar.map(function (e) { return { variantId: e.a.variantId, cantidad: e.cantidad, sku: e.a.sku, nombre: e.a.nombre }; });
    if (!devolver.length) { toast('Marcá qué devuelve', 'mal'); return; }
    if (entregar.length && !S.cb.pagoId) { toast('Elegí el medio de pago de la diferencia', 'mal'); return; }
    if (!S.online) { toast('Sin internet no puedo registrar el cambio en Loyverse. Anotalo y hacelo cuando vuelva la señal.', 'mal'); return; }
    cargando('Registrando en Loyverse… (reembolso' + (entregar.length ? ' + venta nueva' : '') + ')');
    api('cambio_registrar', { numero: v.numero, devolver: devolver, entregar: entregar, pagoId: S.cb.pagoId }).then(function (r) {
      S.cb.resultado = Object.assign({ original: v.numero }, r);
      $('cbListo').textContent = 'Listo. Loyverse ya tiene el reembolso ' + r.reembolso.numero + (r.ventaNueva ? ' y la venta nueva ' + r.ventaNueva.numero : '') + '. El stock se acomodó solo.';
      $('cbDetalle').innerHTML = '<b style="font-size:26px">' + (r.diferencia > 0 ? 'Cobrar ' : r.diferencia < 0 ? 'Devolver ' : 'Sin diferencia ') + (r.diferencia ? fmtPesos(Math.abs(r.diferencia)) : '') + '</b>' + (r.medio ? '<br>Medio: ' + escapar(r.medio) : '') + (r.diferencia < 0 ? '<br><span class="texto">Acordate de sacar la plata de la caja si fue en efectivo.</span>' : '');
      pasoCb(3); vibrar([30, 30, 30]);
    }).catch(function (e) { toast(e.message, 'mal'); }).finally(function () { cargando(false); });
  }

  // ── Costos (admin) ───────────────────────────────────────────────────────
  function abrirCostos() {
    mostrarVista('costos'); $('coLista').innerHTML = '<div class="vacio">Cargando…</div>'; $('coConCosto').innerHTML = '';
    api('costos_pendientes', {}, 'GET').then(function (r) { S.co = { pendientes: r.pendientes, conCosto: r.conCosto }; renderCostos(); setTimeout(function () { var f = $('coLista').querySelector('input'); if (f) f.focus(); }, 80); })
      .catch(function (e) { $('coLista').innerHTML = '<div class="vacio">' + escapar(e.message) + '</div>'; });
  }
  function renderCostos() {
    var f = normalizar($('coFiltro').value);
    var lista = S.co.pendientes.filter(function (x) { return !f || normalizar(x.nombre).indexOf(f) >= 0 || x.sku.indexOf(f) === 0; });
    $('coResumen').textContent = S.co.pendientes.length + ' sin costo · ' + S.co.conCosto.length + ' con costo';
    $('coLista').innerHTML = lista.length ? lista.slice(0, 150).map(function (x) { return '<div class="costo-fila" data-vid="' + escapar(x.variantId) + '" data-iid="' + escapar(x.itemId) + '"><div><div class="nom">' + escapar(x.nombre) + '</div><div class="sub"><span class="mono">' + escapar(x.sku) + '</span> · vende a ' + fmtPesos(x.precio) + '</div></div><input type="number" inputmode="numeric" min="0" placeholder="costo $"><button class="ok" title="Guardar">✓</button></div>'; }).join('') : '<div class="vacio">🎉 No queda ningún artículo sin costo.</div>';
    $('coConCosto').innerHTML = S.co.conCosto.slice(0, 200).map(function (x) { return '<div class="costo-fila" data-vid="' + escapar(x.variantId) + '" data-iid="' + escapar(x.itemId) + '"><div><div class="nom">' + escapar(x.nombre) + '</div><div class="sub"><span class="mono">' + escapar(x.sku) + '</span> · vende a ' + fmtPesos(x.precio) + ' · costo ' + fmtPesos(x.costo) + ' · margen ' + (x.precio ? Math.round((1 - x.costo / x.precio) * 100) : 0) + '%</div></div><button class="secundario chico" data-editar="1">Editar</button></div>'; }).join('');
  }
  function guardarCostoFila(fila) {
    var inp = fila.querySelector('input'); var c = Number(inp.value);
    if (inp.value === '' || !(c >= 0)) { inp.focus(); return; }
    var vid = fila.getAttribute('data-vid'), iid = fila.getAttribute('data-iid');
    fila.classList.add('listo'); inp.disabled = true;
    var sig = fila.nextElementSibling; if (sig && sig.querySelector('input')) sig.querySelector('input').focus();
    api('costo_set', { itemId: iid, variantId: vid, costo: c }).then(function (r) {
      aplicarActualizacion(r.items);
      var p = S.co.pendientes.filter(function (x) { return x.variantId === vid; })[0];
      if (p) { S.co.pendientes = S.co.pendientes.filter(function (x) { return x !== p; }); S.co.conCosto.unshift(Object.assign({}, p, { costo: c })); }
      actualizarBadgeCostos(); fila.remove();
      $('coResumen').textContent = S.co.pendientes.length + ' sin costo · ' + S.co.conCosto.length + ' con costo';
      if (!S.co.pendientes.length) $('coLista').innerHTML = '<div class="vacio">🎉 No queda ningún artículo sin costo.</div>';
    }).catch(function (e) { fila.classList.remove('listo'); inp.disabled = false; toast(e.message, 'mal'); });
  }

  // ── Precios en lote (admin) ──────────────────────────────────────────────
  function abrirPrecios() {
    mostrarVista('precios'); S.pr = { seleccion: {}, modo: 'porcentaje', cambiados: [] };
    $('prValor').value = ''; $('prBuscar').value = ''; $('prLista').innerHTML = ''; $('prDespues').classList.add('oculto'); $('prProgreso').classList.add('oculto');
    $$('#prCategorias .chip-sel').forEach(function (b) { b.classList.remove('activo'); });
    $$('#prModo .chip-sel').forEach(function (b) { b.classList.toggle('activo', b.getAttribute('data-m') === 'porcentaje'); });
    renderPrPreview();
  }
  function prToggleCategoria(id, btn) {
    btn.classList.toggle('activo');
    var on = btn.classList.contains('activo');
    S.catalogo.filter(function (a) { return a.categoriaId === id; }).forEach(function (a) { if (on) S.pr.seleccion[a.variantId] = true; else delete S.pr.seleccion[a.variantId]; });
    renderPrLista(); renderPrPreview();
  }
  function renderPrLista() {
    var q = normalizar($('prBuscar').value), tokens = q.split(' ').filter(Boolean);
    var lista = q ? S.catalogo.filter(function (a) { return tokens.every(function (t) { return a._n.indexOf(t) >= 0 || a.sku.indexOf(t) === 0; }); }).slice(0, 40) : [];
    $('prLista').innerHTML = lista.map(function (a) { var sel = !!S.pr.seleccion[a.variantId]; return '<div class="item-check' + (sel ? ' marcado' : '') + '" data-pr="' + escapar(a.variantId) + '"><div class="cb">✓</div><div><div class="nom">' + escapar(a.nombre) + '</div><div class="sub mono">' + escapar(a.sku) + '</div></div><div class="der"><b>' + fmtPesos(a.precio) + '</b></div></div>'; }).join('');
  }
  function prCalcular(actual) {
    var valor = Number($('prValor').value) || 0, red = Number($('prRedondeo').value) || 0;
    var nuevo = S.pr.modo === 'porcentaje' ? actual * (1 + valor / 100) : S.pr.modo === 'monto' ? actual + valor : valor;
    if (red > 0) nuevo = Math.round(nuevo / red) * red;
    return Math.max(0, Math.round(nuevo));
  }
  function renderPrPreview() {
    var ids = Object.keys(S.pr.seleccion); $('prSel').textContent = ids.length + ' marcados';
    var valorOk = $('prValor').value !== '';
    $('prAplicar').disabled = !ids.length || !valorOk; $('prAplicar').textContent = 'Aplicar a ' + ids.length + ' artículo' + (ids.length === 1 ? '' : 's');
    if (!ids.length || !valorOk) { $('prPreview').innerHTML = ''; return; }
    $('prPreview').innerHTML = '<table>' + ids.slice(0, 200).map(function (vid) { var a = porVariant(vid); if (!a) return ''; return '<tr><td>' + escapar(a.nombre) + ' <span class="mono" style="color:#6b7280">' + escapar(a.sku) + '</span></td><td>' + fmtPesos(a.precio) + '</td><td><b>' + fmtPesos(prCalcular(a.precio)) + '</b></td></tr>'; }).join('') + (ids.length > 200 ? '<tr><td colspan="3">… y ' + (ids.length - 200) + ' más</td></tr>' : '') + '</table>';
  }
  function prAplicar() {
    var ids = Object.keys(S.pr.seleccion); if (!ids.length) return;
    if (!confirm('¿Aplicar el cambio de precio a ' + ids.length + ' artículos en Loyverse? Esto no se deshace solo.')) return;
    var valor = Number($('prValor').value) || 0, red = Number($('prRedondeo').value) || 0, modo = S.pr.modo;
    $('prAplicar').disabled = true; $('prProgreso').classList.remove('oculto'); $('prDespues').classList.add('oculto'); S.pr.cambiados = [];
    var i = 0, TANDA = 10, errores = 0;
    function paso() {
      if (i >= ids.length) { $('prProgTxt').textContent = 'Listo: ' + S.pr.cambiados.length + ' cambiados' + (errores ? ', ' + errores + ' con error' : ''); $('prDespues').classList.toggle('oculto', !S.pr.cambiados.length); toast('Precios actualizados', 'ok'); vibrar([30, 30, 30]); renderPrPreview(); return; }
      var tanda = ids.slice(i, i + TANDA); i += TANDA;
      $('prProgTxt').textContent = Math.min(i, ids.length) + '/' + ids.length; $('prBarra').style.width = Math.round(Math.min(i, ids.length) / ids.length * 100) + '%';
      return api('precios_masivo', { variantIds: tanda, modo: modo, valor: valor, redondeo: red }).then(function (r) {
        r.resultados.forEach(function (x) { if (x.ok) { aplicarActualizacion([x.item]); S.pr.cambiados.push(x.variantId); } else errores++; });
      }).catch(function () { errores += tanda.length; }).then(paso);
    }
    paso();
  }

  // ── Equipo (admin) / bootstrap ───────────────────────────────────────────
  function abrirEquipo() {
    mostrarVista('equipo'); $('eqLista').textContent = 'Cargando…';
    cargarEquipo();
    $('stCant').textContent = S.catalogo.filter(function (a) { return !a.trackStock; }).length;
  }
  function cargarEquipo() {
    return api('equipo_get', {}, 'GET').then(function (r) {
      S.equipo = r.equipo;
      $('eqLista').innerHTML = r.equipo.map(function (e) { return '<div class="equipo-fila"><div><div class="nom">' + escapar(e.nombre) + (e.esDuenio ? ' <span class="texto">(dueño en Loyverse)</span>' : '') + '</div><div class="sub">' + (e.rol === 'admin' ? 'Encargada' : 'Vendedora') + ' · ' + (e.tienePin ? 'PIN cargado ✓' : '<b style="color:#b91c1c">sin PIN, no puede entrar</b>') + '</div></div><button class="secundario chico" data-eq="' + escapar(e.id) + '">' + (e.tienePin ? 'Editar' : 'Cargar PIN') + '</button></div>'; }).join('') +
        '<div class="equipo-fila"><div><div class="nom">Otra persona</div><div class="sub">que no esté en Loyverse</div></div><button class="secundario chico" data-eq="__nuevo">Agregar</button></div>';
      return r;
    }).catch(function (e) { $('eqLista').innerHTML = '<div class="vacio">' + escapar(e.message) + '</div>'; });
  }
  function editarIntegrante(id, bootstrap) {
    var e = (S.equipo || []).filter(function (x) { return x.id === id; })[0] || { id: '', loyverseId: '', nombre: '', rol: bootstrap ? 'admin' : 'vendedora', tienePin: false };
    $('eqTitulo').textContent = bootstrap ? 'Tu PIN, ' + e.nombre : (e.nombre || 'Nueva persona');
    $('eqNombre').value = e.nombre; $('eqPin').value = ''; $('eqPin2').value = ''; $('eqEstado').textContent = bootstrap ? 'Escribí el mismo PIN que usás en Loyverse, dos veces. Sos la primera persona, así que quedás como Encargada; después podés cargar al resto desde 👥 Equipo.' : (e.tienePin ? 'Dejá el PIN vacío para no cambiarlo.' : 'Loyverse no nos deja leer el PIN: escribilo acá, el mismo de la caja.');
    if (bootstrap) e.rol = 'admin';
    $('eqQuitar').classList.toggle('oculto', !e.id || bootstrap || e.id.indexOf('L-') === 0);
    $$('#formEquipo .chip-sel').forEach(function (b) { b.classList.toggle('activo', b.getAttribute('data-rol') === e.rol); });
    var d = $('dlgEquipoEditar');
    d.dataset.id = e.id || ''; d.dataset.loy = e.loyverseId || ''; d.dataset.bootstrap = bootstrap ? '1' : '';
    d.showModal();
  }
  function guardarIntegrante(quitar) {
    var d = $('dlgEquipoEditar');
    var act = $$('#formEquipo .chip-sel.activo')[0];
    var rol = act ? act.getAttribute('data-rol') : 'vendedora';
    var pin = $('eqPin').value.trim(), pin2 = $('eqPin2').value.trim();
    if (!quitar && pin && pin !== pin2) { $('eqEstado').textContent = 'Los dos PIN no coinciden.'; return; }
    if (d.dataset.bootstrap && !pin) { $('eqEstado').textContent = 'Escribí el PIN (4 números).'; return; }
    if (d.dataset.bootstrap) rol = 'admin';
    var datos = { id: d.dataset.id && d.dataset.id.indexOf('L-') !== 0 ? d.dataset.id : '', loyverseId: d.dataset.loy, nombre: $('eqNombre').value.trim(), rol: rol };
    if (pin) datos.pin = pin; if (quitar) datos.quitar = 1;
    $('eqEstado').textContent = 'Guardando…';
    api('equipo_set', datos).then(function () {
      d.close(); toast(quitar ? 'Quitado' : 'Guardado', 'ok');
      if (d.dataset.bootstrap) { $('pinBootstrap').classList.add('oculto'); $('pinEstado').style.color = '#86efac'; $('pinEstado').textContent = 'Listo. Ingresá ahora con ese PIN.'; setTimeout(function () { $('pinEstado').style.color = ''; }, 6000); $('pinAyuda').textContent = 'El mismo número que usás en Loyverse'; }
      else cargarEquipo();
    }).catch(function (e) { $('eqEstado').textContent = e.message; });
  }
  function mostrarBootstrap(equipo) {
    S.equipo = equipo;
    $('pinBootstrapLista').innerHTML = equipo.map(function (e) { return '<button type="button" data-boot="' + escapar(e.id) + '">' + escapar(e.nombre) + '</button>'; }).join('');
    $('pinBootstrap').classList.remove('oculto');
    $('pinAyuda').textContent = 'Todavía no hay PIN cargados: tocá tu nombre acá abajo.';
  }
  function prepararStockViejos() {
    var viejos = S.catalogo.filter(function (a) { return !a.trackStock; }).map(function (a) { return a.variantId; });
    if (!viejos.length) { toast('Todos los artículos ya tienen control de stock', 'ok'); return; }
    var stock = Number($('stValor').value) || 999;
    if (!confirm('¿Activar control de stock en ' + viejos.length + ' artículos con stock ' + stock + '?' + String.fromCharCode(10,10) + 'Esto se hace UNA SOLA VEZ y recién el día que se apaga la carga vieja de mercadería. Si todavía no llegó ese día, cancelá.')) return;
    $('stProgreso').classList.remove('oculto'); var i = 0, TANDA = 8, ok = 0;
    function paso() {
      if (i >= viejos.length) { $('stProgTxt').textContent = 'Listo: ' + ok + ' artículos'; toast('Stock preparado', 'ok'); cargarCatalogo(true); return; }
      var tanda = viejos.slice(i, i + TANDA); i += TANDA;
      $('stProgTxt').textContent = Math.min(i, viejos.length) + '/' + viejos.length; $('stBarra').style.width = Math.round(Math.min(i, viejos.length) / viejos.length * 100) + '%';
      return api('stock_preparar', { variantIds: tanda, stock: stock }).then(function (r) { ok += r.resultados.filter(function (x) { return x.ok; }).length; }).catch(function () {}).then(paso);
    }
    paso();
  }

  // ── Bitácora (solo el dueño) ─────────────────────────────────────────────
  function abrirBitacora() {
    mostrarVista('bitacora');
    $('biLista').innerHTML = '<div class="vacio">Cargando…</div>';
    api('bitacora', { limite: 150 }, 'GET').then(function (r) { S.bita = r.filas; renderBitacora(); })
      .catch(function (e) { $('biLista').innerHTML = '<div class="vacio">' + escapar(e.message) + '</div>'; });
  }
  var ICONO_ACCION = { crear: I_.mas, actualizar: I_.precio, oferta_poner: I_.oferta, oferta_sacar: I_.oferta,
    costo_set: I_.costo, stock_ingresar: I_.stock, categoria_crear: I_.etiqueta, ticket_cambio: I_.regalo,
    cambio_registrar: I_.cambio, borrar: I_.baja, revertir: I_.deshacer };
  function renderBitacora() {
    var f = normalizar($('biFiltro').value);
    var lista = (S.bita || []).filter(function (x) { return !f || normalizar(x.empleado + ' ' + x.quePaso + ' ' + x.sku + ' ' + x.nombre).indexOf(f) >= 0; });
    if (!lista.length) { $('biLista').innerHTML = '<div class="vacio">No hay movimientos' + (f ? ' que coincidan' : ' todavía') + '.</div>'; return; }
    $('biLista').innerHTML = lista.map(function (x) {
      var d = new Date(x.fecha);
      var puede = x.reversible && !x.revertido;
      return '<div class="bita' + (x.revertido ? ' revertida' : '') + '">' +
        '<div class="cuando"><b>' + horaCorta(x.fecha) + '</b>' + dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '</div>' +
        '<div><div class="quepaso">' + (ICONO_ACCION[x.accion] || '•') + ' ' + escapar(x.quePaso) + '</div>' +
        '<div class="quien"><b>' + escapar(x.empleado || '—') + '</b>' + (x.sku ? ' · <span class="mono">' + escapar(x.sku) + '</span>' : '') + '</div></div>' +
        '<div>' + (x.revertido ? '<span class="deshecho">deshecho</span>' : (puede ? '<button class="secundario chico" data-revertir="' + escapar(x.id) + '">Deshacer</button>' : '')) + '</div></div>';
    }).join('');
  }
  function revertirBitacora(id) {
    var x = (S.bita || []).filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    if (!confirm('¿Deshacer esto?' + String.fromCharCode(10, 10) + x.quePaso + String.fromCharCode(10, 10) + 'El artículo vuelve a como estaba antes.')) return;
    cargando('Deshaciendo…');
    api('revertir', { id: id }).then(function (r) {
      if (r.items) aplicarActualizacion(r.items);
      x.revertido = new Date().toISOString();
      renderBitacora(); toast('Deshecho ✓', 'ok');
      return cargarCatalogo(true);
    }).catch(function (e) { toast(e.message, 'mal'); }).finally(function () { cargando(false); });
  }

  // ── Diseño ───────────────────────────────────────────────────────────────
  var CAMPOS_DISENO = { encabezado: 'dEncabezado', encTam: 'dEncTam', encFuente: 'dEncFuente', encTrazo: 'dEncTrazo', nomTam: 'dNomTam', nomLineas: 'dNomLineas', preTam: 'dPreTam', preFormato: 'dPreFormato', barAlto: 'dBarAlto', barMod: 'dBarMod', barTexto: 'dBarTexto', marco: 'dMarco', ofertaTexto: 'dOfertaTexto', ofertaTachado: 'dOfertaTachado', anchoMm: 'dAnchoMm', altoMm: 'dAltoMm', margenMm: 'dMargenMm', gapMm: 'dGapMm', densidad: 'dDensidad', velocidad: 'dVelocidad', direccion: 'dDireccion', invertirBits: 'dInvertirBits', ticketAncho: 'dTicketAncho' };
  function disenoAForm(d) { Object.keys(CAMPOS_DISENO).forEach(function (k) { var el = $(CAMPOS_DISENO[k]); if (el.type === 'checkbox') el.checked = !!d[k]; else el.value = d[k]; }); }
  function formADiseno() { var d = {}; Object.keys(CAMPOS_DISENO).forEach(function (k) { var el = $(CAMPOS_DISENO[k]); d[k] = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? Number(el.value) : el.value); }); return d; }
  var vistaDiseno = 'normal';
  function renderPreviewDiseno() { renderEtiqueta($('previewDiseno'), Object.assign({}, DISENO_FABRICA, formADiseno()), EJEMPLO, vistaDiseno === 'oferta'); }
  function abrirDiseno() {
    disenoAForm(S.diseno); $('dNombrePrecio').checked = S.nombreConPrecio; $('dDiasCambio').value = S.diasCambio; $('dTicketTexto').value = S.ticketTexto;
    renderPreviewDiseno(); $('dlgDiseno').showModal();
  }
  function guardarDiseno() {
    S.diseno = Object.assign({}, DISENO_FABRICA, formADiseno()); localStorage.setItem('em_diseno', JSON.stringify(S.diseno));
    S.nombreConPrecio = $('dNombrePrecio').checked; localStorage.setItem('em_nombre_precio', S.nombreConPrecio ? 'si' : 'no');
    S.diasCambio = Number($('dDiasCambio').value) || 30; S.ticketTexto = $('dTicketTexto').value.trim();
    actualizarPreview();
    api('config_set', { config: { diseno: S.diseno, nombreConPrecio: S.nombreConPrecio, diasCambio: S.diasCambio, ticketTexto: S.ticketTexto } }).catch(function () {});
  }

  // ── Historial / ajustes ──────────────────────────────────────────────────
  function abrirHistorial() {
    $('histLista').textContent = 'Cargando…'; $('dlgHistorial').showModal();
    api('historial', { limite: 40 }, 'GET').then(function (r) {
      if (!r.filas.length) { $('histLista').innerHTML = '<div class="vacio">Todavía no se imprimió ninguna etiqueta.</div>'; return; }
      $('histLista').innerHTML = r.filas.map(function (f) { var a = S.catalogo.filter(function (x) { return x.sku === f.sku; })[0]; return '<button class="res" data-vid="' + escapar(a ? a.variantId : '') + '"><div><div class="nombre">' + escapar(f.nombre) + '</div><div class="meta"><span class="mono">' + escapar(f.sku) + '</span> · ' + f.cantidad + ' etq.' + (f.empleado ? ' · ' + escapar(f.empleado) : '') + '</div></div><div class="precio">' + fmtPesos(f.precio) + '</div><div class="fecha">' + fechaCorta(f.fecha) + '</div></button>'; }).join('');
    }).catch(function (e) { $('histLista').innerHTML = '<div class="vacio">' + escapar(e.message) + '</div>'; });
  }
  /** Junta lo que ve la tablet (impresoras, permisos, cola) y lo manda al log para poder ayudar de lejos. */
  function diagnostico() {
    var lineas = [];
    lineas.push('Navegador: ' + navigator.userAgent.slice(0, 110));
    lineas.push('Pantalla: ' + window.innerWidth + 'x' + window.innerHeight + ' · internet: ' + (S.online ? 'sí' : 'NO'));
    lineas.push('WebUSB: ' + (navigator.usb ? 'sí' : 'NO') + ' · Bluetooth: ' + (navigator.bluetooth ? 'sí' : 'NO') + ' · Compartir: ' + (navigator.canShare ? 'sí' : 'NO'));
    lineas.push('Etiquetas por: ' + S.transporte + (S.impresora.conectada ? ' (conectada: ' + S.impresora.nombre + ')' : ' (sin conectar)'));
    lineas.push('Tickets por: ' + S.transporteTicket + (S.ticketera.conectada ? ' (conectada: ' + S.ticketera.nombre + ')' : ''));
    lineas.push('Catálogo: ' + S.catalogo.length + ' · cola: ' + S.cola.length + ' · códigos reservados: ' + S.skus.length);
    try { var l = JSON.parse(localStorage.getItem('em_log') || '[]').slice(-8); l.forEach(function (x) { lineas.push('· ' + x.t.slice(11, 19) + ' ' + x.tipo + ': ' + x.d); }); } catch (e) {}
    $('diagEstado').textContent = 'Revisando USB…';
    var listar = (navigator.usb && navigator.usb.getDevices) ? navigator.usb.getDevices() : Promise.resolve([]);
    listar.then(function (ds) {
      lineas.push('Aparatos USB autorizados: ' + (ds.length ? ds.map(function (d) { return (d.productName || '?') + ' [' + d.vendorId + ':' + d.productId + ']'; }).join(', ') : 'ninguno'));
    }).catch(function (e) { lineas.push('USB: ' + e.message); }).then(function () {
      var txt = lineas.join('\n');
      $('diagTexto').textContent = txt;
      $('diagEstado').textContent = 'Enviando…';
      return api('diagnostico', { detalle: txt, dispositivo: S.dispositivo }).then(function () { $('diagEstado').textContent = 'Enviado a Diego ✓'; })
        .catch(function () { $('diagEstado').textContent = 'No se pudo enviar (sin internet), pero podés sacarle una foto a esto.'; });
    });
  }
  // ── Dispositivos y avisos (solo el dueño) ────────────────────────────────
  function cargarDispositivos() {
    $('dvLista').innerHTML = '<div class="vacio">Cargando…</div>';
    api('dispositivos', {}, 'GET').then(function (r) {
      $('sSoloDispositivos').checked = !!r.soloDispositivos;
      if (!r.dispositivos.length) { $('dvLista').innerHTML = '<div class="vacio">Todavía no hay ninguna tablet vinculada. Generá un código y cargalo en la tablet.</div>'; return; }
      $('dvLista').innerHTML = r.dispositivos.map(function (d) {
        return '<div class="equipo-fila"><div><div class="nom">' + escapar(d.nombre) + (d.esEste ? ' <span class="texto">(esta tablet)</span>' : '') + (d.activo ? '' : ' <span class="texto">· dada de baja</span>') + '</div>' +
          '<div class="sub">último uso ' + (d.ultimoUso ? fechaCorta(d.ultimoUso) : '—') + '</div></div>' +
          (d.activo ? '<button class="secundario chico" data-dvbaja="' + escapar(d.id) + '">Dar de baja</button>' : '') + '</div>';
      }).join('');
    }).catch(function (e) { $('dvLista').innerHTML = '<div class="vacio">' + escapar(e.message) + '</div>'; });
  }
  function generarVinculo() {
    $('dvCodigo').textContent = 'Generando…';
    api('vinculo_crear', { nombre: $('dvNombre').value.trim() || 'Tablet' }).then(function (r) {
      $('dvCodigo').innerHTML = '<b class="mono" style="font-size:1.6em;letter-spacing:.12em">' + escapar(r.codigo) + '</b><br><span class="texto">Cargalo en la otra tablet dentro de los ' + r.minutos + ' minutos. Sirve una sola vez.</span>';
    }).catch(function (e) { $('dvCodigo').textContent = e.message; });
  }
  /** Le da clave propia a la tablet que estoy usando: genero el codigo y lo canjeo en el acto. */
  function vincularEsta() {
    if (S.dev && !confirm('Esta tablet ya está vinculada. ¿Rehacer la vinculación con una clave nueva?')) return;
    $('dvEstaEstado').textContent = 'Vinculando…';
    var nombre = S.dispositivo || 'Tablet mostrador';
    api('vinculo_crear', { nombre: nombre }).then(function (r) { return vincular(r.codigo, nombre); }).then(function (j) {
      $('dvEstaEstado').textContent = 'Listo: «' + j.nombre + '»';
      toast('Tablet vinculada. Ingresá tu PIN de nuevo.', 'ok');
      $('dlgAjustes').close();
      S.empleado = null; localStorage.removeItem('em_empleado');
      mostrarPin('Esta tablet quedó vinculada. Ingresá tu PIN.');
    }).catch(function (e) { $('dvEstaEstado').textContent = e.message; });
  }
  function bajaDispositivo(id) {
    if (!confirm('¿Dar de baja esta tablet?' + String.fromCharCode(10, 10) + 'Su clave deja de servir en el acto y se le cierran todas las sesiones. Para volver a usarla hay que vincularla de nuevo con un código.')) return;
    api('dispositivo_baja', { deviceId: id }).then(function () { toast('Dispositivo dado de baja', 'ok'); cargarDispositivos(); }).catch(function (e) { toast(e.message, 'mal'); });
  }
  function pintarAlertas() {
    var b = $('barraAlertas');
    if (!esDuenio() || !S.alertas.length) { b.classList.add('oculto'); return; }
    b.innerHTML = '<span>⚠️ ' + S.alertas.slice(0, 3).map(function (a) { return escapar(horaCorta(a.ts) + ' · ' + a.texto); }).join(' — ') + (S.alertas.length > 3 ? ' (+' + (S.alertas.length - 3) + ')' : '') + '</span><button type="button" id="alVisto" class="secundario chico">Visto</button>';
    b.classList.remove('oculto');
    $('alVisto').onclick = function () { S.alertas = []; b.classList.add('oculto'); api('alertas_leidas', {}).catch(function () {}); };
  }

  function abrirAjustes() {
    $('sApi').value = S.api; $('sKey').value = ''; $('sDispositivo').value = S.dispositivo;
    $('sVinculada').textContent = S.dev ? ('Vinculada como «' + S.dispositivo + '» · ' + S.dev) : (S.key ? 'Conectada con la clave maestra (sin vincular)' : 'Sin vincular');
    if (esDuenio()) cargarDispositivos();
    $('sBloqueo').value = String(S.bloqueoMin);
    $$('#transportes .chip-sel').forEach(function (b) { b.classList.toggle('activo', b.getAttribute('data-t') === S.transporte); });
    $$('#transportesTicket .chip-sel').forEach(function (b) { b.classList.toggle('activo', b.getAttribute('data-t') === S.transporteTicket); });
    $('transporteAyuda').textContent = AYUDA_TRANSPORTE[S.transporte]; $('transporteTicketAyuda').textContent = AYUDA_TICKET[S.transporteTicket];
    setChipImpresora(); $('dlgAjustes').showModal();
  }

  // ── Eventos ──────────────────────────────────────────────────────────────
  function aplicarTema(t) {
    document.body.classList.toggle('oscuro', t === 'oscuro');
    $('btnTema').innerHTML = t === 'oscuro' ? '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' : '<svg class="i" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
    var meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.setAttribute('content', t === 'oscuro' ? '#0d0b0a' : '#1c1917');
    localStorage.setItem('em_tema', t);
  }
  function enlazar() {
    document.addEventListener('pointerdown', tocarActividad); document.addEventListener('keydown', tocarActividad);
    $('btnTema').addEventListener('click', function () { aplicarTema(document.body.classList.contains('oscuro') ? 'claro' : 'oscuro'); });
    $$('.pin-teclado button').forEach(function (b) { b.addEventListener('click', function () { teclaPin(b.getAttribute('data-d')); }); });
    document.addEventListener('keydown', function (e) {
      if ($('pantallaPin').classList.contains('oculto') || document.querySelector('dialog[open]')) return;
      if (/^\d$/.test(e.key)) teclaPin(e.key); else if (e.key === 'Backspace') teclaPin('borrar'); else if (e.key === 'Enter') teclaPin('ok');
    });
    $('pinBootstrapLista').addEventListener('click', function (e) { var b = e.target.closest('[data-boot]'); if (b) editarIntegrante(b.getAttribute('data-boot'), true); });
    $('pinAjustes').addEventListener('click', abrirAjustes);
    enlazarStockLocal();
    $('chipUsuario').addEventListener('click', function () { if (confirm('¿Cambiar de usuario? Se vuelve a pedir el PIN.')) cerrarSesion(); });

    var inp = $('inputBuscar'), deb;
    inp.addEventListener('input', function () { clearTimeout(deb); deb = setTimeout(buscar, 60); });
    inp.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault(); clearTimeout(deb);
      var q = inp.value.trim();
      if (esNumeroDeVenta(q)) { inp.value = ''; buscar(); irA('cambio', q); return; }
      buscar._enter = /^\d{3,}$/.test(q); buscar(); buscar._enter = false;
    });
    $('btnLimpiar').addEventListener('click', function () { inp.value = ''; buscar(); inp.focus(); });
    $('resultados').addEventListener('click', function (e) {
      var ir = e.target.closest('[data-ir]'); if (ir) { irA(ir.getAttribute('data-ir')); return; }
      var cb = e.target.closest('[data-ir-cambio]'); if (cb) { var q = cb.getAttribute('data-ir-cambio'); inp.value = ''; buscar(); irA('cambio', q); return; }
      var b = e.target.closest('.res'); if (!b) return;
      var a = porVariant(b.getAttribute('data-vid')); if (a) abrirFicha(a);
    });
    $('inicio').addEventListener('click', function (e) {
      var t = e.target.closest('[data-ir]'); if (t) { irA(t.getAttribute('data-ir')); return; }
      var r = e.target.closest('#recientesLista button'); if (r) { var a = porVariant(r.getAttribute('data-vid')); if (a) abrirFicha(a); }
    });
    $('btnImprimirRecientes').addEventListener('click', function () { imprimirVarios(S.recientes.map(function (r) { return { a: porVariant(r.variantId), copias: 1 }; }).filter(function (x) { return x.a; }), 'lote'); });
    $$('[data-volver]').forEach(function (b) { b.addEventListener('click', function () { S.actual = null; mostrarVista('buscar'); actualizarPreview(); }); });
    $('avisoCostosIr').addEventListener('click', function () { $('avisoCostos').classList.add('oculto'); abrirCostos(); });
    $('avisoCostosLuego').addEventListener('click', function () { $('avisoCostos').classList.add('oculto'); sessionStorage.setItem('em_costos_luego', '1'); });

    $('nNombre').addEventListener('input', function () { avisarParecidos(); sugerirCategoria(); actualizarPreview(); });
    $('nPrecio').addEventListener('input', actualizarPreview);
    $('nAviso').addEventListener('click', function (e) { var b = e.target.closest('button[data-vid]'); if (!b) return; var a = porVariant(b.getAttribute('data-vid')); if (a) abrirFicha(a); });
    $('nCategorias').addEventListener('click', function (e) {
      var b = e.target.closest('.chip-sel'); if (!b) return;
      var id = b.getAttribute('data-id'); sugerirCategoria._manual = true;
      if (id === '__nueva') { $('nCatNueva').classList.remove('oculto'); $('nCatNombre').value = $('nNombre').value.split(' ')[0] || ''; $('nCatNombre').focus(); return; }
      elegirCategoria(id);
    });
    $('nCatCrear').addEventListener('click', crearCategoriaDesdeForm);
    $('nCatNombre').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); crearCategoriaDesdeForm(); } });
    $$('[data-step]').forEach(function (b) { b.addEventListener('click', function () { var el = $(b.getAttribute('data-step')); el.value = Math.max(0, (parseInt(el.value, 10) || 0) + Number(b.getAttribute('data-d'))); if (b.getAttribute('data-step') === 'nStock' && $('nEtiquetas').dataset.tocado !== '1') $('nEtiquetas').value = el.value; }); });
    $('nStock').addEventListener('input', function () { if ($('nEtiquetas').dataset.tocado !== '1') $('nEtiquetas').value = $('nStock').value; });
    $('nEtiquetas').addEventListener('input', function () { $('nEtiquetas').dataset.tocado = '1'; });
    $('formNuevo').addEventListener('submit', function (e) { e.preventDefault(); crear(false); });
    $('dupCancelar').addEventListener('click', function () { $('dlgDuplicado').close(); });
    $('dupCrearIgual').addEventListener('click', function () { $('dlgDuplicado').close(); crear(true); });
    $('dupLista').addEventListener('click', function (e) { var b = e.target.closest('.res'); if (!b) return; $('dlgDuplicado').close(); var a = porVariant(b.getAttribute('data-vid')); if (a) abrirFicha(a); });

    $('btnCambiarPrecio').addEventListener('click', cambiarPrecio); $('btnEditarNombre').addEventListener('click', editarNombre);
    $('btnOferta').addEventListener('click', toggleOferta); $('btnStock').addEventListener('click', ingresarStock); $('btnCosto').addEventListener('click', cargarCostoFicha);
    $('etqTipo').addEventListener('click', function () { S.etiquetaOferta = !S.etiquetaOferta; actualizarPreview(); });

    $('cantMenos').addEventListener('click', function () { var c = $('cantidad'); c.value = Math.max(1, (parseInt(c.value, 10) || 1) - 1); });
    $('cantMas').addEventListener('click', function () { var c = $('cantidad'); c.value = Math.min(200, (parseInt(c.value, 10) || 1) + 1); });
    $('btnImprimir').addEventListener('click', function () { imprimirActual('reimpresion'); });

    $('tcBuscar').addEventListener('click', function () { var n = $('tcNumero').value.trim(); if (n) tcElegirVenta(n); });
    $('tcNumero').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('tcBuscar').click(); } });
    $('tcVentas').addEventListener('click', function (e) { var b = e.target.closest('.venta'); if (b) tcElegirVenta(b.getAttribute('data-num')); });
    $('tcItems').addEventListener('click', function (e) { var it = e.target.closest('.item-check'); if (it) it.classList.toggle('marcado'); });
    $('tcAtras').addEventListener('click', function () { pasoTc(1); });
    $('tcImprimir').addEventListener('click', tcImprimir);
    $('tcReimprimir').addEventListener('click', function () { var u = S.tc.ultimo; if (!u) return; imprimirTicket(bytesTicketCambio(u.venta, u.items, u.vence)).then(function () { toast('Reimpreso', 'ok'); }).catch(function (e) { toast(e.message, 'mal'); }); });
    $('tcOtra').addEventListener('click', abrirTicketCambio);
    $('tcFin').addEventListener('click', function () { mostrarVista('buscar'); });

    $('cbBuscar').addEventListener('click', cbBuscar);
    $('cbNumero').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); cbBuscar(); } });
    $('cbDevolver').addEventListener('click', function (e) {
      var v = S.cb.venta; if (!v) return;
      var btn = e.target.closest('button[data-dev]');
      if (btn) { var i = Number(btn.getAttribute('data-dev')); var max = v.items[i].cantidad; S.cb.devolver[i] = Math.max(0, Math.min(max, (S.cb.devolver[i] || 0) + Number(btn.getAttribute('data-d')))); if (!S.cb.devolver[i]) delete S.cb.devolver[i]; renderCbDevolver(); calcularCambio(); return; }
      var it = e.target.closest('.item-check'); if (!it) return;
      var idx = Number(it.getAttribute('data-i'));
      if (S.cb.devolver[idx]) delete S.cb.devolver[idx]; else S.cb.devolver[idx] = v.items[idx].cantidad;
      renderCbDevolver(); calcularCambio();
    });
    var debCb;
    $('cbBuscarArt').addEventListener('input', function () { clearTimeout(debCb); debCb = setTimeout(cbBuscarArticulo, 60); });
    $('cbBuscarArt').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(debCb); cbBuscarArticulo._enter = true; cbBuscarArticulo(); cbBuscarArticulo._enter = false; } });
    $('cbLimpiarArt').addEventListener('click', function () { $('cbBuscarArt').value = ''; $('cbSugerencias').innerHTML = ''; $('cbBuscarArt').focus(); });
    $('cbSugerencias').addEventListener('click', function (e) { var b = e.target.closest('.res'); if (!b) return; var a = porVariant(b.getAttribute('data-vid')); if (a) { cbAgregar(a); $('cbBuscarArt').value = ''; $('cbSugerencias').innerHTML = ''; $('cbBuscarArt').focus(); } });
    $('cbEntregar').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-ent]'); if (!btn) return;
      var i = Number(btn.getAttribute('data-ent')); S.cb.entregar[i].cantidad += Number(btn.getAttribute('data-d'));
      if (S.cb.entregar[i].cantidad <= 0) S.cb.entregar.splice(i, 1);
      renderCbEntregar(); calcularCambio();
    });
    $('cbPagos').addEventListener('click', function (e) { var b = e.target.closest('.chip-sel'); if (!b) return; S.cb.pagoId = b.getAttribute('data-pago'); renderCbPagos(); });
    $('cbCancelar').addEventListener('click', function () { mostrarVista('buscar'); });
    $('cbRegistrar').addEventListener('click', cbRegistrar);
    $('cbComprobante').addEventListener('click', function () { var r = S.cb.resultado; if (!r) return; imprimirTicket(bytesComprobanteCambio(r)).then(function () { toast('Comprobante impreso', 'ok'); }).catch(function (e) { toast(e.message, 'mal'); }); });
    $('cbFin').addEventListener('click', function () { mostrarVista('buscar'); });

    $('coFiltro').addEventListener('input', function () { if (S.co) renderCostos(); });
    $('coLista').addEventListener('click', function (e) { var b = e.target.closest('.ok'); if (b) guardarCostoFila(b.closest('.costo-fila')); });
    $('coLista').addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); guardarCostoFila(e.target.closest('.costo-fila')); } });
    $('coConCosto').addEventListener('click', function (e) {
      var b = e.target.closest('[data-editar]'); if (!b) return;
      var fila = b.closest('.costo-fila'); var x = S.co.conCosto.filter(function (c) { return c.variantId === fila.getAttribute('data-vid'); })[0]; if (!x) return;
      pedirNumero('Costo de compra', x.nombre, x.costo, '$', 'Guardar costo').then(function (c) { if (c == null || !(c >= 0)) return; api('costo_set', { itemId: x.itemId, variantId: x.variantId, costo: c }).then(function (r) { aplicarActualizacion(r.items); x.costo = c; renderCostos(); toast('Costo guardado', 'ok'); }).catch(function (err) { toast(err.message, 'mal'); }); });
    });

    $('prCategorias').addEventListener('click', function (e) { var b = e.target.closest('.chip-sel'); if (b) prToggleCategoria(b.getAttribute('data-id'), b); });
    $('prBuscar').addEventListener('input', renderPrLista);
    $('prLista').addEventListener('click', function (e) { var it = e.target.closest('[data-pr]'); if (!it) return; var vid = it.getAttribute('data-pr'); if (S.pr.seleccion[vid]) delete S.pr.seleccion[vid]; else S.pr.seleccion[vid] = true; renderPrLista(); renderPrPreview(); });
    $('prModo').addEventListener('click', function (e) { var b = e.target.closest('.chip-sel'); if (!b) return; S.pr.modo = b.getAttribute('data-m'); $$('#prModo .chip-sel').forEach(function (x) { x.classList.toggle('activo', x === b); }); renderPrPreview(); });
    $('prValor').addEventListener('input', renderPrPreview); $('prRedondeo').addEventListener('change', renderPrPreview);
    $('prAplicar').addEventListener('click', prAplicar);
    $('prReimprimir').addEventListener('click', function () { imprimirVarios(S.pr.cambiados.map(function (vid) { return { a: porVariant(vid), copias: 1 }; }).filter(function (x) { return x.a; }), 'precios_lote'); });

    $('eqLista').addEventListener('click', function (e) { var b = e.target.closest('[data-eq]'); if (!b) return; var id = b.getAttribute('data-eq'); editarIntegrante(id === '__nuevo' ? '' : id, false); });
    $$('#formEquipo .chip-sel').forEach(function (b) { b.addEventListener('click', function () { $$('#formEquipo .chip-sel').forEach(function (x) { x.classList.toggle('activo', x === b); }); }); });
    $('formEquipo').addEventListener('submit', function (e) { e.preventDefault(); guardarIntegrante(false); });
    $('eqCancelar').addEventListener('click', function () { $('dlgEquipoEditar').close(); });
    $('eqQuitar').addEventListener('click', function () { if (confirm('¿Quitar a esta persona del equipo?')) guardarIntegrante(true); });
    $('stPreparar').addEventListener('click', prepararStockViejos);

    $('btnHistorial').addEventListener('click', abrirHistorial); $('histCerrar').addEventListener('click', function () { $('dlgHistorial').close(); });
    $('histLista').addEventListener('click', function (e) { var b = e.target.closest('.res'); if (!b) return; var a = porVariant(b.getAttribute('data-vid')); $('dlgHistorial').close(); if (a) abrirFicha(a); else toast('Ese artículo ya no está en el catálogo', 'mal'); });
    $('btnDiseno').addEventListener('click', abrirDiseno);
    $('formDiseno').addEventListener('input', renderPreviewDiseno);
    $('dVista').addEventListener('click', function (e) { var b = e.target.closest('.chip-sel'); if (!b) return; vistaDiseno = b.getAttribute('data-v'); $$('#dVista .chip-sel').forEach(function (x) { x.classList.toggle('activo', x === b); }); renderPreviewDiseno(); });
    $('formDiseno').addEventListener('submit', function (e) { e.preventDefault(); guardarDiseno(); $('dlgDiseno').close(); toast('Diseño guardado', 'ok'); });
    $('dCancelar').addEventListener('click', function () { $('dlgDiseno').close(); });
    $('dRestaurar').addEventListener('click', function () { disenoAForm(DISENO_FABRICA); renderPreviewDiseno(); });
    $('btnAjustes').addEventListener('click', abrirAjustes); $('chipImpresora').addEventListener('click', abrirAjustes);
    $('chipSync').addEventListener('click', abrirEstadoCatalogo);
    $('chipCola').addEventListener('click', function () {
      if (!S.cola.length) return;
      toast(S.cola.length + ' cambio(s) esperando: ' + S.cola.slice(0, 3).map(function (c) { return c._desc; }).join(', '), '');
      flushCola();
    });
    $('cxCerrar').addEventListener('click', function () { $('dlgCatalogo').close(); });
    $('cxActualizar').addEventListener('click', function () { $('dlgCatalogo').close(); cargarCatalogo(false).then(function () { toast('Catálogo al día', 'ok'); }); });
    $('avisoNuevoCerrar').addEventListener('click', function () { $('avisoNuevo').classList.add('oculto'); });
    $('avisoNuevoVer').addEventListener('click', function () {
      var a = porVariant($('avisoNuevo').dataset.vid); $('avisoNuevo').classList.add('oculto');
      if (a) abrirFicha(a);
    });
    $('sBloqueo').addEventListener('change', function () {
      S.bloqueoMin = Number($('sBloqueo').value) || 0;
      localStorage.setItem('em_bloqueo', String(S.bloqueoMin));
      toast(S.bloqueoMin ? 'Va a pedir el PIN tras ' + S.bloqueoMin + ' min sin uso' : 'No va a pedir el PIN sola', 'ok');
    });
    $('btnDiag').addEventListener('click', diagnostico);
    $('biFiltro').addEventListener('input', function () { if (S.bita) renderBitacora(); });
    $('biActualizar').addEventListener('click', abrirBitacora);
    $('biLista').addEventListener('click', function (e) { var b = e.target.closest('[data-revertir]'); if (b) revertirBitacora(b.getAttribute('data-revertir')); });
    // ── Vinculación y dispositivos ──────────────────────────────────────
    $('vinOk').addEventListener('click', enviarVinculo);
    $('vinCodigo').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); enviarVinculo(); } });
    $('dvGenerar').addEventListener('click', generarVinculo);
    $('dvVincularEsta').addEventListener('click', vincularEsta);
    $('dvLista').addEventListener('click', function (e) { var b = e.target.closest('[data-dvbaja]'); if (b) bajaDispositivo(b.getAttribute('data-dvbaja')); });
    $('sSoloDispositivos').addEventListener('change', function () {
      var v = $('sSoloDispositivos').checked;
      if (v && !S.dev && !confirm('Ojo: esta tablet todavía no está vinculada.' + String.fromCharCode(10, 10) + 'Si lo prendés ahora, va a dejar de entrar y vas a tener que vincularla con un código. ¿Seguimos?')) { $('sSoloDispositivos').checked = false; return; }
      api('config_set', { config: { soloDispositivos: v } })
        .then(function () { toast(v ? 'Solo dispositivos vinculados ✓' : 'La clave maestra vuelve a servir', 'ok'); })
        .catch(function (e) { $('sSoloDispositivos').checked = !v; toast(e.message, 'mal'); });
    });
    $('sEnUso').addEventListener('change', function () {
      var v = $('sEnUso').checked;
      if (v && !confirm('¿Poner el sistema EN USO REAL?' + String.fromCharCode(10, 10) + 'Se destraban los precios en lote, los cambios/devoluciones, la preparación de stock y las bajas. Hacelo el día que apagues la carga vieja de mercadería.')) { $('sEnUso').checked = false; return; }
      api('config_set', { config: { enUso: v } }).then(function (r) {
        S.enUso = !!(r.config && r.config.enUso);
      if (r.alertas) { S.alertas = r.alertas; pintarAlertas(); } pintarCandados();
        toast(S.enUso ? 'Sistema en uso real ✓' : 'Volvió al modo prueba', 'ok');
      }).catch(function (e) { $('sEnUso').checked = !v; toast(e.message, 'mal'); });
    });
    window.addEventListener('online', function () { marcarOnline(true); });
    window.addEventListener('offline', function () { marcarOnline(false); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && S.sesion) { flushCola(); } });
    $('ajCerrar').addEventListener('click', function () { $('dlgAjustes').close(); });
    $('transportes').addEventListener('click', function (e) { var b = e.target.closest('.chip-sel'); if (!b) return; S.transporte = b.getAttribute('data-t'); localStorage.setItem('em_transporte', S.transporte); S.impresora.conectada = false; $$('#transportes .chip-sel').forEach(function (x) { x.classList.toggle('activo', x === b); }); $('transporteAyuda').textContent = AYUDA_TRANSPORTE[S.transporte]; setChipImpresora(); });
    $('transportesTicket').addEventListener('click', function (e) { var b = e.target.closest('.chip-sel'); if (!b) return; S.transporteTicket = b.getAttribute('data-t'); localStorage.setItem('em_transporte_ticket', S.transporteTicket); S.ticketera.conectada = false; $$('#transportesTicket .chip-sel').forEach(function (x) { x.classList.toggle('activo', x === b); }); $('transporteTicketAyuda').textContent = AYUDA_TICKET[S.transporteTicket]; setChipImpresora(); });
    $('btnConectar').addEventListener('click', function () { conectarImpresora(S.impresora, S.transporte); });
    $('btnConectarTicket').addEventListener('click', function () { conectarImpresora(S.ticketera, S.transporteTicket); });
    $('btnPrueba').addEventListener('click', imprimirPrueba); $('btnPruebaTicket').addEventListener('click', imprimirPruebaTicket);
    $('btnResync').addEventListener('click', function () { $('infoCatalogo').textContent = 'Recargando todo desde Loyverse… (puede tardar un minuto)'; api('resync', {}).then(function () { return cargarCatalogo(false); }).then(function () { toast('Catálogo recargado', 'ok'); }).catch(function (e) { toast(e.message, 'mal'); }); });
    $('sGuardar').addEventListener('click', function () {
      S.api = $('sApi').value.trim() || API_DEFECTO; S.dispositivo = $('sDispositivo').value.trim() || 'Tablet mostrador';
      var claveNueva = $('sKey').value.trim();   // vacío = se deja la que ya tiene
      if (claveNueva) { S.key = claveNueva; localStorage.setItem('em_key', S.key); $('sKey').value = ''; }
      localStorage.setItem('em_api', S.api); localStorage.setItem('em_dispositivo', S.dispositivo);
      $('sEstado').textContent = 'Probando…';
      api('probar', {}, 'GET').then(function (r) { $('sEstado').textContent = 'Conectado ✓ (' + r.dispositivo + ')'; return cargarCatalogo(true); }).catch(function (e) { $('sEstado').textContent = 'No conecta: ' + e.message; });
    });

    // lector físico: cualquier tecla fuera de un campo vuelve al buscador
    document.addEventListener('keydown', function (e) {
      if (!$('pantallaPin').classList.contains('oculto') || document.querySelector('dialog[open]')) return;
      if ($('app').classList.contains('oculto')) return; // portada o stock: el lector no manda al buscador
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (S.vista === 'cambio' && !$('cbPaso2').classList.contains('oculto')) { $('cbBuscarArt').focus(); return; }
      if (S.vista === 'ficha') { S.actual = null; mostrarVista('buscar'); actualizarPreview(); $('inputBuscar').value = ''; }
      if (S.vista === 'buscar') $('inputBuscar').focus();
    });
  }

  // ── Portada y control de stock del local (15/09/2026) ────────────────────
  /**
   * La tablet arranca en una portada con dos puertas del mismo tamaño: «Control de stock» (el
   * contador general de prendas de la planilla CONTROL DE ESTOK ENIGMA) y «Carga de mercadería»
   * (todo lo de siempre, con el PIN de cada una). El stock se usa sin el PIN de ingreso: sumar
   * no pide nada y restar pide el PIN compartido de siempre, que controla el servidor
   * (StockLocal.gs). Necesita internet: el número vive en la planilla, no en la tablet.
   */
  var SL = { estado: null, carga: 0, f: null, tListo: null, tInactivo: null };
  var SL_MOTIVOS = {
    SUMAR: ['Ingreso de mercadería', 'Corrección de stock', 'Otro motivo'],
    RESTAR: ['Salió por cambio', 'Retiro del personal', 'Corrección de stock', 'Otro motivo']
  };
  var SL_I = {
    atras: '<svg class="i" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    cerrar: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    borrar: '<svg class="i" viewBox="0 0 24 24"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M13 9l5 6M18 9l-5 6"/></svg>',
    tilde: '<svg class="i" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };
  var SL_DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function fmtN(n) { return Math.round(Number(n) || 0).toLocaleString('es-AR'); }
  function slCuando(t) {
    if (!t) return '';
    var d = new Date(t), hoy = new Date(), ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
    var hora = dos(d.getHours()) + ':' + dos(d.getMinutes());
    if (d.toDateString() === hoy.toDateString()) return 'hoy ' + hora;
    if (d.toDateString() === ayer.toDateString()) return 'ayer ' + hora;
    return SL_DIAS[d.getDay()] + ' ' + dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + ' ' + hora;
  }

  function ocultarPantallas_() {
    ['pantallaInicio', 'pantallaStock', 'pantallaCambios', 'pantallaPin', 'app'].forEach(function (id) { var el = $(id); if (el) el.classList.add('oculto'); });
  }
  function mostrarPortada() {
    if (S.key && !sesionValida_()) { S.destinoLogin = 'portada'; mostrarPin(''); return; } // sin sesión no se entra
    slCerrarFlujo(true); S.destinoLogin = '';
    pintarUsuarioPortada_();
    ocultarPantallas_(); $('pantallaInicio').classList.remove('oculto');
    pintarPortada(); slCargar();
  }
  function abrirStockLocal() {
    ocultarPantallas_(); $('pantallaStock').classList.remove('oculto');
    S.ultimaActividad = Date.now();
    pintarStockLocal(); slCargar();
  }
  /**
   * Cada una entra al control de stock con SU PIN (el de Loyverse), aunque haya una sesión
   * abierta: así cada suma o resta queda con el nombre de quien la hizo. El PIN se valida al
   * instante en la tablet, así que no hay espera.
   */
  function abrirStockConPin() {
    if (!S.key) { mostrarPin(''); return; }
    if (sesionValida_()) { abrirStockLocal(); return; }
    S.destinoLogin = 'stock';
    mostrarPin('Tu PIN, el mismo de Loyverse.'); revisarBootstrap();
  }
  function pintarUsuarioPortada_() {
    var b = $('portadaUsuario'); if (!b) return;
    b.innerHTML = I_.usuario + ' ' + escapar(S.empleado ? S.empleado.nombre + (esAdmin() ? ' · Encargada' : '') : '—') + ' <span>· Cambiar de persona</span>';
  }
  /**
   * Carga de mercadería también pide el PIN cada vez que se entra desde la portada (15/09, pedido
   * de Diego: la tablet entraba sola como la última persona —«Jaque · Encargada»— y cualquiera
   * podía operar a su nombre). El PIN se valida en la tablet: es instantáneo y anda sin internet.
   */
  function abrirCarga() {
    if (!S.key) { S.destinoLogin = ''; mostrarPin(''); return; }
    if (sesionValida_()) { entrarCarga(); return; }
    S.destinoLogin = 'carga';
    mostrarPin('Tu PIN, el mismo de Loyverse.'); revisarBootstrap();
  }

  function slCargarLocal() {
    try { var e = JSON.parse(localStorage.getItem('em_stock_local') || 'null'); if (e && e.ok) { SL.estado = e; SL.carga = e._guardado || 0; } } catch (x) {}
  }
  function slAplicar(r) {
    if (!r || !r.ok) return;
    r._guardado = Date.now(); SL.estado = r; SL.carga = r._guardado;
    try { localStorage.setItem('em_stock_local', JSON.stringify(r)); } catch (x) {}
  }
  function slCargar() {
    if (!S.key) return Promise.resolve();
    return api('stock_local', {}, 'GET').then(slAplicar).catch(function (e) {
      if (e.codigo && e.codigo !== 'SIN_RED') toast(e.message, 'mal');
    }).then(function () {
      pintarPortada();
      if (!$('pantallaStock').classList.contains('oculto') && !SL.f) pintarStockLocal();
    });
  }
  function slHoyHtml(e) {
    var h = (e && e.hoy) || {}, out = '';
    if (h.entraron) out += '<span class="sl-pill mas">Hoy entraron ' + fmtN(h.entraron) + '</span>';
    if (h.salieron) out += '<span class="sl-pill menos">Hoy salieron ' + fmtN(h.salieron) + '</span>';
    if (h.vendidas) out += '<span class="sl-pill venta">Hoy se vendieron ' + fmtN(h.vendidas) + '</span>';
    return out || '<span class="sl-pill">Hoy todavía no hubo movimientos</span>';
  }
  function slFrescura() {
    if (!SL.carga) return S.online ? 'Trayendo el stock…' : 'Sin internet';
    var min = Math.floor((Date.now() - SL.carga) / 60000);
    return (S.online ? '' : 'Sin internet · ') + (min < 1 ? 'Al día' : 'Actualizado hace ' + min + ' min');
  }
  function pintarPortada() {
    var e = SL.estado;
    $('puertaStockNum').textContent = e ? fmtN(e.stock) : '—';
    $('puertaStockHoy').innerHTML = e ? slHoyHtml(e) : '';
    $('portadaEstado').textContent = slFrescura();
  }
  function pintarStockLocal() {
    var e = SL.estado;
    $('slNum').textContent = e ? fmtN(e.stock) : '—';
    $('slHoy').innerHTML = e ? slHoyHtml(e) : '';
    $('slFresco').textContent = slFrescura();
    $('slUsuario').innerHTML = I_.usuario + ' ' + escapar(S.empleado ? S.empleado.nombre : '—');
    $('slNota').classList.toggle('oculto', !(e && e.hoy && e.hoy.vendidas));
    var movs = (e && e.movimientos) || [];
    $('slMovs').innerHTML = movs.length ? movs.map(function (m) {
      // Suma: entró o devolvieron. Resta: salió, se vendió o el cierre de ventas (si fue negativo, sumó).
      var suma = m.tipo === 'SUMAR' || m.tipo === 'DEVOLUCION' || (m.tipo === 'VENTAS' && m.cant < 0);
      return '<div class="sl-mov"><span class="sl-badge ' + escapar(m.tipo) + '">' + (m.tipo === 'COBRO' ? '$' : (suma ? '+' : '−') + fmtN(Math.abs(m.cant))) + '</span>' +
        '<span class="sl-det"><span class="sl-det-t">' + (escapar(m.detalle) || '<i>Sin detalle</i>') + '</span>' +
        (m.quien ? '<small class="sl-quien">' + escapar(m.quien) + '</small>' : '') + '</span>' +
        '<span class="sl-cuando">' + slCuando(m.t) + '</span></div>';
    }).join('') : '<div class="vacio">Todavía no hay movimientos.</div>';
  }

  // El paso a paso
  function slAbrirFlujo(tipo) {
    if (!SL.estado) { toast(S.online ? 'Un segundo: estoy trayendo el stock.' : 'Sin internet: el stock se carga cuando vuelva la señal.', 'mal'); slCargar(); return; }
    SL.f = { tipo: tipo, paso: 'cant', cant: '', motivo: tipo === 'SUMAR' ? SL_MOTIVOS.SUMAR[0] : '', extra: '', pin: '', idem: null, enviando: false, msg: '', falloRed: false };
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    $('slHoja').classList.remove('oculto'); slPintar(); slTocar();
  }
  function slCerrarFlujo(silencioso) {
    SL.f = null; clearTimeout(SL.tListo); clearTimeout(SL.tInactivo);
    var h = $('slHoja'); h.classList.add('oculto'); h.innerHTML = '';
    if (!silencioso) pintarStockLocal();
  }
  // Si alguien deja el paso a paso abierto y se va, a los 2 minutos se cierra solo.
  function slTocar() {
    clearTimeout(SL.tInactivo);
    SL.tInactivo = setTimeout(function () { if (SL.f && !SL.f.enviando) slCerrarFlujo(); }, 120000);
  }
  function slPasos(t) { return t === 'SUMAR' ? ['cant', 'motivo', 'confirmar'] : ['cant', 'motivo', 'pin']; }
  function slDetalle() {
    var x = SL.f.extra.trim();
    if (SL.f.motivo === 'Otro motivo') return x;
    return x ? SL.f.motivo + ' · ' + x : SL.f.motivo;
  }
  function slDespues() { return SL.f.tipo === 'SUMAR' ? SL.estado.stock + Number(SL.f.cant) : SL.estado.stock - Number(SL.f.cant); }
  function slTeclado() {
    var t = '';
    for (var i = 1; i <= 9; i++) t += '<button type="button" class="sl-tecla" data-t="' + i + '">' + i + '</button>';
    t += '<button type="button" class="sl-tecla fn" data-t="limpiar">Borrar todo</button><button type="button" class="sl-tecla" data-t="0">0</button>' +
      '<button type="button" class="sl-tecla fn" data-t="borrar" aria-label="Borrar">' + SL_I.borrar + '</button>';
    return '<div class="sl-teclado">' + t + '</div>';
  }
  function slCabecera(titulo, conAtras) {
    var pasos = slPasos(SL.f.tipo), idx = pasos.indexOf(SL.f.paso);
    return '<div class="sl-hoja-top">' +
      '<button type="button" class="sl-circulo" data-h="' + (conAtras ? 'atras' : 'cerrar') + '" aria-label="' + (conAtras ? 'Volver' : 'Cancelar') + '">' + (conAtras ? SL_I.atras : SL_I.cerrar) + '</button>' +
      '<h1>' + titulo + '</h1>' +
      (conAtras ? '<button type="button" class="sl-circulo" data-h="cerrar" aria-label="Cancelar">' + SL_I.cerrar + '</button>' : '') + '</div>' +
      '<div class="sl-pasos">' + pasos.map(function (p, i) { return '<span class="sl-paso' + (i <= idx ? ' on' : '') + '"></span>'; }).join('') + '</div>';
  }
  function slResumen() {
    var mas = SL.f.tipo === 'SUMAR';
    return '<div class="sl-resumen ' + (mas ? 'mas' : 'menos') + '"><div class="grande">' + (mas ? '+' : '−') + fmtN(SL.f.cant) + ' prendas</div>' +
      '<div class="motivo">' + escapar(slDetalle()) + '</div>' +
      '<div class="cambio">El stock pasa de <b>' + fmtN(SL.estado.stock) + '</b> a <b>' + fmtN(slDespues()) + '</b></div></div>';
  }
  function slPintar() {
    var f = SL.f; if (!f) return;
    var h = $('slHoja'), mas = f.tipo === 'SUMAR';
    h.className = 'sl-hoja ' + (mas ? 'mas' : 'menos');
    var titulo = mas ? 'Entró mercadería' : 'Salió mercadería', html = '';
    if (f.paso === 'cant') {
      html = slCabecera(titulo, false) + '<div class="sl-contenido dos"><div>' +
        '<p class="sl-pregunta">¿Cuántas prendas ' + (mas ? 'entraron' : 'salieron') + '?</p><p class="sl-ayuda">Tocá los números.</p>' +
        '<div class="sl-display">' + (f.cant ? '<span class="n">' + fmtN(f.cant) + '</span>' : '<span class="n vacio-n">0</span>') + '<span class="u">prendas</span></div>' +
        '<div class="sl-previa">' + (f.cant ? 'El stock pasa de <b>' + fmtN(SL.estado.stock) + '</b> a <b>' + fmtN(slDespues()) + '</b>' : '') + '</div>' +
        '</div><div style="display:grid;gap:16px">' + slTeclado() +
        '<button type="button" class="sl-btn" data-h="siguiente"' + (Number(f.cant) > 0 ? '' : ' disabled') + '>Siguiente</button></div></div>';
    } else if (f.paso === 'motivo') {
      var otro = f.motivo === 'Otro motivo', listo = f.motivo && (!otro || f.extra.trim());
      html = slCabecera(titulo, true) + '<div class="sl-contenido">' +
        '<div><p class="sl-pregunta">¿Por qué ' + (mas ? 'entraron ' : 'salieron ') + fmtN(f.cant) + ' prendas?</p><p class="sl-ayuda">Elegí una opción.</p></div>' +
        '<div class="sl-chips">' + SL_MOTIVOS[f.tipo].map(function (m) {
          return '<button type="button" class="sl-chip' + (f.motivo === m ? ' on' : '') + '" data-motivo="' + escapar(m) + '"><span class="marca"></span>' + escapar(m) + '</button>';
        }).join('') + '</div>' +
        '<div><label class="sl-etiqueta" for="slExtra">' + (otro ? 'Contá qué pasó' : 'Agregar un detalle (opcional)') + '</label>' +
        '<input id="slExtra" class="sl-texto" maxlength="60" autocomplete="off" placeholder="' + (mas ? 'Ej.: proveedor, talle' : 'Ej.: quién retiró, número de ticket') + '" value="' + escapar(f.extra) + '"></div>' +
        '<button type="button" class="sl-btn" data-h="siguiente"' + (listo ? '' : ' disabled') + '>Siguiente</button></div>';
    } else if (f.paso === 'confirmar') {
      html = slCabecera(titulo, true) + '<div class="sl-contenido dos">' + slResumen() +
        '<div style="display:grid;gap:14px;align-content:start"><p class="sl-pregunta">¿Está todo bien?</p>' +
        '<button type="button" class="sl-btn mas" data-h="enviar"' + (f.enviando ? ' disabled' : '') + '>' + (f.enviando ? 'Guardando…' : 'Confirmar ingreso') + '</button>' +
        '<button type="button" class="sl-btn claro" data-h="atras">Corregir</button></div></div>';
    } else if (f.paso === 'pin') {
      var puntos = '';
      for (var i = 0; i < SL.estado.pinLargo; i++) puntos += '<span class="' + (i < f.pin.length ? 'lleno' : '') + '"></span>';
      var reintentar = f.falloRed && f.pin.length === SL.estado.pinLargo;
      html = slCabecera(titulo, true) + '<div class="sl-contenido dos">' + slResumen() +
        '<div style="display:grid;gap:14px"><p class="sl-pregunta" style="text-align:center">Confirmá con tu PIN</p>' +
        '<div id="slPuntos" class="sl-puntos">' + puntos + '</div>' +
        '<div class="sl-msg">' + (f.enviando ? '<span style="color:var(--tinta-suave)">Verificando…</span>' : escapar(f.msg)) + '</div>' +
        (reintentar ? '<button type="button" class="sl-btn menos" data-h="enviar">Reintentar</button>' : slTeclado()) + '</div></div>';
    } else if (f.paso === 'listo') {
      html = '<div class="sl-listo"><div class="sl-tilde" style="background:' + (mas ? 'var(--sl-mas)' : 'var(--sl-menos)') + '">' + SL_I.tilde + '</div>' +
        '<h2>¡Listo!</h2><p>' + (mas ? 'Entraron ' : 'Salieron ') + fmtN(f.cant) + ' prendas' + (f.repetido ? ' (ya estaba guardado)' : '') + '</p>' +
        '<p>Stock actual: <b>' + fmtN(f.stockNuevo) + '</b></p>' +
        '<div style="width:min(420px,100%);margin:18px auto 0"><button type="button" class="sl-btn" data-h="cerrar">Volver</button></div></div>';
    }
    h.innerHTML = html;
    if (f.paso === 'motivo') {
      var inp = $('slExtra');
      inp.addEventListener('input', function () {
        f.extra = inp.value; slTocar();
        var b = h.querySelector('[data-h="siguiente"]');
        if (b) b.disabled = !(f.motivo && (f.motivo !== 'Otro motivo' || f.extra.trim()));
      });
      if (f.motivo === 'Otro motivo' && !f.extra) inp.focus();
    }
  }
  function slSiguiente() {
    var pasos = slPasos(SL.f.tipo);
    SL.f.paso = pasos[pasos.indexOf(SL.f.paso) + 1];
    if (!SL.f.idem && (SL.f.paso === 'confirmar' || SL.f.paso === 'pin')) SL.f.idem = nuevoId();
    slPintar();
  }
  function slAnterior() {
    var pasos = slPasos(SL.f.tipo), i = pasos.indexOf(SL.f.paso);
    if (i <= 0) { slCerrarFlujo(); return; }
    SL.f.paso = pasos[i - 1]; SL.f.pin = ''; SL.f.msg = ''; SL.f.falloRed = false;
    SL.f.idem = null; // si cambian algo, es otra carga
    slPintar();
  }
  function slTeclear(t) {
    var f = SL.f; if (!f) return;
    if (f.paso === 'cant') {
      if (t === 'borrar') f.cant = f.cant.slice(0, -1);
      else if (t === 'limpiar') f.cant = '';
      else if (f.cant.length < 3) f.cant = (f.cant + t).replace(/^0+/, '');
      slPintar();
    } else if (f.paso === 'pin' && !f.enviando) {
      f.msg = ''; f.falloRed = false;
      if (t === 'borrar') f.pin = f.pin.slice(0, -1);
      else if (t === 'limpiar') f.pin = '';
      else if (f.pin.length < SL.estado.pinLargo) { f.pin += t; vibrar(10); }
      slPintar();
      if (f.pin.length === SL.estado.pinLargo) slEnviar();
    }
  }
  function slEnviar() {
    var f = SL.f; if (!f || f.enviando) return;
    f.enviando = true; f.falloRed = false; slPintar();
    api('stock_mover', { tipo: f.tipo, cant: Number(f.cant), detalle: slDetalle(), pin: f.pin, idem: f.idem }).then(function (r) {
      if (SL.f !== f) return;
      f.enviando = false;
      if (r.estado) slAplicar(r.estado);
      f.stockNuevo = r.stock; f.repetido = !!r.repetido; f.paso = 'listo'; slPintar();
      vibrar(30);
      clearTimeout(SL.tListo); SL.tListo = setTimeout(function () { if (SL.f === f) slCerrarFlujo(); }, 4000);
    }).catch(function (e) {
      if (SL.f !== f) return;
      f.enviando = false;
      var d = e.datos || {};
      if (e.codigo === 'PIN_STOCK_INCORRECTO' || e.codigo === 'DEMASIADOS_INTENTOS') {
        f.pin = '';
        f.msg = e.codigo === 'DEMASIADOS_INTENTOS'
          ? 'Demasiados intentos. Esperá ' + (d.esperar < 90 ? d.esperar + ' segundos' : Math.ceil(d.esperar / 60) + ' minutos') + '.'
          : 'PIN incorrecto.' + (d.quedan ? ' Quedan ' + d.quedan + ' intentos.' : '');
        slPintar();
        var p = $('slPuntos'); if (p) { p.classList.remove('error'); void p.offsetWidth; p.classList.add('error'); }
        vibrar([40, 40, 40]); return;
      }
      if (e.codigo === 'SIN_SESION') { // venció la sesión: se pide el PIN y se vuelve al stock
        SL.f = null; S.destinoLogin = 'stock'; mostrarPin('Tu sesión venció: poné tu PIN de nuevo.'); return;
      }
      if (e.codigo === 'SIN_RED') {
        f.falloRed = true;
        f.msg = f.paso === 'pin' ? 'Sin conexión. Tocá Reintentar: no se carga dos veces.' : '';
        if (f.paso !== 'pin') toast('Sin conexión. Tocá de nuevo Confirmar: no se carga dos veces.', 'mal');
        slPintar(); return;
      }
      toast(e.message, 'mal'); slPintar();
    });
  }

  function enlazarStockLocal() {
    $('puertaStock').addEventListener('click', abrirStockConPin);
    $('slUsuario').addEventListener('click', function () { S.destinoLogin = 'stock'; mostrarPin('¿Quién sigue? Su PIN, el de Loyverse.'); });
    $('puertaCarga').addEventListener('click', abrirCarga);
    enlazarCambios();
    $('slVolver').addEventListener('click', mostrarPortada);
    $('btnInicio').addEventListener('click', mostrarPortada);
    $('pinInicio').addEventListener('click', mostrarPortada);
    $('slEntro').addEventListener('click', function () { slAbrirFlujo('SUMAR'); });
    $('slSalio').addEventListener('click', function () { slAbrirFlujo('RESTAR'); });
    $('slHoja').addEventListener('click', function (e) {
      slTocar(); S.ultimaActividad = Date.now();
      var t = e.target.closest('[data-t]'), h = e.target.closest('[data-h]'), m = e.target.closest('[data-motivo]');
      if (t) { slTeclear(t.getAttribute('data-t')); return; }
      if (m) { SL.f.motivo = m.getAttribute('data-motivo'); slPintar(); return; }
      if (!h || h.disabled) return;
      var a = h.getAttribute('data-h');
      if (a === 'cerrar') slCerrarFlujo(); else if (a === 'atras') slAnterior(); else if (a === 'siguiente') slSiguiente(); else if (a === 'enviar') slEnviar();
    });
    document.addEventListener('keydown', function (e) {
      if ($('pantallaStock').classList.contains('oculto') || !SL.f || e.target.tagName === 'INPUT') return;
      if (/^\d$/.test(e.key)) slTeclear(e.key);
      else if (e.key === 'Backspace') slTeclear('borrar');
      else if (e.key === 'Escape') slCerrarFlujo();
      else if (e.key === 'Enter') { e.preventDefault(); var b = $('slHoja').querySelector('[data-h="siguiente"],[data-h="enviar"]'); if (b && !b.disabled) b.click(); }
    });
    // El número se mantiene al día solo mientras se ve la portada o el stock.
    setInterval(function () {
      var enPortada = !$('pantallaInicio').classList.contains('oculto'), enStock = !$('pantallaStock').classList.contains('oculto');
      if (!enPortada && !enStock) return;
      if (enPortada) $('portadaEstado').textContent = slFrescura(); else $('slFresco').textContent = slFrescura();
      if (document.visibilityState === 'visible' && !SL.f && Date.now() - SL.carga > 55000) slCargar();
      // Si dejan la pantalla de stock abierta y se van, a los 3 minutos vuelve a la portada.
      if (enStock && !SL.f && Date.now() - S.ultimaActividad > 180000) mostrarPortada();
    }, 15000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && (!$('pantallaInicio').classList.contains('oculto') || !$('pantallaStock').classList.contains('oculto')) && !SL.f) slCargar();
    });
    // Al volver a la app (estaba cerrada o minimizada) se mira enseguida si pasó la hora sin uso.
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && venceInactividad_(Date.now())) bloquearPorInactividad_();
    });
    $('portadaUsuario').addEventListener('click', function () { S.destinoLogin = 'portada'; mostrarPin('¿Quién sigue? Su PIN, el de Loyverse.'); });
  }

  // ── Cambios (15/09/2026) ─────────────────────────────────────────────────
  /**
   * Tercer botón de la portada. Devuelve una o varias prendas (lector o nombre, al precio de hoy),
   * se lleva otras, y la diferencia:
   *  - si la paga el cliente, el servidor registra SOLO en Loyverse la venta del artículo «Cambio
   *    (diferencia)» con el medio que eligió (16/09: las chicas no la cargan). Si fue en efectivo, se
   *    avisa que el turno de Loyverse no la cuenta y al cerrar la caja sobra eso;
   *  - si queda a favor del cliente, sale un VALE con código, que se canjea escaneándolo acá;
   *  - si es pareja, no se cobra nada.
   * El stock de las prendas lo mueve el servidor (Cambios.gs), en Loyverse y en la planilla.
   * El lector de códigos funciona sin tocar el buscador: así no se abre el teclado.
   */
  var CM = { paso: 1, devuelve: [], lleva: [], vales: [], pagoId: '', resultado: null, enviando: false, idem: null, buf: '', bufT: 0, deb: null };
  var CM_PASOS = ['Devuelve', 'Se lleva', 'La cuenta'];
  function cmNuevo() { CM.paso = 1; CM.devuelve = []; CM.lleva = []; CM.vales = []; CM.pagoId = ''; CM.resultado = null; CM.enviando = false; CM.idem = null; }
  function fechaDia_(iso) { var d = new Date(iso); return isNaN(d.getTime()) ? '' : dos(d.getDate()) + '/' + dos(d.getMonth() + 1) + '/' + d.getFullYear(); }

  function abrirCambios() {
    if (!S.key) { mostrarPin(''); return; }
    if (!sesionValida_()) { S.destinoLogin = 'cambios'; mostrarPin('Tu PIN, el mismo de Loyverse.'); revisarBootstrap(); return; }
    ocultarPantallas_(); $('pantallaCambios').classList.remove('oculto');
    if (CM.paso === 4) cmNuevo();
    cmPintar();
    var vieja = !S.ultimaSync || Date.now() - new Date(S.ultimaSync).getTime() > 600000;
    if (!S.catalogo.length || vieja) cargarCatalogo(true).then(function () { if (!$('pantallaCambios').classList.contains('oculto')) cmPintar(); });
    if (!S.pagos.length) api('pagos', {}, 'GET').then(function (r) { S.pagos = r.pagos || []; cmPintar(); }).catch(function () {});
  }
  function cmTotales() {
    var dev = CM.devuelve.reduce(function (s, x) { return s + x.a.precio * x.cantidad; }, 0) + CM.vales.reduce(function (s, v) { return s + v.monto; }, 0);
    var lle = CM.lleva.reduce(function (s, x) { return s + x.a.precio * x.cantidad; }, 0);
    return { dev: dev, lle: lle, dif: lle - dev };
  }
  function cmLista() { return CM.paso === 1 ? CM.devuelve : CM.lleva; }
  function cmAgregar(a) {
    if (CM.paso !== 1 && CM.paso !== 2) return;
    var l = cmLista(), ex = l.filter(function (x) { return x.a.variantId === a.variantId; })[0];
    if (ex) ex.cantidad++; else l.push({ a: a, cantidad: 1 });
    CM.idem = null; vibrar(15); cmPintar();
  }
  function cmVale(cod) {
    cod = String(cod).trim().toUpperCase();
    if (CM.paso !== 1) { toast('Los vales se escanean en «Qué devuelve».', 'mal'); return; }
    if (CM.vales.some(function (v) { return v.codigo === cod; })) { toast('Ese vale ya está cargado.', 'mal'); return; }
    cargando('Buscando el vale…');
    api('vale_consultar', { codigo: cod }, 'GET').then(function (r) {
      CM.vales.push(r.vale); CM.idem = null; cmPintar(); toast('Vale de ' + fmtPesos(r.vale.monto) + ' agregado', 'ok');
    }).catch(function (e) { toast(e.message, 'mal'); }).then(function () { cargando(false); });
  }
  /** Lo que llega del lector (o Enter en el buscador): un código de artículo o un vale. */
  function cmCodigo(cod) {
    cod = String(cod || '').trim(); if (!cod) return;
    if (/^VALE-/i.test(cod)) { cmVale(cod); return; }
    var a = S.catalogo.filter(function (x) { return x.sku === cod || x.barcode === cod; })[0];
    if (!a) { toast('No encontré el código ' + cod + ' en el catálogo.', 'mal'); return; }
    cmAgregar(a);
  }
  function cmBuscarPintar(enter) {
    var inp = $('cmBuscar'), cont = $('cmSug'); if (!inp) return;
    var q = inp.value.trim(); if (!q) { cont.innerHTML = ''; return; }
    if (/^VALE-/i.test(q)) { if (enter) { inp.value = ''; cont.innerHTML = ''; cmCodigo(q); } return; }
    var qn = normalizar(q), tokens = qn.split(' ').filter(Boolean), esCodigo = /^\d{3,}$/.test(q);
    var res = S.catalogo.filter(function (a) { return esCodigo ? (a.sku === q || a.barcode === q) : tokens.every(function (t) { return a._n.indexOf(t) >= 0 || a.sku.indexOf(t) === 0; }); }).slice(0, 6);
    if (enter && res.length === 1) { inp.value = ''; cont.innerHTML = ''; cmAgregar(res[0]); return; }
    cont.innerHTML = res.length ? res.map(function (a) { return filaArticulo(a, false, 'data-cm-add="1"'); }).join('') : '<div class="vacio">No encontré «' + escapar(q) + '».</div>';
  }
  function cmFilas(lista) {
    return lista.map(function (x, i) {
      return '<div class="item-check marcado"><div class="cb">✓</div><div><div class="nom">' + escapar(sinSufijoPrecio(x.a.nombre)) + '</div>' +
        '<div class="sub"><span class="mono">' + escapar(x.a.sku) + '</span> · ' + fmtPesos(x.a.precio) + (x.cantidad > 1 ? ' c/u' : '') + '</div></div>' +
        '<div class="der"><div class="cant"><button type="button" data-cm-q="' + i + '" data-d="-1">−</button><span>' + x.cantidad + '</span>' +
        '<button type="button" data-cm-q="' + i + '" data-d="1">+</button></div><b>' + fmtPesos(x.a.precio * x.cantidad) + '</b></div></div>';
    }).join('');
  }
  function cmPintar() {
    var c = $('cmCuerpo'); if (!c) return;
    $('cmUsuario').innerHTML = I_.usuario + ' ' + escapar(S.empleado ? S.empleado.nombre : '—');
    var t = cmTotales(), html = '';
    if (CM.paso < 4) html += '<div class="pasos cm-pasos">' + CM_PASOS.map(function (n, i) { return '<span class="paso' + (i + 1 === CM.paso ? ' activo' : (i + 1 < CM.paso ? ' hecho' : '')) + '">' + (i + 1) + ' ' + n + '</span>'; }).join('') + '</div>';
    if (CM.paso === 1 || CM.paso === 2) {
      var dev = CM.paso === 1, lista = cmLista(), vacia = !lista.length && !(dev && CM.vales.length);
      html += '<div class="tarjeta cm-tarjeta"><h2>' + (dev ? '¿Qué devuelve?' : '¿Qué se lleva?') + '</h2>' +
        '<p class="texto">' + (dev ? 'Escaneá la etiqueta de cada prenda con el lector, o buscala por nombre. Si trae un vale, escanealo acá.' : 'Escaneá lo que se lleva, o buscalo por nombre. Si no se lleva nada, seguí.') + '</p>' +
        '<div class="fila-busca"><input id="cmBuscar" type="text" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Buscar por nombre o código…"><button type="button" class="secundario" data-cm="limpiar">✕</button></div>' +
        '<div id="cmSug" class="sugerencias"></div>' +
        '<div class="items-check">' + cmFilas(lista) + (dev ? CM.vales.map(function (v, i) {
          return '<div class="item-check marcado"><div class="cb">✓</div><div><div class="nom">Vale ' + escapar(v.codigo) + '</div><div class="sub">saldo a favor</div></div>' +
            '<div class="der"><button type="button" class="secundario chico" data-cm-vale-x="' + i + '">Quitar</button><b>' + fmtPesos(v.monto) + '</b></div></div>';
        }).join('') : '') + '</div>' +
        (vacia ? '<div class="vacio">' + (dev ? 'Todavía no escaneaste nada.' : 'No se lleva nada todavía.') + '</div>' : '') +
        '<div class="cm-total">' + (dev ? 'Devuelve' : 'Se lleva') + ': <b>' + fmtPesos(dev ? t.dev : t.lle) + '</b></div>' +
        '<div class="dlg-botones">' + (dev ? '' : '<button type="button" class="secundario" data-cm="atras">‹ Qué devuelve</button>') +
        '<button type="button" class="primario" data-cm="siguiente"' + (dev && vacia ? ' disabled' : '') + '>' + (dev ? 'Siguiente: qué se lleva' : 'Siguiente: la cuenta') + '</button></div></div>';
    } else if (CM.paso === 3) {
      var etq = t.dif > 0 ? 'El cliente paga' : t.dif < 0 ? 'Saldo a favor' : 'Sin diferencia';
      html += '<div class="tarjeta cm-tarjeta"><h2>La cuenta</h2>' +
        '<div class="resumen-cambio"><div><span class="etq">Devuelve</span><b>' + fmtPesos(t.dev) + '</b></div><div><span class="etq">Se lleva</span><b>' + fmtPesos(t.lle) + '</b></div>' +
        '<div class="dif"><span class="etq">' + etq + '</span><b>' + fmtPesos(Math.abs(t.dif)) + '</b></div></div>';
      if (t.dif > 0) {
        html += '<div class="etq">¿Cómo paga la diferencia?</div><div class="chips cm-pagos">' + S.pagos.map(function (p) {
          return '<button type="button" class="chip-sel' + (p.id === CM.pagoId ? ' activo' : '') + '" data-cm-pago="' + escapar(p.id) + '">' + escapar(p.nombre) + '</button>';
        }).join('') + '</div>' + (S.pagos.length ? '<p class="texto">Se registra solo en Loyverse: no hace falta cargarlo ahí.</p>' : '<p class="texto">Cargando los medios de pago…</p>');
      } else if (t.dif < 0) {
        html += '<div class="aviso">Se le da un <b>vale por ' + fmtPesos(-t.dif) + '</b> para usar en otro cambio. No se devuelve plata.</div>';
      } else {
        html += '<div class="aviso">Cambio parejo: no se cobra nada.</div>';
      }
      html += '<div class="dlg-botones"><button type="button" class="secundario" data-cm="atras">‹ Qué se lleva</button>' +
        '<button type="button" class="primario" data-cm="registrar"' + ((t.dif > 0 && !CM.pagoId) || CM.enviando ? ' disabled' : '') + '>' + (CM.enviando ? 'Registrando…' : 'Registrar cambio') + '</button></div></div>';
    } else {
      var r = CM.resultado || {};
      html += '<div class="tarjeta cm-tarjeta cm-listo"><div class="ok-grande">✓</div><h2>Cambio registrado</h2><p class="texto centrado">El stock ya se acomodó en Loyverse y en la planilla.</p>';
      if (r.cobrado) {
        html += '<div class="cm-cobrar"><div class="etq">Cobrado</div><div class="cm-cobrar-monto">' + fmtPesos(r.cobrado.monto) + '</div>' +
          '<div class="cm-cobrar-medio">con <b>' + escapar(r.cobrado.medio) + '</b></div>' +
          '<p class="texto">Ya quedó registrado en Loyverse' + (r.cobrado.venta ? ' (venta ' + escapar(r.cobrado.venta) + ')' : '') + '. No lo cargues de nuevo.</p>' +
          (r.cobrado.efectivo ? '<div class="aviso">Guardá ' + fmtPesos(r.cobrado.monto) + ' en la caja. Hoy entraron ' + fmtPesos(r.efectivoHoy || r.cobrado.monto) +
            ' en efectivo por cambios: el turno de Loyverse no los cuenta, así que al cerrar la caja va a sobrar eso. A Diego le llega el aviso de cada cobro en efectivo.</div>' : '') + '</div>';
      }
      if (r.vale) {
        html += '<div class="cm-vale"><div class="etq">Vale por saldo a favor</div><div class="cm-cobrar-monto">' + fmtPesos(r.vale.monto) + '</div>' +
          '<div class="mono cm-vale-codigo">' + escapar(r.vale.codigo) + '</div><div class="texto">Vale hasta el ' + fechaDia_(r.vale.vence) + '. Si no imprime, anotá el código en un papel para el cliente.</div>' +
          '<button type="button" class="secundario" data-cm="vale">Imprimir vale</button></div>';
      }
      if (!r.cobrado && !r.vale) html += '<div class="aviso">Cambio parejo: no se cobra nada.</div>';
      html += '<div class="dlg-botones centrado"><button type="button" class="secundario" data-cm="comprobante">Imprimir comprobante</button>' +
        '<button type="button" class="secundario" data-cm="nuevo">Otro cambio</button><button type="button" class="primario" data-cm="inicio">Listo</button></div></div>';
    }
    c.innerHTML = html;
  }
  function cmRegistrar() {
    var t = cmTotales();
    if (CM.enviando) return;
    if (t.dif > 0 && !CM.pagoId) { toast('Elegí cómo paga la diferencia', 'mal'); return; }
    if (!S.online) { toast('Sin internet no puedo registrar el cambio. Probá cuando vuelva la señal.', 'mal'); return; }
    CM.enviando = true; CM.idem = CM.idem || nuevoId(); cmPintar();
    api('cambio_simple', {
      devuelve: CM.devuelve.map(function (x) { return { variantId: x.a.variantId, cantidad: x.cantidad }; }),
      seLleva: CM.lleva.map(function (x) { return { variantId: x.a.variantId, cantidad: x.cantidad }; }),
      vales: CM.vales.map(function (v) { return v.codigo; }), pagoId: t.dif > 0 ? CM.pagoId : '', idem: CM.idem
    }).then(function (r) {
      CM.enviando = false; CM.resultado = r; CM.paso = 4; cmPintar(); vibrar([30, 30, 30]);
      if (r.vale) cmImprimirVale();
      slCargar();
    }).catch(function (e) {
      CM.enviando = false;
      var cod = String(e.codigo || '').split(':')[0], txt = mensajeError_(cod);
      toast(txt.indexOf('Error: ') === 0 ? e.message : txt, 'mal'); cmPintar();
    });
  }
  function bytesValeCambio(v) {
    var e = ticketNuevo_('VALE DE CAMBIO');
    e.center().ln('Saldo a favor').grande(true).negrita(true).ln(fmtTicket_(v.monto)).negrita(false).grande(false)
      .ln('Valido hasta el ' + fechaDia_(v.vence)).ln('').barcode128(v.codigo).ln(v.codigo).ln('')
      .envolver('Presentalo en el local para usarlo en tu proximo cambio.');
    return ticketCerrar_(e, new Date().toISOString(), v.codigo);
  }
  function bytesComprobanteCambioSimple(r) {
    var e = ticketNuevo_('COMPROBANTE DE CAMBIO');
    e.negrita(true).ln('Devuelve').negrita(false);
    (r.devuelve || []).forEach(function (l) { lineaArticulo_(e, l.cantidad, sinSufijoPrecio(l.nombre), l.precio); });
    (r.valesUsados || []).forEach(function (v) { e.fila('Vale ' + v.codigo, fmtTicket_(v.monto)); });
    if ((r.seLleva || []).length) {
      e.puntos().negrita(true).ln('Se lleva').negrita(false);
      r.seLleva.forEach(function (l) { lineaArticulo_(e, l.cantidad, sinSufijoPrecio(l.nombre), l.precio); });
    }
    e.puntos().negrita(true).filaGrande(r.diferencia > 0 ? 'Paga' : r.diferencia < 0 ? 'A favor' : 'Parejo', fmtTicket_(Math.abs(r.diferencia))).negrita(false);
    if (r.diferencia > 0 && r.medio) e.fila(r.medio, fmtTicket_(r.diferencia));
    if (r.vale) e.ln('Vale emitido: ' + r.vale.codigo);
    return ticketCerrar_(e, new Date().toISOString(), r.id);
  }
  function cmImprimirVale() {
    var v = CM.resultado && CM.resultado.vale; if (!v) return;
    imprimirTicket(bytesValeCambio(v)).then(function () { toast('Vale impreso', 'ok'); })
      .catch(function (e) { toast('No pude imprimir el vale: anotá el código. (' + e.message + ')', 'mal'); });
  }
  function cmImprimirComprobante() {
    if (!CM.resultado) return;
    imprimirTicket(bytesComprobanteCambioSimple(CM.resultado)).then(function () { toast('Comprobante impreso', 'ok'); })
      .catch(function (e) { toast('No pude imprimir: ' + e.message, 'mal'); });
  }
  function enlazarCambios() {
    if (!$('puertaCambios') || !$('pantallaCambios')) return; // página vieja: iniciar() ya pidió recargar
    $('puertaCambios').addEventListener('click', abrirCambios);
    $('cmVolver').addEventListener('click', function () { if (CM.paso === 4) cmNuevo(); mostrarPortada(); });
    $('cmCuerpo').addEventListener('click', function (e) {
      var add = e.target.closest('[data-cm-add]'), q = e.target.closest('[data-cm-q]'), pago = e.target.closest('[data-cm-pago]'), vx = e.target.closest('[data-cm-vale-x]'), b = e.target.closest('[data-cm]');
      if (add) { var a = porVariant(add.getAttribute('data-vid')); if (a) { $('cmBuscar').value = ''; cmAgregar(a); } return; }
      if (q) {
        var l = cmLista(), i = Number(q.getAttribute('data-cm-q'));
        l[i].cantidad += Number(q.getAttribute('data-d')); if (l[i].cantidad <= 0) l.splice(i, 1);
        CM.idem = null; cmPintar(); return;
      }
      if (pago) { CM.pagoId = pago.getAttribute('data-cm-pago'); cmPintar(); return; }
      if (vx) { CM.vales.splice(Number(vx.getAttribute('data-cm-vale-x')), 1); CM.idem = null; cmPintar(); return; }
      if (!b || b.disabled) return;
      var acc = b.getAttribute('data-cm');
      if (acc === 'limpiar') { $('cmBuscar').value = ''; $('cmSug').innerHTML = ''; }
      else if (acc === 'siguiente') { CM.paso++; cmPintar(); }
      else if (acc === 'atras') { CM.paso--; cmPintar(); }
      else if (acc === 'registrar') cmRegistrar();
      else if (acc === 'vale') cmImprimirVale();
      else if (acc === 'comprobante') cmImprimirComprobante();
      else if (acc === 'nuevo') { cmNuevo(); cmPintar(); }
      else if (acc === 'inicio') { cmNuevo(); mostrarPortada(); }
    });
    $('cmCuerpo').addEventListener('input', function (e) {
      if (e.target.id !== 'cmBuscar') return;
      clearTimeout(CM.deb); CM.deb = setTimeout(function () { cmBuscarPintar(false); }, 80);
    });
    $('cmCuerpo').addEventListener('keydown', function (e) {
      if (e.target.id === 'cmBuscar' && e.key === 'Enter') { e.preventDefault(); clearTimeout(CM.deb); cmBuscarPintar(true); }
    });
    // El lector de códigos «tipea» rápido y termina con Enter: se junta acá sin enfocar ningún campo.
    document.addEventListener('keydown', function (e) {
      if ($('pantallaCambios').classList.contains('oculto') || CM.paso > 2) return;
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Enter') { var cod = CM.buf; CM.buf = ''; if (cod.length >= 3) { e.preventDefault(); cmCodigo(cod); } return; }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      var ahora = Date.now(); if (ahora - CM.bufT > 400) CM.buf = ''; CM.bufT = ahora; CM.buf += e.key;
    });
  }

  function revisarBootstrap() {
    if (!S.key) return;
    return api('equipo_get', {}, 'GET').then(function (r) { if (r.bootstrap) mostrarBootstrap(r.equipo); else { $('pinBootstrap').classList.add('oculto'); $('pinAyuda').textContent = 'El mismo número que usás en Loyverse'; } }).catch(function () {});
  }

  // ── Arranque ─────────────────────────────────────────────────────────────
  function iniciar() {
    // La página y el código tienen que ser de la misma versión. Si la caché los mezcló, se limpia
    // y se recarga UNA vez (la clave de la tablet y las sesiones viven en localStorage: no se tocan).
    var vHtml = (document.querySelector('meta[name="app-version"]') || {}).content || '';
    if (vHtml !== VERSION_APP) {
      var ya = ''; try { ya = sessionStorage.getItem('em_recarga') || ''; } catch (e) {}
      if (ya !== VERSION_APP) { try { sessionStorage.setItem('em_recarga', VERSION_APP); } catch (e) {} recargarLimpio_(); return; }
    }
    try {
      // Nunca mas una clave en el link: solo se acepta un codigo de vinculacion de un solo uso.
      var qp = new URLSearchParams(location.search);
      var codigoUrl = qp.get('p') || '';
      if (qp.get('k') || codigoUrl) history.replaceState(null, '', location.pathname);
      if (codigoUrl && !S.key) setTimeout(function () { $('vinCodigo').value = codigoUrl; enviarVinculo(); }, 400);
    } catch (e) {}
    // Los verificadores viejos usaban un hash debil: se tiran una sola vez y se rehacen al entrar.
    if (localStorage.getItem('em_seg') !== '2') { localStorage.removeItem('em_verificadores'); localStorage.setItem('em_seg', '2'); }
    try { S.recientes = JSON.parse(localStorage.getItem('em_recientes') || '[]'); } catch (e) { S.recientes = []; }
    // 16/09: la ticketera de Enigma es de 80 mm. Una sola vez, el ancho viejo de 58 mm (32) pasa a 80 (48).
    if (localStorage.getItem('em_ticket80') !== '1') {
      if (Number(S.diseno.ticketAncho) === 32) { S.diseno.ticketAncho = 48; try { localStorage.setItem('em_diseno', JSON.stringify(S.diseno)); } catch (e) {} }
      localStorage.setItem('em_ticket80', '1');
    }
    cargarVerificadores();
    fuenteMarcaLista().then(function () { try { actualizarPreview(); } catch (e) {} });
    enlazar(); aplicarTema(localStorage.getItem('em_tema') || 'claro'); setChipImpresora(); cargarCatalogoLocal(); pintarCola(); actualizarPreview();
    // Desde el 15/09/2026 la tablet arranca en la portada: Control de stock o Carga de mercadería.
    // Una tablet sin vincular va directo a vincularse, como antes.
    // Una sola vez con la v15: el bloqueo por inactividad queda en 1 hora (pedido de Diego).
    if (localStorage.getItem('em_bloqueo_v15') !== '1') { S.bloqueoMin = 60; localStorage.setItem('em_bloqueo', '60'); localStorage.setItem('em_bloqueo_v15', '1'); }
    // Si pasó la hora sin uso (o es la primera vez con esta versión), se pide el PIN al abrir.
    if (S.sesion && S.empleado && (!S.ultimaActividad || (S.bloqueoMin && Date.now() - S.ultimaActividad > S.bloqueoMin * 60000))) S.bloqueado = true;
    if (!S.key) { mostrarPin(''); }
    else { slCargarLocal(); mostrarPortada(); revisarBootstrap(); }
    if (S.transporte === 'usb') usbConectar(S.impresora, false).catch(function () {});
    else if (S.transporte === 'ble') bleConectar(S.impresora, false).catch(function () {});
    if (S.transporteTicket === 'usb') usbConectar(S.ticketera, false).catch(function () {});
    else if (S.transporteTicket === 'ble') bleConectar(S.ticketera, false).catch(function () {});
    setInterval(function () { if (document.visibilityState === 'visible' && S.sesion) cargarCatalogo(true); }, 150000);
    setInterval(function () { if (S.cola.length && S.online && S.sesion) flushCola(); }, 60000);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () {
        var nuevo = reg.installing;
        if (!nuevo) return;
        nuevo.addEventListener('statechange', function () {
          if (nuevo.state === 'installed' && navigator.serviceWorker.controller) toast('Hay una versión nueva: cerrá y abrí la app cuando puedas', '');
        });
      });
    }).catch(function () {});
  }
  document.addEventListener('DOMContentLoaded', iniciar);
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') window.__em = { S: S, armarTspl: armarTspl, renderEtiqueta: renderEtiqueta, bytesTicketCambio: bytesTicketCambio, textoTicketCambio: textoTicketCambio, EscPos: EscPos };
})();
