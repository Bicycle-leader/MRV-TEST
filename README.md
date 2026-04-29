# MRV-TEST

JeonBuk University MRV Control Map prototype.

## Pages

- `index.html`: Kakao/Daum 지도 기반 관제 첫 화면
- `sensor.html`: 권역별 센서 수집 품질 및 노드 측정 데이터
- `alerts.html`: 검증 실패, 통신 지연, 현장 조치 알림 관리
- `mrv.html`: MRV 월간 보고서 자동 작성 및 출력

## Preview

Open `index.html` directly in a browser, or run the included static server:

```powershell
node preview-server.js
```

Then visit `http://127.0.0.1:4173`.

## Deploy

This project is static HTML/CSS/JS, so it can be deployed without a build step to Vercel, Netlify, GitHub Pages, or any static host.
