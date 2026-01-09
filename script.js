const campos = {
  salario: document.getElementById("salario"),
  dias: document.getElementById("dias"),
  tipo: document.getElementById("tipo"),
  auxilioToggle: document.getElementById("auxilioToggle"),
  auxilioValor: document.getElementById("auxilioValor"),
  extraDiurna: document.getElementById("extraDiurna"),
  extraNocturna: document.getElementById("extraNocturna"),
  recargo: document.getElementById("recargo"),
  bonificacion: document.getElementById("bonificacion"),
  otrasDeducciones: document.getElementById("otrasDeducciones"),
};

const devengadosEl = document.getElementById("devengados");
const deduccionesEl = document.getElementById("deducciones");
const totalesEl = document.getElementById("totales");

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const clamp = (valor, min, max) => Math.min(Math.max(valor, min), max);

function leerNumero(input, min = 0, max = Number.POSITIVE_INFINITY) {
  const valor = Number(input.value);
  if (Number.isNaN(valor)) return min;
  return clamp(valor, min, max);
}

function calcular() {
  const salarioMensual = leerNumero(campos.salario, 0);
  const diasLaborados = leerNumero(campos.dias, 1, 30);
  const aplicaAuxilio = campos.auxilioToggle.value === "si";
  const auxilioBase = leerNumero(campos.auxilioValor, 0);
  const horasExtraDiurna = leerNumero(campos.extraDiurna, 0, 200);
  const horasExtraNocturna = leerNumero(campos.extraNocturna, 0, 200);
  const horasRecargo = leerNumero(campos.recargo, 0, 200);
  const bonificacion = leerNumero(campos.bonificacion, 0);
  const otrasDeducciones = leerNumero(campos.otrasDeducciones, 0);

  // Fórmula: salario proporcional = salario mensual * (días laborados / 30)
  const salarioProporcional = salarioMensual * (diasLaborados / 30);
  // Fórmula: auxilio proporcional = auxilio * (días laborados / 30)
  const auxilioTransporte = aplicaAuxilio ? auxilioBase * (diasLaborados / 30) : 0;
  // Fórmula: valor hora base = salario mensual / 240 (aprox. 30 días * 8 horas)
  const valorHora = salarioMensual / 240;

  // Fórmulas simplificadas de horas extra y recargos
  const valorExtraDiurna = valorHora * 1.25 * horasExtraDiurna;
  const valorExtraNocturna = valorHora * 1.75 * horasExtraNocturna;
  const valorRecargo = valorHora * 1.75 * horasRecargo;

  const extrasTotal = valorExtraDiurna + valorExtraNocturna + valorRecargo;

  // IBC simplificado: salario proporcional + extras + bonificación (sin auxilio)
  const ibc = salarioProporcional + extrasTotal + bonificacion;
  const salud = ibc * 0.04;
  const pension = ibc * 0.04;

  const totalDevengado = salarioProporcional + auxilioTransporte + extrasTotal + bonificacion;
  const totalDeducciones = salud + pension + otrasDeducciones;
  const netoPagar = totalDevengado - totalDeducciones;

  renderResumen({
    salarioProporcional,
    diasLaborados,
    auxilioTransporte,
    valorExtraDiurna,
    valorExtraNocturna,
    valorRecargo,
    bonificacion,
    totalDevengado,
    salud,
    pension,
    otrasDeducciones,
    totalDeducciones,
    netoPagar,
  });
}

function renderResumen(data) {
  devengadosEl.innerHTML = "";
  deduccionesEl.innerHTML = "";
  totalesEl.innerHTML = "";

  const agregarFila = (contenedor, etiqueta, valor, enfatizar = false) => {
    const fila = document.createElement("div");
    fila.className = "summary-row" + (enfatizar ? " total" : "");
    fila.innerHTML = `<span>${etiqueta}</span><strong>${formatoCOP.format(valor)}</strong>`;
    contenedor.appendChild(fila);
  };

  agregarFila(devengadosEl, `Salario (${data.diasLaborados} días)`, data.salarioProporcional);
  agregarFila(devengadosEl, "Auxilio transporte", data.auxilioTransporte);
  agregarFila(devengadosEl, "Extra diurna", data.valorExtraDiurna);
  agregarFila(devengadosEl, "Extra nocturna", data.valorExtraNocturna);
  agregarFila(devengadosEl, "Recargo dominical/festivo", data.valorRecargo);
  agregarFila(devengadosEl, "Bonificación", data.bonificacion);
  agregarFila(devengadosEl, "Total devengado", data.totalDevengado, true);

  agregarFila(deduccionesEl, "Salud (4% IBC)", data.salud);
  agregarFila(deduccionesEl, "Pensión (4% IBC)", data.pension);
  agregarFila(deduccionesEl, "Otras deducciones", data.otrasDeducciones);
  agregarFila(deduccionesEl, "Total deducciones", data.totalDeducciones, true);

  agregarFila(totalesEl, "Neto a pagar", data.netoPagar, true);
}

function limpiarFormulario() {
  campos.salario.value = "";
  campos.dias.value = "30";
  campos.auxilioToggle.value = "si";
  campos.auxilioValor.value = "";
  campos.extraDiurna.value = "0";
  campos.extraNocturna.value = "0";
  campos.recargo.value = "0";
  campos.bonificacion.value = "";
  campos.otrasDeducciones.value = "0";
  calcular();
}

function cargarEjemplo() {
  campos.salario.value = "1300000";
  campos.dias.value = "30";
  campos.auxilioToggle.value = "si";
  campos.auxilioValor.value = "162000";
  campos.extraDiurna.value = "8";
  campos.extraNocturna.value = "4";
  campos.recargo.value = "4";
  campos.bonificacion.value = "50000";
  campos.otrasDeducciones.value = "10000";
  calcular();
}

Object.values(campos).forEach((campo) => {
  campo.addEventListener("input", calcular);
  campo.addEventListener("change", calcular);
});

document.getElementById("btnLimpiar").addEventListener("click", limpiarFormulario);
document.getElementById("btnEjemplo").addEventListener("click", cargarEjemplo);

calcular();
