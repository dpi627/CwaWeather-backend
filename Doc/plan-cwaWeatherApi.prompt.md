## Plan: CWA 天氣 API 動態城市與六都三日預報

將現有 36 小時天氣 API 改為動態城市參數，並新增六都三日天氣預報端點。使用 `F-C0032-001` 資料集處理 36 小時預報，各都三日預報則對應專屬的 `F-D0047-xxx` 資料集。

### Steps

1. 在 [`server.js`](../server.js) 新增城市對照表（英文路由 → 繁體正名），包含六都對應的 `F-D0047-xxx` 資料集 ID
2. 重構 `getKaohsiungWeather` 為通用函數 `getWeather36Hours(cityName)`，從路由參數動態取得城市名稱
3. 新增路由 `GET /api/weather/:city`，透過城市對照表將 `req.params.city` 轉換為正確的 `locationName`
4. 新增 `getWeather3Days(datasetId, cityName)` 函數，處理三日預報資料解析（資料結構與 36 小時不同，需調整 `records.locations` 路徑）
5. 新增 6 個三日預報路由：`/api/weather/3day/taipei`、`/api/weather/3day/newtaipei`、`/api/weather/3day/taoyuan`、`/api/weather/3day/taichung`、`/api/weather/3day/tainan`、`/api/weather/3day/kaohsiung`
6. 移除舊有 `/api/weather/kaohsiung` 路由，更新根路由 `/` 的 `endpoints` 列表
7. 新增啟動時 `CWA_API_KEY` 環境變數檢查，若無則終止程式並提示錯誤
8. 在 [`Doc/`](../Doc) 資料夾建立 `API.md` 文件，說明所有端點用法

### Further Considerations

1. **六都正確名稱與按鈕選項**：提供六都按鈕讓使用者點選

   | 按鈕顯示 | 路由參數 | CWA locationName | 三日資料集 ID |
   |----------|----------|------------------|---------------|
   | 臺北市 | `taipei` | `臺北市` | `F-D0047-061` |
   | 新北市 | `newtaipei` | `新北市` | `F-D0047-069` |
   | 桃園市 | `taoyuan` | `桃園市` | `F-D0047-005` |
   | 臺中市 | `taichung` | `臺中市` | `F-D0047-073` |
   | 臺南市 | `tainan` | `臺南市` | `F-D0047-077` |
   | 高雄市 | `kaohsiung` | `高雄市` | `F-D0047-065` |

2. **建議加入套件**：
   - `node-cache`：記憶體快取，減少 CWA API 呼叫（建議 TTL 10-30 分鐘）
   - `express-validator`：路由參數驗證，確保城市參數有效

3. **錯誤處理機制**：
   - 無效城市參數 → 回傳 400 + 可用城市列表
   - CWA API 錯誤 → 回傳對應狀態碼與錯誤訊息
   - API Key 未設定 → 啟動時終止程式並提示

4. **路由調整**：移除 `/api/weather/kaohsiung`，統一使用 `/api/weather/:city` 與 `/api/weather/3day/:city`

5. **查詢範圍**：僅支援六都城市查詢，不開放鄉鎮市區層級

6. **API 文件**：完成後於 `Doc/API.md` 建立完整端點說明文件

7. **回傳格式**：36 小時與三日預報直接依據 CWA API 原始資料結構回傳，不額外統一格式

8. **環境變數檢查**：程式啟動時驗證 `CWA_API_KEY` 是否存在，若無則 `process.exit(1)` 並輸出錯誤訊息
