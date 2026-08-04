// ============================================
// CalculaTusFinanzas — lógica de calculadoras
// Estimaciones orientativas, no asesoramiento fiscal.
// ============================================

function euros(n){
  return n.toLocaleString('es-ES', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' €';
}

/* -------- IRPF: tramos estatales+autonómicos combinados (escala general orientativa) -------- */
function irpfCuota(base){
  const tramos = [
    [12450, 0.19],
    [20200, 0.24],
    [35200, 0.30],
    [60000, 0.37],
    [300000, 0.45],
    [Infinity, 0.47]
  ];
  let restante = base;
  let anterior = 0;
  let total = 0;
  for (const [limite, tipo] of tramos){
    if (restante <= 0) break;
    const tramoBase = Math.min(restante, limite - anterior);
    total += tramoBase * tipo;
    restante -= tramoBase;
    anterior = limite;
  }
  return total;
}

/* -------- Nómina: bruto anual -> neto -------- */
function calcularNomina(){
  const brutoAnual = parseFloat(document.getElementById('bruto').value);
  const pagas = parseFloat(document.getElementById('pagas').value) || 14;
  const out = document.getElementById('resultado');
  if (!brutoAnual || brutoAnual <= 0){
    out.innerHTML = '<div class="r-empty">Introduce tu salario bruto anual.</div>';
    return;
  }
  const ssRate = 0.0635; // contingencias comunes + desempleo + formación (aprox. 2026)
  const baseMaxAnual = 56646; // tope de cotización aprox. anualizado
  const baseSS = Math.min(brutoAnual, baseMaxAnual);
  const cuotaSS = baseSS * ssRate;

  const baseIRPF = brutoAnual - cuotaSS;
  const cuotaIRPF = irpfCuota(baseIRPF);

  const netoAnual = brutoAnual - cuotaSS - cuotaIRPF;
  const netoMensual = netoAnual / pagas;

  out.innerHTML = `
    <div class="r-title">Desglose anual</div>
    <div class="r-line"><span>Bruto anual</span><span>${euros(brutoAnual)}</span></div>
    <div class="r-line"><span>Seguridad Social (6,35%)</span><span>− ${euros(cuotaSS)}</span></div>
    <div class="r-line"><span>Retención IRPF (estimada)</span><span>− ${euros(cuotaIRPF)}</span></div>
    <div class="r-total"><span>Neto anual</span><span>${euros(netoAnual)}</span></div>
    <div class="r-line" style="margin-top:10px;"><span>Neto por paga (÷${pagas})</span><span>${euros(netoMensual)}</span></div>
  `;
}

/* -------- Hipoteca: cuota francesa -------- */
function calcularHipoteca(){
  const capital = parseFloat(document.getElementById('capital').value);
  const tin = parseFloat(document.getElementById('tin').value);
  const anios = parseFloat(document.getElementById('anios').value);
  const out = document.getElementById('resultado');
  if (!capital || !tin || !anios){
    out.innerHTML = '<div class="r-empty">Rellena capital, interés y plazo.</div>';
    return;
  }
  const rMensual = (tin / 100) / 12;
  const nCuotas = anios * 12;
  const cuota = capital * rMensual / (1 - Math.pow(1 + rMensual, -nCuotas));
  const totalPagado = cuota * nCuotas;
  const totalIntereses = totalPagado - capital;

  out.innerHTML = `
    <div class="r-title">Resultado de la hipoteca</div>
    <div class="r-line"><span>Capital solicitado</span><span>${euros(capital)}</span></div>
    <div class="r-line"><span>Plazo</span><span>${anios} años (${nCuotas} cuotas)</span></div>
    <div class="r-total"><span>Cuota mensual</span><span>${euros(cuota)}</span></div>
    <div class="r-line" style="margin-top:10px;"><span>Total intereses pagados</span><span>${euros(totalIntereses)}</span></div>
    <div class="r-line"><span>Total devuelto al banco</span><span>${euros(totalPagado)}</span></div>
  `;
}

/* -------- IRPF standalone page -------- */
function calcularIRPF(){
  const base = parseFloat(document.getElementById('baseImponible').value);
  const out = document.getElementById('resultado');
  if (!base || base <= 0){
    out.innerHTML = '<div class="r-empty">Introduce tu base imponible anual.</div>';
    return;
  }
  const cuota = irpfCuota(base);
  const tipoEfectivo = (cuota / base) * 100;
  const neto = base - cuota;

  out.innerHTML = `
    <div class="r-title">Estimación de IRPF</div>
    <div class="r-line"><span>Base imponible</span><span>${euros(base)}</span></div>
    <div class="r-total"><span>Cuota a pagar</span><span>${euros(cuota)}</span></div>
    <div class="r-line" style="margin-top:10px;"><span>Tipo efectivo</span><span>${tipoEfectivo.toFixed(2)} %</span></div>
    <div class="r-line"><span>Renta después de IRPF</span><span>${euros(neto)}</span></div>
  `;
}

/* -------- Ahorro / interés compuesto -------- */
function calcularAhorro(){
  const inicial = parseFloat(document.getElementById('inicial').value) || 0;
  const mensual = parseFloat(document.getElementById('mensual').value) || 0;
  const interes = parseFloat(document.getElementById('interes').value);
  const anios = parseFloat(document.getElementById('aniosAhorro').value);
  const out = document.getElementById('resultado');
  if (!interes || !anios){
    out.innerHTML = '<div class="r-empty">Introduce el interés anual y el plazo.</div>';
    return;
  }
  const rMensual = (interes / 100) / 12;
  const nMeses = anios * 12;
  let valorFuturoAportaciones;
  if (rMensual === 0){
    valorFuturoAportaciones = mensual * nMeses;
  } else {
    valorFuturoAportaciones = mensual * ((Math.pow(1 + rMensual, nMeses) - 1) / rMensual);
  }
  const valorFuturoInicial = inicial * Math.pow(1 + rMensual, nMeses);
  const total = valorFuturoInicial + valorFuturoAportaciones;
  const aportado = inicial + (mensual * nMeses);
  const intereses = total - aportado;

  out.innerHTML = `
    <div class="r-title">Proyección a ${anios} años</div>
    <div class="r-line"><span>Total aportado</span><span>${euros(aportado)}</span></div>
    <div class="r-line"><span>Intereses generados</span><span>${euros(intereses)}</span></div>
    <div class="r-total"><span>Capital final</span><span>${euros(total)}</span></div>
  `;
}
