# Daycare - 啟德4A2 360°現場導覽

按啟德4A2地下長者日間護理中心圖則建立的互動360°空間導覽。

[開啟已發布的導覽](https://kai-tak-4a2-360-tour.wilfredwongabc.chatgpt.site)

## 功能

- 9個圖則定位點及房間熱點跳轉
- 拖曳360°視角、縮放及自動旋轉
- 可點擊的互動平面圖
- WebGL 3D場景及無WebGL環境的兼容視圖
- 適用於桌面及手機

## 資料準確度

- 處所界線、房間用途及標示面積來自圖則。
- 空間長闊、門口、柱位及視角按比例推算。
- 混凝土牆地、外露樓底及機電喉管只用作表達清水樓狀態。
- 本模型並非實景攝影，不可作量度或施工用途。

## 本機開發

需要 Node.js 22.13 或以上版本。

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

主要介面位於 `app/page.tsx`，樣式位於 `app/globals.css`。
