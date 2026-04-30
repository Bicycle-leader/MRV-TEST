const Model = window.MRVModel;
const Live = window.MRVLive;

const activeNodes = document.querySelector("[data-active-nodes]");
const avgWater = document.querySelector("[data-avg-water]");
const avgMethane = document.querySelector("[data-avg-methane]");
const qualityRate = document.querySelector("[data-quality-rate]");
const signalBoard = document.querySelector("[data-signal-board]");
const sensorTable = document.querySelector("[data-sensor-table]");
const qualityStack = document.querySelector("[data-quality-stack]");

function formatTime(value) {
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderSnapshot(snapshot) {
  const latest = snapshot.latest || [];
  const summary = snapshot.summary;

  activeNodes.textContent = summary.activeNodes;
  avgWater.textContent = summary.avgWaterLevelCm.toFixed(1);
  avgMethane.textContent = summary.avgMethaneFluxMgM2Hr.toFixed(2);
  qualityRate.textContent = summary.verificationRate.toFixed(1);

  const topRegions = summary.regions
    .slice()
    .sort((a, b) => b.annualReductionTco2e - a.annualReductionTco2e)
    .slice(0, 5);

  signalBoard.innerHTML = topRegions
    .map((region) => {
      const width = Math.min(100, Math.max(12, region.verificationRate));
      return `<div style="--value:${width}%"><span>${region.label}</span><b>${region.dailyReductionTco2e} t/day</b></div>`;
    })
    .join("");

  qualityStack.innerHTML = [
    ["수신 노드", `${summary.activeNodes}/${summary.nodeCount}`, (summary.activeNodes / summary.nodeCount) * 100],
    ["자동 검증률", `${summary.verificationRate.toFixed(1)}%`, summary.verificationRate],
    ["평균 배터리", `${summary.avgBatteryPct}%`, summary.avgBatteryPct],
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

  document.querySelector("[data-last-sync]").textContent = summary.lastReceivedAt
    ? `마지막 수신 ${formatTime(summary.lastReceivedAt)}`
    : "수신 대기";
}

Live.subscribe(renderSnapshot);
