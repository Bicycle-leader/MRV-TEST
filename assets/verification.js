const Model = window.MRVModel;
const Live = window.MRVLive;

const regionSelect = document.querySelector("[data-verification-region]");
const regionTitle = document.querySelector("[data-verification-region-title]");
const currentStep = document.querySelector("[data-verification-current]");
const updatedAt = document.querySelector("[data-verification-updated]");
const progressTotal = document.querySelector("[data-verify-progress]");
const passedCount = document.querySelector("[data-verify-passed]");
const reviewCount = document.querySelector("[data-verify-review]");
const rejectedCount = document.querySelector("[data-verify-rejected]");
const stepsBoard = document.querySelector("[data-verification-steps]");
const tableBody = document.querySelector("[data-verification-table]");
const evidenceBody = document.querySelector("[data-verification-evidence]");

const STATUS_META = {
  대기: { className: "wait" },
  진행중: { className: "running" },
  통과: { className: "pass" },
  보류: { className: "hold" },
  반려: { className: "reject" },
  "재검토 필요": { className: "review" },
};

const STEP_LABELS = [
  "원자료 수신",
  "데이터 품질검사",
  "이상치·결측 검토",
  "산정식 재계산",
  "증빙자료 확인",
  "검토자 승인",
  "보고서 반영",
];

let currentSnapshot;

function clamp(value) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatTime(value) {
  if (!value) return "수신 대기";
  return new Date(value).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusChip(status) {
  const meta = STATUS_META[status] || STATUS_META.대기;
  return `<span class="verify-status status-${meta.className}">${status}</span>`;
}

function regionSummary(snapshot, slug) {
  return snapshot.summary.regions.find((item) => item.slug === slug) || snapshot.summary.regions[0];
}

function latestForRegion(snapshot, regionId) {
  return (snapshot.latest || []).filter((item) => item.regionId === regionId);
}

function alertsForRegion(snapshot, regionId) {
  return (snapshot.alerts || []).filter((item) => item.regionId === regionId);
}

function evidenceScore(summary, latest, alerts) {
  const nodeRatio = summary.nodeCount ? (summary.activeNodes / summary.nodeCount) * 38 : 0;
  const verificationRatio = summary.verificationRate * 0.42;
  const telemetryRatio = latest.length ? 20 : 0;
  const alertPenalty = Math.min(30, alerts.length * 5);
  return clamp(nodeRatio + verificationRatio + telemetryRatio - alertPenalty);
}

function deriveStages(snapshot, summary) {
  const latest = latestForRegion(snapshot, summary.regionId);
  const alerts = alertsForRegion(snapshot, summary.regionId);
  const highAlerts = alerts.filter((item) => item.level === "high").length;
  const mediumAlerts = alerts.filter((item) => item.level === "medium").length;
  const lowAlerts = alerts.filter((item) => item.level === "low").length;
  const rawProgress = summary.nodeCount ? (summary.activeNodes / summary.nodeCount) * 100 : 0;
  const rawStatus = summary.activeNodes === 0 ? "대기" : summary.activeNodes < summary.nodeCount ? "진행중" : "통과";
  const qualityStatus =
    summary.verificationRate >= 95
      ? "통과"
      : summary.verificationRate >= 88
        ? "진행중"
        : summary.verificationRate >= 75
          ? "재검토 필요"
          : summary.verificationRate >= 60
            ? "보류"
            : "반려";
  const outlierStatus =
    highAlerts >= 2 ? "반려" : highAlerts === 1 ? "보류" : mediumAlerts > 0 || lowAlerts > 2 ? "재검토 필요" : "통과";
  const calcStatus = ["반려", "보류"].includes(qualityStatus) ? "대기" : summary.annualReductionTco2e > 0 ? "통과" : "진행중";
  const evidence = evidenceScore(summary, latest, alerts);
  const evidenceStatus =
    ["반려", "보류"].includes(outlierStatus)
      ? "대기"
      : evidence >= 92
        ? "통과"
        : evidence >= 78
          ? "진행중"
          : evidence >= 62
            ? "재검토 필요"
            : "보류";
  const reviewerStatus =
    evidenceStatus === "통과" && calcStatus === "통과" && outlierStatus !== "재검토 필요"
      ? "통과"
      : ["반려", "보류"].includes(outlierStatus)
        ? outlierStatus
        : evidenceStatus === "진행중"
          ? "진행중"
          : evidenceStatus === "재검토 필요"
            ? "재검토 필요"
            : "대기";
  const reportStatus = reviewerStatus === "통과" ? "통과" : reviewerStatus === "진행중" ? "진행중" : "대기";

  return [
    {
      label: STEP_LABELS[0],
      status: rawStatus,
      progress: clamp(rawProgress),
      metric: `${summary.activeNodes}/${summary.nodeCount}개 노드`,
      description: "LoRa 게이트웨이 원자료가 서버에 저장되는 단계입니다.",
    },
    {
      label: STEP_LABELS[1],
      status: qualityStatus,
      progress: clamp(summary.verificationRate),
      metric: `${summary.verificationRate.toFixed(1)}%`,
      description: "배터리, RSSI, 수신 시각 기준으로 데이터 품질을 검사합니다.",
    },
    {
      label: STEP_LABELS[2],
      status: outlierStatus,
      progress: clamp(100 - highAlerts * 28 - mediumAlerts * 14 - lowAlerts * 6),
      metric: `${alerts.length}건 검토`,
      description: "수위 급변, 결측, 통신 지연, 담수 지속 알림을 검토합니다.",
    },
    {
      label: STEP_LABELS[3],
      status: calcStatus,
      progress: calcStatus === "통과" ? 100 : calcStatus === "대기" ? 12 : 64,
      metric: `${summary.dailyReductionTco2e} tCO2eq/day`,
      description: "CH4 플럭스와 수위 값을 기준으로 감축 산정식을 재계산합니다.",
    },
    {
      label: STEP_LABELS[4],
      status: evidenceStatus,
      progress: evidence,
      metric: `${latest.length}건 원자료`,
      description: "센서 원자료, 서버 저장 시각, 권역별 산정 근거를 확인합니다.",
    },
    {
      label: STEP_LABELS[5],
      status: reviewerStatus,
      progress: reviewerStatus === "통과" ? 100 : reviewerStatus === "진행중" ? 62 : reviewerStatus === "재검토 필요" ? 42 : 18,
      metric: reviewerStatus === "통과" ? "승인 완료" : "검토 대기",
      description: "검토자가 자동 검증 결과와 증빙자료를 승인합니다.",
    },
    {
      label: STEP_LABELS[6],
      status: reportStatus,
      progress: reportStatus === "통과" ? 100 : reportStatus === "진행중" ? 58 : 8,
      metric: reportStatus === "통과" ? "반영 완료" : "반영 대기",
      description: "승인된 검증 결과를 MRV Report에 반영합니다.",
    },
  ];
}

function renderEvidence(latest) {
  evidenceBody.innerHTML = latest
    .slice()
    .sort((a, b) => new Date(b.measuredAt) - new Date(a.measuredAt))
    .slice(0, 5)
    .map(
      (item) => `
        <div>
          <span>${item.nodeId}</span>
          <strong>수위 ${item.waterLevelCm} cm · CH4 ${item.methaneFluxMgM2Hr}</strong>
          <em>${formatTime(item.receivedAt)}</em>
        </div>
      `
    )
    .join("");
}

function renderSnapshot(snapshot) {
  currentSnapshot = snapshot;
  const summary = regionSummary(snapshot, regionSelect.value);
  const region = Model.REGIONS.find((item) => item.slug === summary.slug) || Model.REGIONS[0];
  const latest = latestForRegion(snapshot, summary.regionId);
  const stages = deriveStages(snapshot, summary);
  const progress = clamp(stages.reduce((sum, stage) => sum + stage.progress, 0) / stages.length);
  const passed = stages.filter((stage) => stage.status === "통과").length;
  const review = stages.filter((stage) => ["재검토 필요", "보류"].includes(stage.status)).length;
  const rejected = stages.filter((stage) => stage.status === "반려").length;
  const current = stages.find((stage) => stage.status !== "통과") || stages[stages.length - 1];

  regionTitle.textContent = region.title;
  currentStep.textContent = current.label;
  updatedAt.textContent = formatTime(summary.lastReceivedAt);
  progressTotal.textContent = progress;
  passedCount.textContent = passed;
  reviewCount.textContent = review;
  rejectedCount.textContent = rejected;

  stepsBoard.innerHTML = stages
    .map(
      (stage, index) => `
        <article class="verify-step status-border-${STATUS_META[stage.status].className}">
          <div class="verify-step-head">
            <span>${String(index + 1).padStart(2, "0")}</span>
            ${statusChip(stage.status)}
          </div>
          <strong>${stage.label}</strong>
          <p>${stage.description}</p>
          <div class="verification-progress" style="--value:${stage.progress}%"><i></i></div>
          <em>${stage.metric}</em>
        </article>
      `
    )
    .join("");

  tableBody.innerHTML = stages
    .map(
      (stage) => `
        <div class="verification-row" role="row">
          <strong>${stage.label}</strong>
          ${statusChip(stage.status)}
          <span>${stage.metric}</span>
          <em>${stage.progress}%</em>
        </div>
      `
    )
    .join("");

  renderEvidence(latest);
}

function setupRegionOptions() {
  regionSelect.innerHTML = Model.REGIONS.map(
    (region) => `<option value="${region.slug}">${region.title} - ${region.label}</option>`
  ).join("");
}

setupRegionOptions();
regionSelect?.addEventListener("change", () => {
  if (currentSnapshot) renderSnapshot(currentSnapshot);
});

Live.subscribe(renderSnapshot);
