# CWA Weather Backend - Copilot Instructions

## 專案概覽

這是一個 Node.js + Express 天氣預報 API 服務，串接中央氣象署（CWA）開放資料平台。

**架構特點**：單檔案架構，所有路由和業務邏輯集中在 `server.js`，適合小型專案快速開發。

## 技術棧

- **Runtime**: Node.js + Express 4.x
- **HTTP Client**: axios（呼叫外部 CWA API）
- **環境變數**: dotenv
- **CORS**: cors middleware

## 開發指令

```bash
npm run dev    # 開發模式（nodemon 自動重啟）
npm start      # 正式啟動
```

## 關鍵配置

### 環境變數 (.env)

```env
CWA_API_KEY=<從 opendata.cwa.gov.tw 取得>
PORT=3000
NODE_ENV=development
```

### CWA API 端點

- **Base URL**: `https://opendata.cwa.gov.tw/api`
- **36小時預報**: `/v1/rest/datastore/F-C0032-001`
- **API 文件**: https://opendata.cwa.gov.tw/dist/opendata-swagger.html

## 程式碼慣例

### API 回應格式

成功回應：
```javascript
res.json({ success: true, data: { ... } });
```

錯誤回應：
```javascript
res.status(statusCode).json({ error: "錯誤類型", message: "描述" });
```

### CWA 天氣要素對應

在解析 CWA API 回應時，使用以下 `elementName` 對應：
- `Wx`: 天氣現象
- `PoP`: 降雨機率
- `MinT` / `MaxT`: 最低/最高溫度
- `CI`: 舒適度
- `WS`: 風速

## 擴展指南

### 新增其他縣市天氣

1. 複製 `getKaohsiungWeather` 函數
2. 修改 `locationName` 參數（如：`"臺北市"`、`"高雄市"`）
3. 新增對應路由：`app.get("/api/weather/{city}", handler)`

### 使用其他 CWA 資料集

參考 CWA Swagger 文件，常用資料集：
- `F-C0032-001`: 一般天氣預報（36小時）
- `F-D0047-001` ~ `F-D0047-091`: 各縣市天氣預報

## 注意事項

- CWA API 有每日呼叫次數限制
- 繁體中文地名需完全符合 CWA 格式（如「臺北市」非「台北市」）
- `.env` 不納入版控，部署時需手動設定
