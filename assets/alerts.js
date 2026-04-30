const Live = window.MRVLive;

const immediateCount = document.querySelector("[data-alert-immediate]");
const openCount = document.querySelector("[data-alert-open]");
const avgDelay = document.querySelector("[data-alert-delay]");
const alertList = document.querySelector("[data-alert-list]");
const riskGrid = document.querySelector("[data-risk-grid]");

function formatDate(value) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderSnapshot(snapshot) {
  const alerts = snapshot.alerts || [];
  const high = alerts.filter((alert) => alert.level === "high").length;
  const medium = alerts.filter((alert) => alert.level === "medium").length;

  immediateCount.textContent = `${high}건`;
  openCount.textContent = `${alerts.length}건`;
  avgDelay.textContent = `${medium ? 8 : 3}분`;

  alertList.innerHTML = alerts.length
    ? alerts
        .slice(0, 12)
        .map(
          (alert) => `
            <article class="alert-item ${alert.level}">
              <div>
                <strong>${alert.title}</strong>
                <p>${alert.message} · ${formatDate(alert.createdAt)}</p>
              </div>
              <span>${alert.action}</span>
            </article>
          `
        )
        .join("")
    : `<article class="alert-item low"><div><strong>미해결 알림 없음</strong><p>모든 노드가 정상 수신 및 검증 상태입니다.</p></div><span>정상</span></article>`;

  riskGrid.innerHTML = snapshot.summary.regions
    .map((region) => {
      const count = alerts.filter((alert) => alert.regionId === region.regionId).length;
      const value = Math.min(100, count * 24 + (100 - region.verificationRate));
      return `<div><span>${region.label}</span><i style="--value:${value}%"></i><strong>${count}건</strong></div>`;
    })
    .join("");
}

Live.subscribe(renderSnapshot);
