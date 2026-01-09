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
const costosEmpleadorEl = document.getElementById("costosEmpleador");
const modalCostos = document.getElementById("modalCostos");
const btnCostos = document.getElementById("btnCostos");
const btnCerrarModal = document.getElementById("btnCerrarModal");
const btnDescargarPlantilla = document.getElementById("btnDescargarPlantilla");
const archivoNomina = document.getElementById("archivoNomina");
const btnProcesar = document.getElementById("btnProcesar");
const btnDescargarResultados = document.getElementById("btnDescargarResultados");
const previewHead = document.getElementById("previewHead");
const previewBody = document.getElementById("previewBody");
const btnPrevio = document.getElementById("btnPrevio");
const btnSiguiente = document.getElementById("btnSiguiente");
const paginaActual = document.getElementById("paginaActual");
const erroresCarga = document.getElementById("erroresCarga");
const tablaMasiva = document.getElementById("tablaMasiva");
const dashboardTotales = document.getElementById("dashboardTotales");

let ultimoResumen = null;
let previewRows = [];
let previewErrors = [];
let processedRows = [];
let selectedRow = null;
let currentPage = 1;
const rowsPerPage = 5;

const APORTES_EMPLEADOR = {
  salud: 0.085,
  pension: 0.12,
  arl: 0.005,
};

const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const REQUIRED_HEADERS = [
  "empleado_id",
  "nombre",
  "salario_basico_mensual",
  "dias_laborados",
  "tipo_nomina",
  "aux_transporte",
  "valor_auxilio",
  "horas_extra_diurnas",
  "horas_extra_nocturnas",
  "recargo_dom_fest_horas",
  "bonificacion",
  "otras_deducciones",
];

const clamp = (valor, min, max) => Math.min(Math.max(valor, min), max);

function leerNumero(input, min = 0, max = Number.POSITIVE_INFINITY) {
  const valor = Number(input.value);
  if (Number.isNaN(valor)) return min;
  return clamp(valor, min, max);
}

function normalizarTipoNomina(valor) {
  const normalizado = String(valor || "").trim().toLowerCase();
  return normalizado === "quincenal" ? "quincenal" : "mensual";
}

function normalizarSiNo(valor) {
  const normalizado = String(valor || "").trim().toLowerCase();
  return normalizado === "si" || normalizado === "sí" ? "si" : "no";
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

  const resultado = calcularNomina({
    salarioMensual,
    diasLaborados,
    tipoNomina: normalizarTipoNomina(campos.tipo.value),
    aplicaAuxilio,
    auxilioBase,
    horasExtraDiurna,
    horasExtraNocturna,
    horasRecargo,
    bonificacion,
    otrasDeducciones,
  });

  renderResumen(resultado);
}

function calcularNomina({
  salarioMensual,
  diasLaborados,
  tipoNomina,
  aplicaAuxilio,
  auxilioBase,
  horasExtraDiurna,
  horasExtraNocturna,
  horasRecargo,
  bonificacion,
  otrasDeducciones,
}) {
  const diasBase = tipoNomina === "quincenal" ? 15 : 30;
  // Fórmula: salario proporcional = salario mensual * (días laborados / base)
  const salarioProporcional = salarioMensual * (diasLaborados / diasBase);
  // Fórmula: auxilio proporcional = auxilio * (días laborados / base)
  const auxilioTransporte = aplicaAuxilio ? auxilioBase * (diasLaborados / diasBase) : 0;
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

  const aporteSalud = ibc * APORTES_EMPLEADOR.salud;
  const aportePension = ibc * APORTES_EMPLEADOR.pension;
  const aporteArl = ibc * APORTES_EMPLEADOR.arl;
  const totalAportes = aporteSalud + aportePension + aporteArl;
  const costoTotalEmpresa = totalDevengado + totalAportes;

  return {
    salarioProporcional,
    diasLaborados,
    auxilioTransporte,
    valorExtraDiurna,
    valorExtraNocturna,
    valorRecargo,
    bonificacion,
    totalDevengado,
    ibc,
    salud,
    pension,
    otrasDeducciones,
    totalDeducciones,
    netoPagar,
    extrasTotal,
    aporteSalud,
    aportePension,
    aporteArl,
    totalAportes,
    costoTotalEmpresa,
  };
}

function renderResumen(data) {
  devengadosEl.innerHTML = "";
  deduccionesEl.innerHTML = "";
  totalesEl.innerHTML = "";
  costosEmpleadorEl.innerHTML = "";
  ultimoResumen = data;

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
  renderCostosEmpleador(data);
}

function renderCostosEmpleador(data) {
  costosEmpleadorEl.innerHTML = "";
  const agregarFila = (contenedor, etiqueta, valor, enfatizar = false) => {
    const fila = document.createElement("div");
    fila.className = "summary-row" + (enfatizar ? " total" : "");
    fila.innerHTML = `<span>${etiqueta}</span><strong>${formatoCOP.format(valor)}</strong>`;
    contenedor.appendChild(fila);
  };

  agregarFila(costosEmpleadorEl, "IBC empleado", data.ibc);
  agregarFila(costosEmpleadorEl, "Aporte salud (8.5%)", data.aporteSalud);
  agregarFila(costosEmpleadorEl, "Aporte pensión (12%)", data.aportePension);
  agregarFila(costosEmpleadorEl, "ARL estimado (0.5%)", data.aporteArl);
  agregarFila(costosEmpleadorEl, "Total aportes empleador", data.totalAportes, true);
  agregarFila(costosEmpleadorEl, "Costo total empresa", data.costoTotalEmpresa, true);
}

function abrirModal() {
  if (!modalCostos) return;
  if (ultimoResumen) {
    renderCostosEmpleador(ultimoResumen);
  }
  modalCostos.classList.add("is-open");
  modalCostos.setAttribute("aria-hidden", "false");
}

function cerrarModal() {
  if (!modalCostos) return;
  modalCostos.classList.remove("is-open");
  modalCostos.setAttribute("aria-hidden", "true");
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

function mostrarErrores(mensajes) {
  if (!erroresCarga) return;
  if (!mensajes.length) {
    erroresCarga.textContent = "";
    erroresCarga.classList.remove("is-visible");
    return;
  }
  erroresCarga.textContent = mensajes.join(" ");
  erroresCarga.classList.add("is-visible");
}

function descargarPlantilla() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería XLSX. Revisa tu conexión a internet.");
    return;
  }
  const hoja = XLSX.utils.aoa_to_sheet([REQUIRED_HEADERS]);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Plantilla");
  XLSX.writeFile(libro, "plantilla_nomina.xlsx");
}

function validarEncabezados(encabezados) {
  const normalizados = encabezados.map((col) => String(col || "").trim());
  if (normalizados.length !== REQUIRED_HEADERS.length) {
    return `La plantilla debe tener ${REQUIRED_HEADERS.length} columnas.`;
  }
  for (let i = 0; i < REQUIRED_HEADERS.length; i += 1) {
    if (normalizados[i] !== REQUIRED_HEADERS[i]) {
      return `Encabezado inválido en columna ${i + 1}: se esperaba "${REQUIRED_HEADERS[i]}".`;
    }
  }
  return "";
}

function validarFila(fila) {
  const errores = {};
  const valores = Object.fromEntries(REQUIRED_HEADERS.map((col, i) => [col, fila[i]]));
  const vacia = REQUIRED_HEADERS.every((col) => String(valores[col] || "").trim() === "");
  if (vacia) {
    errores._fila = "Fila vacía";
    return { datos: valores, errores };
  }

  const numericos = [
    "salario_basico_mensual",
    "dias_laborados",
    "valor_auxilio",
    "horas_extra_diurnas",
    "horas_extra_nocturnas",
    "recargo_dom_fest_horas",
    "bonificacion",
    "otras_deducciones",
  ];

  numericos.forEach((campo) => {
    const valor = Number(valores[campo]);
    if (Number.isNaN(valor)) {
      errores[campo] = "Debe ser numérico";
    }
  });

  const salario = Number(valores.salario_basico_mensual);
  if (!Number.isNaN(salario) && salario <= 0) {
    errores.salario_basico_mensual = "Debe ser mayor a 0";
  }

  const auxilio = Number(valores.valor_auxilio);
  if (!Number.isNaN(auxilio) && auxilio < 0) {
    errores.valor_auxilio = "No puede ser negativo";
  }

  const bonificacion = Number(valores.bonificacion);
  if (!Number.isNaN(bonificacion) && bonificacion < 0) {
    errores.bonificacion = "No puede ser negativo";
  }

  const otras = Number(valores.otras_deducciones);
  if (!Number.isNaN(otras) && otras < 0) {
    errores.otras_deducciones = "No puede ser negativo";
  }

  const dias = Number(valores.dias_laborados);
  if (!Number.isNaN(dias) && (dias < 1 || dias > 30)) {
    errores.dias_laborados = "Días 1-30";
  }

  const horasCampos = [
    "horas_extra_diurnas",
    "horas_extra_nocturnas",
    "recargo_dom_fest_horas",
  ];
  horasCampos.forEach((campo) => {
    const valor = Number(valores[campo]);
    if (!Number.isNaN(valor) && (valor < 0 || valor > 200)) {
      errores[campo] = "Horas 0-200";
    }
  });

  const tipoNomina = String(valores.tipo_nomina || "").trim();
  if (tipoNomina !== "Mensual" && tipoNomina !== "Quincenal") {
    errores.tipo_nomina = "Mensual o Quincenal";
  }

  const auxTransporte = String(valores.aux_transporte || "").trim();
  if (auxTransporte !== "Sí" && auxTransporte !== "No" && auxTransporte !== "Si") {
    errores.aux_transporte = "Sí o No";
  }

  if (!String(valores.empleado_id || "").trim()) {
    errores.empleado_id = "Requerido";
  }
  if (!String(valores.nombre || "").trim()) {
    errores.nombre = "Requerido";
  }

  return { datos: valores, errores };
}

function importarNomina(evento) {
  const archivo = evento.target.files?.[0];
  if (!archivo) return;
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería XLSX. Revisa tu conexión a internet.");
    return;
  }

  const lector = new FileReader();
  lector.onload = (e) => {
    const data = new Uint8Array(e.target.result || []);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const filas = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (!filas.length) {
      mostrarErrores(["El archivo está vacío."]);
      return;
    }

    const encabezados = filas[0].map((columna) => String(columna || "").trim());
    const errorEncabezado = validarEncabezados(encabezados);
    if (errorEncabezado) {
      mostrarErrores([errorEncabezado]);
      return;
    }

    previewRows = [];
    previewErrors = [];
    filas.slice(1).forEach((fila, index) => {
      const resultado = validarFila(fila);
      previewRows.push({
        index: index + 2,
        raw: fila,
        data: resultado.datos,
      });
      previewErrors.push(resultado.errores);
    });

    currentPage = 1;
    mostrarErrores(obtenerResumenErrores());
    renderPreview();
    actualizarEstadoProcesar();
    renderDashboard();
  };
  lector.readAsArrayBuffer(archivo);
}

function obtenerResumenErrores() {
  const errores = [];
  const filasConError = previewErrors.filter((error) => Object.keys(error).length > 0);
  if (!previewRows.length) {
    errores.push("No hay filas para procesar.");
  }
  if (filasConError.length) {
    errores.push(`Hay ${filasConError.length} filas con errores.`);
  }
  return errores;
}

function actualizarEstadoProcesar() {
  const tieneErrores = previewErrors.some((error) => Object.keys(error).length > 0);
  if (btnProcesar) {
    btnProcesar.disabled = !previewRows.length || tieneErrores;
  }
}

function renderPreview() {
  if (!previewHead || !previewBody) return;

  previewHead.innerHTML = "";
  const headerRow = document.createElement("tr");
  REQUIRED_HEADERS.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  const thAccion = document.createElement("th");
  thAccion.textContent = "Acciones";
  headerRow.appendChild(thAccion);
  previewHead.appendChild(headerRow);

  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageRows = previewRows.slice(start, end);

  previewBody.innerHTML = "";
  pageRows.forEach((row, idx) => {
    const tr = document.createElement("tr");
    const error = previewErrors[start + idx] || {};
    REQUIRED_HEADERS.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row.data[header] ?? "";
      if (error._fila) {
        td.classList.add("is-invalid");
        td.title = error._fila;
      } else if (error[header]) {
        td.classList.add("is-invalid");
        td.title = error[header];
      }
      tr.appendChild(td);
    });

    const tdAccion = document.createElement("td");
    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "secondary";
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminarFila(start + idx));
    tdAccion.appendChild(btnEliminar);
    tr.appendChild(tdAccion);

    previewBody.appendChild(tr);
  });

  if (paginaActual) {
    const totalPages = Math.max(1, Math.ceil(previewRows.length / rowsPerPage));
    paginaActual.textContent = `Página ${currentPage} de ${totalPages}`;
    if (btnPrevio) {
      btnPrevio.disabled = currentPage <= 1;
    }
    if (btnSiguiente) {
      btnSiguiente.disabled = currentPage >= totalPages;
    }
  }
}

function eliminarFila(indice) {
  previewRows.splice(indice, 1);
  previewErrors.splice(indice, 1);
  const totalPages = Math.max(1, Math.ceil(previewRows.length / rowsPerPage));
  if (currentPage > totalPages) {
    currentPage = totalPages;
  }
  mostrarErrores(obtenerResumenErrores());
  renderPreview();
  actualizarEstadoProcesar();
  renderDashboard();
}

function procesarLiquidacion() {
  if (!previewRows.length) {
    mostrarErrores(["No hay filas para procesar."]);
    return;
  }
  if (previewErrors.some((error) => Object.keys(error).length > 0)) {
    mostrarErrores(["Corrige los errores antes de procesar."]);
    return;
  }
  processedRows = previewRows.map((row) => {
    const datos = row.data;
    const resultado = calcularNomina({
      salarioMensual: Number(datos.salario_basico_mensual),
      diasLaborados: Number(datos.dias_laborados),
      tipoNomina: normalizarTipoNomina(datos.tipo_nomina),
      aplicaAuxilio: normalizarSiNo(datos.aux_transporte) === "si",
      auxilioBase: Number(datos.valor_auxilio),
      horasExtraDiurna: Number(datos.horas_extra_diurnas),
      horasExtraNocturna: Number(datos.horas_extra_nocturnas),
      horasRecargo: Number(datos.recargo_dom_fest_horas),
      bonificacion: Number(datos.bonificacion),
      otrasDeducciones: Number(datos.otras_deducciones),
    });
    return {
      empleado_id: datos.empleado_id,
      nombre: datos.nombre,
      ...resultado,
    };
  });
  selectedRow = processedRows[0] || null;
  if (selectedRow) {
    renderResumen(selectedRow);
  }
  renderResultados();
  renderDashboard();
  mostrarErrores([]);
}

function renderResultados() {
  tablaMasiva.innerHTML = "";
  processedRows.forEach((row) => {
    const tr = document.createElement("tr");
    if (row === selectedRow) {
      tr.classList.add("is-active");
    }
    tr.innerHTML = `
      <td>${row.empleado_id}</td>
      <td>${row.nombre}</td>
      <td>${formatoCOP.format(row.salarioProporcional)}</td>
      <td>${formatoCOP.format(row.auxilioTransporte)}</td>
      <td>${formatoCOP.format(row.extrasTotal)}</td>
      <td>${formatoCOP.format(row.bonificacion)}</td>
      <td>${formatoCOP.format(row.totalDevengado)}</td>
      <td>${formatoCOP.format(row.totalDeducciones)}</td>
      <td>${formatoCOP.format(row.netoPagar)}</td>
      <td>${formatoCOP.format(row.costoTotalEmpresa)}</td>
    `;
    tr.addEventListener("click", () => {
      selectedRow = row;
      renderResumen(row);
      renderResultados();
    });
    tablaMasiva.appendChild(tr);
  });
  if (btnDescargarResultados) {
    btnDescargarResultados.disabled = !processedRows.length;
  }
}

function renderDashboard() {
  if (!dashboardTotales) return;
  const empleadosCargados = previewRows.length;
  const empleadosConError = previewErrors.filter((error) => Object.keys(error).length > 0).length;
  const empleadosProcesados = processedRows.length;
  const totales = processedRows.reduce(
    (acc, row) => {
      acc.devengado += row.totalDevengado;
      acc.deducciones += row.totalDeducciones;
      acc.neto += row.netoPagar;
      acc.costoEmpresa += row.costoTotalEmpresa;
      return acc;
    },
    { devengado: 0, deducciones: 0, neto: 0, costoEmpresa: 0 }
  );

  dashboardTotales.innerHTML = "";
  const agregarFila = (etiqueta, valor) => {
    const fila = document.createElement("div");
    fila.className = "summary-row";
    fila.innerHTML = `<span>${etiqueta}</span><strong>${valor}</strong>`;
    dashboardTotales.appendChild(fila);
  };

  agregarFila("Empleados cargados", empleadosCargados);
  agregarFila("Empleados procesados", empleadosProcesados);
  agregarFila("Empleados con error", empleadosConError);
  agregarFila("Total devengado", formatoCOP.format(totales.devengado));
  agregarFila("Total deducciones", formatoCOP.format(totales.deducciones));
  agregarFila("Total neto", formatoCOP.format(totales.neto));
  agregarFila("Costo total empleador", formatoCOP.format(totales.costoEmpresa));
}

function descargarLiquidacion() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería XLSX. Revisa tu conexión a internet.");
    return;
  }
  if (!processedRows.length) {
    alert("Primero procesa una liquidación.");
    return;
  }

  const encabezados = [
    "empleado_id",
    "nombre",
    "salario_proporcional",
    "auxilio_transporte",
    "extras_total",
    "bonificacion",
    "total_devengado",
    "total_deducciones",
    "neto_pagar",
    "costo_total_empresa",
  ];

  const filas = processedRows.map((row) => [
    row.empleado_id,
    row.nombre,
    row.salarioProporcional,
    row.auxilioTransporte,
    row.extrasTotal,
    row.bonificacion,
    row.totalDevengado,
    row.totalDeducciones,
    row.netoPagar,
    row.costoTotalEmpresa,
  ]);

  const hojaLiquidacion = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
  hojaLiquidacion["!freeze"] = { xSplit: 0, ySplit: 1 };
  aplicarFormatoCOP(hojaLiquidacion, [2, 3, 4, 5, 6, 7, 8, 9]);

  const resumenHeaders = [
    "empleados_cargados",
    "empleados_procesados",
    "empleados_con_error",
    "total_devengado",
    "total_deducciones",
    "total_neto",
    "costo_total_empleador",
  ];
  const empleadosConError = previewErrors.filter((error) => Object.keys(error).length > 0).length;
  const resumenTotales = processedRows.reduce(
    (acc, row) => {
      acc.devengado += row.totalDevengado;
      acc.deducciones += row.totalDeducciones;
      acc.neto += row.netoPagar;
      acc.costoEmpresa += row.costoTotalEmpresa;
      return acc;
    },
    { devengado: 0, deducciones: 0, neto: 0, costoEmpresa: 0 }
  );

  const resumenFila = [
    previewRows.length,
    processedRows.length,
    empleadosConError,
    resumenTotales.devengado,
    resumenTotales.deducciones,
    resumenTotales.neto,
    resumenTotales.costoEmpresa,
  ];

  const hojaResumen = XLSX.utils.aoa_to_sheet([resumenHeaders, resumenFila]);
  hojaResumen["!freeze"] = { xSplit: 0, ySplit: 1 };
  aplicarFormatoCOP(hojaResumen, [3, 4, 5, 6]);

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hojaLiquidacion, "Liquidación");
  XLSX.utils.book_append_sheet(libro, hojaResumen, "Resumen");
  XLSX.writeFile(libro, "liquidacion_masiva.xlsx");
}

function aplicarFormatoCOP(hoja, columnas) {
  const rango = XLSX.utils.decode_range(hoja["!ref"] || "A1");
  for (let row = rango.s.r + 1; row <= rango.e.r; row += 1) {
    columnas.forEach((col) => {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = hoja[cellAddress];
      if (cell && typeof cell.v === "number") {
        cell.z = "\"$\"#,##0";
      }
    });
  }
}

Object.values(campos).forEach((campo) => {
  campo.addEventListener("input", calcular);
  campo.addEventListener("change", calcular);
});

document.getElementById("btnLimpiar").addEventListener("click", limpiarFormulario);
document.getElementById("btnEjemplo").addEventListener("click", cargarEjemplo);
if (btnCostos) {
  btnCostos.addEventListener("click", abrirModal);
}
if (btnCerrarModal) {
  btnCerrarModal.addEventListener("click", cerrarModal);
}
if (modalCostos) {
  modalCostos.addEventListener("click", (event) => {
    if (event.target === modalCostos) {
      cerrarModal();
    }
  });
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    cerrarModal();
  }
});
if (btnDescargarPlantilla) {
  btnDescargarPlantilla.addEventListener("click", descargarPlantilla);
}
if (archivoNomina) {
  archivoNomina.addEventListener("change", importarNomina);
}
if (btnProcesar) {
  btnProcesar.addEventListener("click", procesarLiquidacion);
}
if (btnDescargarResultados) {
  btnDescargarResultados.addEventListener("click", descargarLiquidacion);
}
if (btnPrevio) {
  btnPrevio.addEventListener("click", () => {
    currentPage = Math.max(1, currentPage - 1);
    renderPreview();
  });
}
if (btnSiguiente) {
  btnSiguiente.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(previewRows.length / rowsPerPage));
    currentPage = Math.min(totalPages, currentPage + 1);
    renderPreview();
  });
}

if (btnProcesar) {
  btnProcesar.disabled = true;
}
if (btnDescargarResultados) {
  btnDescargarResultados.disabled = true;
}
renderDashboard();
calcular();
