# CWA Weather Backend - Copilot Instructions

## 專案概覽

Node.js + Express 天氣預報 API 服務，串接中央氣象署（CWA）開放資料平台，提供台灣六都 36 小時與三日天氣預報。

**架構特點**：單檔案架構，所有邏輯集中於 `server.js`。

## 技術棧

- **Runtime**: Node.js + Express 4.x
- **HTTP Client**: axios
- **快取**: node-cache（TTL 10 分鐘）
- **驗證**: express-validator
- **環境變數**: dotenv

## 開發指令

```bash
npm run dev    # 開發模式（nodemon）
npm start      # 正式啟動
```

## 關鍵配置

### 環境變數 (.env)

```env
CWA_API_KEY=<必填，從 opendata.cwa.gov.tw 取得>
PORT=3000
NODE_ENV=development
```

⚠️ 程式啟動時會檢查 `CWA_API_KEY`，若未設定則 `process.exit(1)`。

### 六都城市對照表 (CITY_MAP)

| 路由參數 | CWA 名稱 | 三日資料集 ID |
|----------|----------|---------------|
| `taipei` | 臺北市 | F-D0047-061 |
| `newtaipei` | 新北市 | F-D0047-069 |
| `taoyuan` | 桃園市 | F-D0047-005 |
| `taichung` | 臺中市 | F-D0047-073 |
| `tainan` | 臺南市 | F-D0047-077 |
| `kaohsiung` | 高雄市 | F-D0047-065 |

## API 端點

| 端點 | 說明 |
|------|------|
| `GET /api/weather/:city` | 36 小時預報（F-C0032-001） |
| `GET /api/weather/3day/:city` | 三日預報（F-D0047-xxx） |
| `GET /api/cities` | 城市列表 |
| `GET /api/health` | 健康檢查 + 快取統計 |

## 程式碼慣例

### API 回應格式

```javascript
// 成功
res.json({ success: true, cached: false, data: { ... } });

// 錯誤（含可用城市列表）
res.status(400).json({
  error: "參數錯誤",
  message: "無效的城市參數",
  availableCities: [{ key: "taipei", name: "臺北市" }, ...]
});
```

### 路由驗證模式

使用 express-validator + middleware chain：
```javascript
app.get("/api/weather/:city", validateCity, handleValidation, getWeather36Hours);
```

### 快取策略

- 使用 `node-cache`，key 格式：`36h_{city}` 或 `3day_{city}`
- 回應包含 `cached: true/false` 標示資料來源

## 擴展指南

### 新增城市

1. 在 `CITY_MAP` 新增項目（注意使用「臺」非「台」）
2. 路由自動支援，無需修改其他程式碼

### CWA API 注意事項

- 36 小時預報：`records.location[0]`
- 三日預報：`records.locations[0]`（多一層 `s`）
- API 有每日呼叫次數限制

## 文件

- `Doc/API.md`：完整 API 規格文件
