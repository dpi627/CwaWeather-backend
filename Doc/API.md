# CWA 天氣預報 API 文件

本 API 提供台灣六都天氣預報查詢服務，資料來源為中央氣象署（CWA）開放資料平台。

## Base URL

```
http://localhost:3000
```

## 支援城市（六都）

| 按鈕顯示 | 路由參數 | CWA locationName |
|----------|----------|------------------|
| 臺北市 | `taipei` | `臺北市` |
| 新北市 | `newtaipei` | `新北市` |
| 桃園市 | `taoyuan` | `桃園市` |
| 臺中市 | `taichung` | `臺中市` |
| 臺南市 | `tainan` | `臺南市` |
| 高雄市 | `kaohsiung` | `高雄市` |

---

## API 端點

### 1. 首頁

取得 API 說明與可用端點列表。

**Request**

```
GET /
```

**Response**

```json
{
  "message": "歡迎使用 CWA 天氣預報 API",
  "availableCities": [
    { "key": "taipei", "name": "臺北市" },
    { "key": "newtaipei", "name": "新北市" },
    { "key": "taoyuan", "name": "桃園市" },
    { "key": "taichung", "name": "臺中市" },
    { "key": "tainan", "name": "臺南市" },
    { "key": "kaohsiung", "name": "高雄市" }
  ],
  "endpoints": {
    "health": "GET /api/health",
    "cities": "GET /api/cities",
    "weather36Hours": "GET /api/weather/:city",
    "weather3Days": "GET /api/weather/3day/:city"
  },
  "examples": {
    "taipei36Hours": "/api/weather/taipei",
    "kaohsiung3Days": "/api/weather/3day/kaohsiung"
  }
}
```

---

### 2. 健康檢查

確認服務是否正常運行。

**Request**

```
GET /api/health
```

**Response**

```json
{
  "status": "OK",
  "timestamp": "2025-11-26T12:00:00.000Z",
  "cacheStats": {
    "hits": 10,
    "misses": 5,
    "keys": 3,
    "ksize": 24,
    "vsize": 12345
  }
}
```

---

### 3. 取得城市列表

取得所有支援的城市及其對應端點。

**Request**

```
GET /api/cities
```

**Response**

```json
{
  "success": true,
  "data": [
    {
      "key": "taipei",
      "name": "臺北市",
      "endpoints": {
        "weather36Hours": "/api/weather/taipei",
        "weather3Days": "/api/weather/3day/taipei"
      }
    },
    {
      "key": "newtaipei",
      "name": "新北市",
      "endpoints": {
        "weather36Hours": "/api/weather/newtaipei",
        "weather3Days": "/api/weather/3day/newtaipei"
      }
    }
    // ... 其他城市
  ]
}
```

---

### 4. 36 小時天氣預報

取得指定城市未來 36 小時的天氣預報。

**Request**

```
GET /api/weather/:city
```

**路由參數**

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| city | string | ✅ | 城市代碼（見支援城市列表） |

**範例**

```
GET /api/weather/taipei
GET /api/weather/kaohsiung
```

**Response**

```json
{
  "success": true,
  "cached": false,
  "data": {
    "city": "臺北市",
    "datasetDescription": "一般天氣預報-今明 36 小時天氣預報",
    "location": {
      "locationName": "臺北市",
      "weatherElement": [
        {
          "elementName": "Wx",
          "time": [
            {
              "startTime": "2025-11-26 06:00:00",
              "endTime": "2025-11-26 18:00:00",
              "parameter": {
                "parameterName": "晴時多雲",
                "parameterValue": "2"
              }
            }
          ]
        }
        // ... 其他天氣要素 (PoP, MinT, MaxT, CI)
      ]
    }
  }
}
```

**天氣要素說明**

| elementName | 說明 |
|-------------|------|
| Wx | 天氣現象 |
| PoP | 降雨機率 |
| MinT | 最低溫度 |
| MaxT | 最高溫度 |
| CI | 舒適度 |

---

### 5. 三日天氣預報

取得指定城市未來 3 天的天氣預報（逐 3 小時）。

**Request**

```
GET /api/weather/3day/:city
```

**路由參數**

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| city | string | ✅ | 城市代碼（見支援城市列表） |

**範例**

```
GET /api/weather/3day/taipei
GET /api/weather/3day/kaohsiung
```

**Response**

```json
{
  "success": true,
  "cached": false,
  "data": {
    "city": "臺北市",
    "datasetDescription": "F-D0047-061",
    "locations": {
      "locationsName": "臺北市",
      "dataid": "F-D0047-061",
      "location": [
        {
          "locationName": "中正區",
          "weatherElement": [
            {
              "elementName": "Wx",
              "description": "天氣現象",
              "time": [...]
            }
            // ... 其他天氣要素
          ]
        }
        // ... 其他區域
      ]
    }
  }
}
```

**三日預報資料集對照表**

| 城市 | 資料集 ID |
|------|-----------|
| 臺北市 | F-D0047-061 |
| 新北市 | F-D0047-069 |
| 桃園市 | F-D0047-005 |
| 臺中市 | F-D0047-073 |
| 臺南市 | F-D0047-077 |
| 高雄市 | F-D0047-065 |

---

## 錯誤回應

### 400 Bad Request - 無效的城市參數

```json
{
  "error": "參數錯誤",
  "message": "無效的城市參數",
  "availableCities": [
    { "key": "taipei", "name": "臺北市" },
    { "key": "newtaipei", "name": "新北市" },
    { "key": "taoyuan", "name": "桃園市" },
    { "key": "taichung", "name": "臺中市" },
    { "key": "tainan", "name": "臺南市" },
    { "key": "kaohsiung", "name": "高雄市" }
  ]
}
```

### 404 Not Found - 查無資料

```json
{
  "error": "查無資料",
  "message": "無法取得臺北市天氣資料"
}
```

### 500 Internal Server Error - 伺服器錯誤

```json
{
  "error": "伺服器錯誤",
  "message": "無法取得天氣資料，請稍後再試"
}
```

### CWA API 錯誤

```json
{
  "error": "CWA API 錯誤",
  "message": "無法取得天氣資料",
  "details": { ... }
}
```

---

## 快取機制

- 所有天氣資料會快取 10 分鐘（600 秒）
- 回應中的 `cached` 欄位標示資料是否來自快取
- 可透過 `/api/health` 查看快取統計資訊

---

## 環境變數

| 變數名稱 | 必填 | 說明 |
|----------|------|------|
| CWA_API_KEY | ✅ | 中央氣象署 API 授權碼 |
| PORT | ❌ | 伺服器埠號（預設 3000） |
| NODE_ENV | ❌ | 執行環境（development / production） |

### 取得 CWA API Key

1. 前往 [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/)
2. 註冊會員並登入
3. 在會員中心取得授權碼

---

## 啟動服務

```bash
# 安裝依賴
npm install

# 開發模式（自動重啟）
npm run dev

# 正式啟動
npm start
```

---

## 資料來源

- [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/)
- [API 文件](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
