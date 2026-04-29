const reportData = {
  iksan: {
    title: "전북 1권역 관제 센터",
    location: "익산 제1산단",
    code: "IK",
    carbon: 1258.59,
    credit: 1258,
    verify: 98.7,
    nodes: 24,
    alerts: 1,
    ledger: "2026-04-30 00:18 기준 5개 검증 원장이 블록체인 해시로 확정되었습니다.",
  },
  gunsan: {
    title: "전북 3권역 관제 센터",
    location: "군산 국가산단",
    code: "GS",
    carbon: 1422.91,
    credit: 1422,
    verify: 99.1,
    nodes: 26,
    alerts: 0,
    ledger: "군산 권역 측정값은 원장 지연 없이 자동 검증 완료 상태입니다.",
  },
  wanju: {
    title: "전북 7권역 관제 센터",
    location: "완주 수소산업 거점",
    code: "WJ",
    carbon: 1188.04,
    credit: 1188,
    verify: 97.9,
    nodes: 18,
    alerts: 1,
    ledger: "완주 권역은 일부 장비 점검 알림을 제외하고 제출 기준을 충족합니다.",
  },
  buan: {
    title: "전북 10권역 관제 센터",
    location: "부안 재생에너지 실증단지",
    code: "BA",
    carbon: 1034.51,
    credit: 1034,
    verify: 98.2,
    nodes: 20,
    alerts: 1,
    ledger: "부안 권역은 통신 지연 재시도 후 원장 기록 무결성이 확인되었습니다.",
  },
};

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

function getMonthLabel(value) {
  const [year, month] = value.split("-");
  return `${year}년 ${Number(month)}월`;
}

function createReportText(data, month) {
  return [
    `${data.title} MRV 월간 보고서`,
    `보고 월: ${getMonthLabel(month)}`,
    `대상 권역: ${data.location}`,
    `누적 탄소 감축량: ${formatter.format(data.carbon)} tCO2eq`,
    `전환 배출권: ${data.credit.toLocaleString("ko-KR")} KOC`,
    `자동 검증률: ${data.verify.toFixed(1)}%`,
    "",
    "보고 개요",
    `${data.location}의 ${data.nodes}개 센서 노드는 전력 및 가스 사용량을 자동 수집하고, MRV 산정 로직을 통해 월간 감축량을 검증했습니다.`,
    "",
    "측정 및 검증 결과",
    `- 센서 노드 ${data.nodes}개소가 정상 수집 상태입니다.`,
    `- 누적 감축량 ${formatter.format(data.carbon)} tCO2eq가 산정되었습니다.`,
    `- ${data.credit.toLocaleString("ko-KR")} KOC 전환 가능 물량이 확인되었습니다.`,
    `- 미해결 알림은 ${data.alerts}건이며 제출 영향은 낮음으로 판단됩니다.`,
    "",
    "원장 기록 및 제출 의견",
    data.ledger,
  ].join("\n");
}

function renderReport() {
  const data = reportData[regionSelect.value];
  const month = monthInput.value || "2026-05";
  const ready = data.verify >= 98 && data.alerts <= 1;
  const created = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  reportTitle.textContent = `${data.title} MRV 월간 보고서`;
  reportCreated.textContent = `자동 작성: ${created}`;
  reportCarbon.textContent = `${formatter.format(data.carbon)} tCO₂eq`;
  reportCredit.textContent = `${data.credit.toLocaleString("ko-KR")} KOC`;
  reportVerify.textContent = `${data.verify.toFixed(1)}%`;
  reportReady.textContent = ready ? "제출 가능" : "검토 필요";
  stateBadge.textContent = ready ? "자동 작성 완료" : "검토 필요";
  stateBadge.classList.toggle("warn", !ready);
  stateBadge.classList.toggle("safe", ready);

  reportOverview.textContent = `${getMonthLabel(month)} 기준 ${data.location}의 ${data.nodes}개 센서 노드가 수집한 전력·가스 측정 데이터를 MRV 산정 로직과 검증 원장에 반영했습니다.`;
  reportFindings.innerHTML = [
    `누적 탄소 감축량 ${formatter.format(data.carbon)} tCO₂eq 산정`,
    `탄소 배출권 ${data.credit.toLocaleString("ko-KR")} KOC 전환 가능`,
    `자동 검증률 ${data.verify.toFixed(1)}%로 제출 기준 충족`,
    `미해결 알림 ${data.alerts}건은 보고서 주석으로 자동 반영`,
  ]
    .map((item) => `<li>${item}</li>`)
    .join("");
  reportLedger.textContent = data.ledger;

  progressSensor.textContent = `${Math.min(99, 92 + data.nodes / 4).toFixed(0)}%`;
  progressSensorBar.style.setProperty("--value", `${Math.min(99, 92 + data.nodes / 4)}%`);
  progressVerify.textContent = `${data.verify.toFixed(0)}%`;
  progressVerifyBar.style.setProperty("--value", `${data.verify}%`);
}

function downloadReport() {
  const data = reportData[regionSelect.value];
  const month = monthInput.value || "2026-05";
  const blob = new Blob([createReportText(data, month)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.code}-${month}-MRV-report.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

generateButton?.addEventListener("click", renderReport);
regionSelect?.addEventListener("change", renderReport);
monthInput?.addEventListener("change", renderReport);
downloadButton?.addEventListener("click", downloadReport);
printButton?.addEventListener("click", () => window.print());

renderReport();
