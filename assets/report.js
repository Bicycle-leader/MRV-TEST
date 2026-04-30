const Model = window.MRVModel;
const Live = window.MRVLive;
const formatter = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const regionSelect = document.querySelector("[data-report-region]");
const monthInput = document.querySelector("[data-report-month]");
const generateButton = document.querySelector("[data-generate-report]");
const downloadButton = document.querySelector("[data-download-report]");
const printButton = document.querySelector("[data-print-report]");
const stateBadge = document.querySelector("[data-report-state]");
const reportTitle = document.querySelector("[data-report-title]");
const reportCreated = document.querySelector("[data-report-created]");
const reportCarbon = document.querySelector("[data-report-carbon]");
const reportCredit = document.querySelector("[data-report-credit]");
const reportVerify = document.querySelector("[data-report-verify]");
const reportReady = document.querySelector("[data-report-ready]");
const reportOverview = document.querySelector("[data-report-overview]");
const reportFindings = document.querySelector("[data-report-findings]");
const reportLedger = document.querySelector("[data-report-ledger]");
const progressSensor = document.querySelector("[data-progress-sensor]");
const progressSensorBar = document.querySelector("[data-progress-sensor-bar]");
const progressVerify = document.querySelector("[data-progress-verify]");
const progressVerifyBar = document.querySelector("[data-progress-verify-bar]");

let currentSnapshot;

function getMonthLabel(value) {
  const [year, month] = (value || "2026-05").split("-");
  return `${year}년 ${Number(month)}월`;
}

function regionSummary(snapshot, slug) {
  return snapshot?.summary?.regions?.find((item) => item.slug === slug) || snapshot?.summary?.regions?.[0];
}

function latestForRegion(snapshot, regionId) {
  return (snapshot?.latest || []).filter((item) => item.regionId === regionId);
}

function createReportText(summary, latest, month) {
  return [
    `${summary.title} MRV 월간 보고서`,
    `보고 월: ${getMonthLabel(month)}`,
    `대상 구역: ${summary.location}`,
    `측정 면적: ${summary.areaHa} ha`,
    `연환산 메탄 감축량: ${formatter.format(summary.annualReductionTco2e)} tCO2eq`,
    `잠정 배출권: ${summary.creditEstimate.toLocaleString("ko-KR")} KOC`,
    `자동 검증률: ${summary.verificationRate.toFixed(1)}%`,
    "",
    "측정 및 검증 결과",
    ...latest.map(
      (item) =>
        `- ${item.nodeId}: 수위 ${item.waterLevelCm} cm, CH4 ${item.methaneFluxMgM2Hr} mg/m2/h, ${item.annualReductionTco2e} tCO2eq/년, ${item.verification}`
    ),
    "",
    "제출 의견",
    `LoRa 수위 데이터와 선택 입력된 메탄 플럭스 값을 기반으로 산정했습니다. 배출권 제출 전에는 적용 방법론의 기준 배출계수, 보정계수, 검증기관의 품질 기준으로 최종 확정해야 합니다.`,
  ].join("\n");
}

function renderReport() {
  if (!currentSnapshot) return;
  const summary = regionSummary(currentSnapshot, regionSelect.value);
  const latest = latestForRegion(currentSnapshot, summary.regionId);
  const month = monthInput.value || "2026-05";
  const ready = summary.verificationRate >= 95 && latest.length === summary.nodeCount;
  const created = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  reportTitle.textContent = `${summary.title} MRV 월간 보고서`;
  reportCreated.textContent = `자동 작성: ${created}`;
  reportCarbon.textContent = `${formatter.format(summary.annualReductionTco2e)} tCO2eq`;
  reportCredit.textContent = `${summary.creditEstimate.toLocaleString("ko-KR")} KOC`;
  reportVerify.textContent = `${summary.verificationRate.toFixed(1)}%`;
  reportReady.textContent = ready ? "제출 가능" : "검토 필요";
  stateBadge.textContent = ready ? "자동 작성 완료" : "검토 필요";
  stateBadge.classList.toggle("warn", !ready);
  stateBadge.classList.toggle("safe", ready);

  reportOverview.textContent = `${getMonthLabel(month)} 기준 ${summary.location}의 LoRa 수위 노드 ${summary.activeNodes}/${summary.nodeCount}개가 서버에 저장된 최신 값을 제공했습니다. 산정식은 수위 기반 물관리 계수와 선택 입력된 CH4 플럭스 값을 사용해 일 감축량을 계산하고 연환산했습니다.`;
  reportFindings.innerHTML = [
    `측정 면적 ${summary.areaHa} ha, 평균 수위 ${summary.avgWaterLevelCm} cm`,
    `평균 CH4 플럭스 ${summary.avgMethaneFluxMgM2Hr} mg/m2/h`,
    `일 감축량 ${summary.dailyReductionTco2e} tCO2eq, 연환산 ${formatter.format(summary.annualReductionTco2e)} tCO2eq`,
    `잠정 배출권 ${summary.creditEstimate.toLocaleString("ko-KR")} KOC, 자동 검증률 ${summary.verificationRate.toFixed(1)}%`,
  ]
    .map((item) => `<li>${item}</li>`)
    .join("");
  reportLedger.textContent = latest.length
    ? `최신 수신 노드: ${latest.map((item) => `${item.nodeId}(${item.verification})`).join(", ")}`
    : "아직 수신된 노드 데이터가 없습니다.";

  progressSensor.textContent = `${Math.round((summary.activeNodes / summary.nodeCount) * 100)}%`;
  progressSensorBar.style.setProperty("--value", `${Math.round((summary.activeNodes / summary.nodeCount) * 100)}%`);
  progressVerify.textContent = `${summary.verificationRate.toFixed(0)}%`;
  progressVerifyBar.style.setProperty("--value", `${summary.verificationRate}%`);
}

function downloadReport() {
  if (!currentSnapshot) return;
  const summary = regionSummary(currentSnapshot, regionSelect.value);
  const latest = latestForRegion(currentSnapshot, summary.regionId);
  const month = monthInput.value || "2026-05";
  const blob = new Blob([createReportText(summary, latest, month)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${summary.code}-${month}-MRV-report.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setupRegionOptions() {
  regionSelect.innerHTML = Model.REGIONS.map(
    (region) => `<option value="${region.slug}">${region.title} - ${region.label}</option>`
  ).join("");
}

setupRegionOptions();
generateButton?.addEventListener("click", renderReport);
regionSelect?.addEventListener("change", renderReport);
monthInput?.addEventListener("change", renderReport);
downloadButton?.addEventListener("click", downloadReport);
printButton?.addEventListener("click", () => window.print());

Live.subscribe((snapshot) => {
  currentSnapshot = snapshot;
  renderReport();
});
