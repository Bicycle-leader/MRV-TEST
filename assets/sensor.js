const Model = window.MRVModel;
const Live = window.MRVLive;

const activeNodes = document.querySelector("[data-active-nodes]");
const avgWater = document.querySelector("[data-avg-water]");
const avgMethane = document.querySelector("[data-avg-methane]");
const qualityRate = document.querySelector("[data-quality-rate]");
const signalBoard = document.querySelector("[data-signal-board]");
const sensorTable = document.querySelector("[data-sensor-table]");
const qualityStack = document.querySelector("[data-quality-stack]");
const apiSample = document.querySelector("[data-api-sample]");
const sensorLedgerBody = document.querySelector("[data-sensor-ledger-body]");
const sensorRegionSelect = document.querySelector("[data-sensor-region]");
const sensorRegionTitle = document.querySelector("[data-sensor-region-title]");
const sensorRegionLocation = document.querySelector("[data-sensor-region-location]");
const sensorRegionNodes = document.querySelector("[data-sensor-region-nodes]");
const sensorRegionSync = document.querySelector("[data-sensor-region-sync]");

let currentSnapshot;
let activeRegionId = Model.REGIONS[0]?.id || "";

function formatTime(value) {
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderApiSample(reading) {
  if (!apiSample || !reading) return;

  apiSample.textContent = JSON.stringify(
    {
      nodeId: reading.nodeId,
      waterLevelCm: reading.waterLevelCm,
      methaneFluxMgM2Hr: reading.methaneFluxMgM2Hr,
      temperatureC: reading.temperatureC,
      batteryPct: reading.batteryPct,
      rssi: reading.rssi,
      snr: reading.snr,
      measuredAt: reading.measuredAt,
    },
    null,
    2
  );
}

function renderLedger(latest) {
  if (!sensorLedgerBody) return;

  sensorLedgerBody.innerHTML = latest
    .slice()
    .sort((a, b) => new Date(b.measuredAt) - new Date(a.measuredAt))
    .slice(0, 5)
    .map(
      (reading) => `
        <div class="ledger-row" role="row">
          <span>${formatTime(reading.measuredAt)}</span>
          <span><i></i>${reading.nodeId}</span>
          <span>수위 ${reading.waterLevelCm} cm / CH4 ${reading.methaneFluxMgM2Hr}</span>
          <strong>${reading.annualReductionTco2e.toLocaleString("ko-KR")} tCO2eq/년</strong>
          <em>${reading.verification}</em>
        </div>
      `
    )
    .join("");
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value))).map(Number);
  if (!valid.length) return 0;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function getActiveRegion() {
  return Model.REGIONS.find((region) => region.id === activeRegionId) || Model.REGIONS[0];
}

function getRegionSummary(snapshot, regionId) {
  return snapshot.summary.regions.find((region) => region.regionId === regionId) || snapshot.summary.regions[0];
}

function latestForRegion(snapshot, regionId) {
  return (snapshot.latest || []).filter((reading) => reading.regionId === regionId);
}

function updateRegionPanel(region, summary) {
  if (sensorRegionTitle) sensorRegionTitle.textContent = region.title;
  if (sensorRegionLocation) sensorRegionLocation.textContent = region.location;
  if (sensorRegionNodes) sensorRegionNodes.textContent = `${summary.activeNodes} / ${summary.nodeCount}`;
  if (sensorRegionSync) {
    sensorRegionSync.textContent = summary.lastReceivedAt ? formatTime(summary.lastReceivedAt) : "대기";
  }
}

function renderSnapshot(snapshot) {
  currentSnapshot = snapshot;
  const region = getActiveRegion();
  const summary = getRegionSummary(snapshot, region.id);
  const latest = latestForRegion(snapshot, region.id);
  const avgBatteryPct = Math.round(average(latest.map((reading) => reading.batteryPct)));

  activeNodes.textContent = summary.activeNodes;
  avgWater.textContent = summary.avgWaterLevelCm.toFixed(1);
  avgMethane.textContent = summary.avgMethaneFluxMgM2Hr.toFixed(2);
  qualityRate.textContent = summary.verificationRate.toFixed(1);
  updateRegionPanel(region, summary);

  const maxReduction = Math.max(...latest.map((reading) => reading.annualReductionTco2e), 1);

  signalBoard.innerHTML = latest
    .slice()
    .sort((a, b) => b.annualReductionTco2e - a.annualReductionTco2e)
    .map((reading) => {
      const width = Math.min(100, Math.max(12, (reading.annualReductionTco2e / maxReduction) * 100));
      return `<div style="--value:${width}%"><span>${reading.nodeId}</span><b>${reading.reductionTco2eDay} t/day</b></div>`;
    })
    .join("");

  qualityStack.innerHTML = [
    ["수신 노드", `${summary.activeNodes}/${summary.nodeCount}`, (summary.activeNodes / summary.nodeCount) * 100],
    ["자동 검증률", `${summary.verificationRate.toFixed(1)}%`, summary.verificationRate],
    ["평균 배터리", `${avgBatteryPct}%`, avgBatteryPct],
  ]
    .map(
      ([label, value, percent]) => `
        <div>
          <span>${label}</span>
          <strong>${value}</strong>
          <i style="--value:${Math.min(100, Math.max(0, percent))}%"></i>
        </div>
      `
    )
    .join("");

  sensorTable.innerHTML = latest
    .slice()
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId))
    .map(
      (reading) => `
        <div class="data-row ${reading.status !== "safe" ? "attention" : ""}" role="row">
          <strong>${reading.nodeId}</strong>
          <span>${reading.location}</span>
          <span>${reading.waterLevelCm} cm</span>
          <span>${reading.methaneFluxMgM2Hr} mg/m2/h</span>
          <em>${reading.annualReductionTco2e.toLocaleString("ko-KR")} tCO2eq/년</em>
          <b class="${reading.status === "safe" ? "status-ok" : "status-watch"}">${reading.verification}</b>
        </div>
      `
    )
    .join("");

  renderApiSample(latest[0]);
  renderLedger(latest);

  document.querySelector("[data-last-sync]").textContent = summary.lastReceivedAt
    ? `마지막 수신 ${formatTime(summary.lastReceivedAt)}`
    : "수신 대기";
}

function setupRegionOptions() {
  if (!sensorRegionSelect) return;

  sensorRegionSelect.innerHTML = Model.REGIONS.map(
    (region) => `<option value="${region.id}">${region.title} - ${region.label}</option>`
  ).join("");
  sensorRegionSelect.value = activeRegionId;
}

setupRegionOptions();
sensorRegionSelect?.addEventListener("change", (event) => {
  activeRegionId = event.target.value;
  if (currentSnapshot) renderSnapshot(currentSnapshot);
});

Live.subscribe(renderSnapshot);
