import { ChangeEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowDownWideNarrow,
  BadgeDollarSign,
  Building2,
  Download,
  FileSpreadsheet,
  Filter,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { parseExogenaWorkbook } from "./lib/exogenaParser";
import { compactCurrency, formatCurrency, formatNumber } from "./lib/format";
import { groupByReporter, groupByTope, sumRecords, uniqueReporterCount } from "./lib/summarize";
import type { ExogenaRecord, ExogenaReport, SortKey } from "./types";

const toCsvValue = (value: string | number) => {
  const raw = String(value ?? "");
  return `"${raw.replace(/"/g, '""')}"`;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function App() {
  const [report, setReport] = useState<ExogenaReport | null>(null);
  const [query, setQuery] = useState("");
  const [tope, setTope] = useState("Todos");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [selectedRecord, setSelectedRecord] = useState<ExogenaRecord | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const parseFile = async (file: File) => {
    setError("");
    setIsLoading(true);
    try {
      const parsed = await parseExogenaWorkbook(file);
      setReport(parsed);
      setSelectedRecord(null);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "No fue posible leer el archivo.");
    } finally {
      setIsLoading(false);
    }
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void parseFile(file);
    event.target.value = "";
  };

  const allTopes = useMemo(() => {
    const labels = new Set<string>();
    report?.records.forEach((record) => record.topes.forEach((label) => labels.add(label)));
    return ["Todos", ...labels];
  }, [report]);

  const filteredRecords = useMemo(() => {
    if (!report) return [];
    const needle = normalize(query);
    const rows = report.records.filter((record) => {
      const haystack = normalize(
        [
          record.reporterNit,
          record.reporterName,
          record.reportedNit,
          record.reportedName,
          record.detail,
          record.declarationUse,
          record.additionalInfo,
        ].join(" "),
      );
      const matchesQuery = !needle || haystack.includes(needle);
      const matchesTope = tope === "Todos" || record.topes.includes(tope);
      return matchesQuery && matchesTope;
    });

    return [...rows].sort((left, right) => {
      if (sortKey === "value") return right.value - left.value;
      return left[sortKey].localeCompare(right[sortKey], "es");
    });
  }, [query, report, sortKey, tope]);

  const reporterGroups = useMemo(() => groupByReporter(report?.records ?? []), [report]);
  const topeGroups = useMemo(() => groupByTope(report?.records ?? []), [report]);
  const filteredTotal = useMemo(() => sumRecords(filteredRecords), [filteredRecords]);
  const grandTotal = useMemo(() => sumRecords(report?.records ?? []), [report]);

  const exportCsv = () => {
    const headers = [
      "NIT informante",
      "Nombre informante",
      "NIT reportado",
      "Nombre reportado",
      "Detalle",
      "Valor",
      "Uso declaracion sugerida",
      "Informacion adicional",
    ];
    const rows = filteredRecords.map((record) => [
      record.reporterNit,
      record.reporterName,
      record.reportedNit,
      record.reportedName,
      record.detail,
      record.value,
      record.declarationUse,
      record.additionalInfo,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "informacion-exogena-filtrada.csv";
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <span className="eyebrow">Exogenial</span>
          <h1>Informacion exogena clara y revisable</h1>
        </div>
        {report && (
          <button className="ghost-button" onClick={() => setReport(null)} type="button">
            <Trash2 size={18} />
            Limpiar
          </button>
        )}
      </section>

      {!report ? (
        <section className="upload-panel">
          <div className="upload-copy">
            <FileSpreadsheet size={44} />
            <h2>Carga tu reporte de informacion exogena</h2>
            <p>
              El archivo se procesa en este navegador. La interfaz espera el formato del reporte DIAN
              de informacion exogena descargado en Excel.
            </p>
          </div>
          <label className="upload-target">
            <Upload size={24} />
            <span>{isLoading ? "Leyendo archivo..." : "Seleccionar archivo .xlsx"}</span>
            <input accept=".xlsx,.xls" onChange={onFileChange} type="file" />
          </label>
          {error && (
            <div className="inline-alert">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}
          <div className="privacy-note">
            <ShieldCheck size={18} />
            No hay backend ni subida de datos: la lectura se hace localmente.
          </div>
        </section>
      ) : (
        <>
          <section className="summary-grid">
            <article className="identity-panel">
              <div className="panel-title">
                <UserRound size={20} />
                Consultante
              </div>
              <h2>{report.metadata.taxpayerName || "Sin nombre"}</h2>
              <dl>
                <div>
                  <dt>Documento</dt>
                  <dd>
                    {report.metadata.documentType} {report.metadata.identification}
                  </dd>
                </div>
                <div>
                  <dt>Periodo</dt>
                  <dd>{report.metadata.year || "Sin periodo"}</dd>
                </div>
                <div>
                  <dt>Fecha reporte</dt>
                  <dd>{report.metadata.reportDate || "No disponible"}</dd>
                </div>
                <div>
                  <dt>Fecha corte</dt>
                  <dd>{report.metadata.cutoffDate || "No disponible"}</dd>
                </div>
              </dl>
            </article>

            <article className="metric-card">
              <BadgeDollarSign size={22} />
              <span>Total reportado</span>
              <strong>{formatCurrency(grandTotal)}</strong>
            </article>
            <article className="metric-card">
              <Building2 size={22} />
              <span>Informantes</span>
              <strong>{formatNumber(uniqueReporterCount(report.records))}</strong>
            </article>
            <article className="metric-card">
              <FileSpreadsheet size={22} />
              <span>Registros</span>
              <strong>{formatNumber(report.records.length)}</strong>
            </article>
          </section>

          {report.metadata.warning && (
            <section className="notice">
              <AlertTriangle size={20} />
              <p>{report.metadata.warning}</p>
            </section>
          )}

          <section className="thresholds">
            {report.thresholds.map((threshold) => (
              <article className="threshold-card" key={threshold.id}>
                <span>{threshold.label}</span>
                <strong>{formatCurrency(threshold.value)}</strong>
              </article>
            ))}
          </section>

          <section className="insights-grid">
            <article>
              <div className="section-heading">Mayores informantes</div>
              <div className="rank-list">
                {reporterGroups.slice(0, 5).map((group) => (
                  <div className="rank-row" key={group.nit || group.name}>
                    <span>
                      <strong>{group.name}</strong>
                      <small>{group.nit}</small>
                    </span>
                    <b>{compactCurrency(group.value)}</b>
                  </div>
                ))}
              </div>
            </article>
            <article>
              <div className="section-heading">Distribucion por tope</div>
              <div className="rank-list">
                {topeGroups.map((group) => (
                  <div className="rank-row" key={group.label}>
                    <span>
                      <strong>{group.label}</strong>
                      <small>{group.count} registros</small>
                    </span>
                    <b>{compactCurrency(group.value)}</b>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="table-section">
            <div className="table-header">
              <div>
                <span className="eyebrow">Detalle</span>
                <h2>{formatNumber(filteredRecords.length)} registros visibles</h2>
                <p>{formatCurrency(filteredTotal)} en la vista actual</p>
              </div>
              <button className="ghost-button" onClick={exportCsv} type="button">
                <Download size={18} />
                CSV
              </button>
            </div>

            <div className="controls">
              <label className="search-box">
                <Search size={18} />
                <input
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar NIT, informante, detalle o uso"
                  value={query}
                />
              </label>
              <label className="select-box">
                <Filter size={18} />
                <select onChange={(event) => setTope(event.target.value)} value={tope}>
                  {allTopes.map((label) => (
                    <option key={label}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="select-box">
                {sortKey === "value" ? <ArrowDownWideNarrow size={18} /> : <ArrowDownAZ size={18} />}
                <select onChange={(event) => setSortKey(event.target.value as SortKey)} value={sortKey}>
                  <option value="value">Valor mayor</option>
                  <option value="reporterName">Informante A-Z</option>
                  <option value="detail">Detalle A-Z</option>
                </select>
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Informante</th>
                    <th>Detalle</th>
                    <th>Topes</th>
                    <th>Valor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.reporterName || "Sin nombre"}</strong>
                        <small>{record.reporterNit}</small>
                      </td>
                      <td>{record.detail}</td>
                      <td>
                        <div className="badges">
                          {(record.topes.length ? record.topes : ["Sin tope"]).map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                        </div>
                      </td>
                      <td className="money">{formatCurrency(record.value)}</td>
                      <td>
                        <button className="icon-button" onClick={() => setSelectedRecord(record)} type="button">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {selectedRecord && (
        <aside className="drawer">
          <div className="drawer-card">
            <button className="close-button" onClick={() => setSelectedRecord(null)} type="button">
              <X size={20} />
            </button>
            <span className="eyebrow">Registro</span>
            <h2>{selectedRecord.reporterName}</h2>
            <dl>
              <div>
                <dt>NIT informante</dt>
                <dd>{selectedRecord.reporterNit}</dd>
              </div>
              <div>
                <dt>Persona reportada</dt>
                <dd>
                  {selectedRecord.reportedName} - {selectedRecord.reportedNit}
                </dd>
              </div>
              <div>
                <dt>Valor</dt>
                <dd>{formatCurrency(selectedRecord.value)}</dd>
              </div>
              <div>
                <dt>Detalle</dt>
                <dd>{selectedRecord.detail}</dd>
              </div>
              <div>
                <dt>Uso declaracion sugerida</dt>
                <dd>{selectedRecord.declarationUse || "Sin informacion"}</dd>
              </div>
              <div>
                <dt>Informacion adicional</dt>
                <dd>{selectedRecord.additionalInfo || "Sin informacion adicional"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      )}
    </main>
  );
}
