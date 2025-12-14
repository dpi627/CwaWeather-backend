require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const NodeCache = require("node-cache");
const { param, validationResult } = require("express-validator");

const app = express();
const PORT = process.env.PORT || 3000;

// CWA API 設定
const CWA_API_BASE_URL = "https://opendata.cwa.gov.tw/api";
const CWA_API_KEY = process.env.CWA_API_KEY;

// 快取設定（TTL: 10 分鐘）
const cache = new NodeCache({ stdTTL: 600 });

// 六都城市對照表
const CITY_MAP = {
  taipei: { name: "臺北市", dataset3Day: "F-D0047-061" },
  newtaipei: { name: "新北市", dataset3Day: "F-D0047-069" },
  taoyuan: { name: "桃園市", dataset3Day: "F-D0047-005" },
  taichung: { name: "臺中市", dataset3Day: "F-D0047-073" },
  tainan: { name: "臺南市", dataset3Day: "F-D0047-077" },
  kaohsiung: { name: "高雄市", dataset3Day: "F-D0047-065" },
};

// 可用城市列表（供錯誤訊息使用）
const AVAILABLE_CITIES = Object.keys(CITY_MAP);

// 環境變數檢查
if (!CWA_API_KEY) {
  console.error("❌ 錯誤：請在 .env 檔案中設定 CWA_API_KEY");
  console.error("   取得 API Key: https://opendata.cwa.gov.tw/");
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: [
    'https://dpi627.github.io',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 城市參數驗證 middleware
const validateCity = [
  param("city")
    .isIn(AVAILABLE_CITIES)
    .withMessage("無效的城市參數"),
];

// 驗證結果處理
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "參數錯誤",
      message: "無效的城市參數",
      availableCities: AVAILABLE_CITIES.map((key) => ({
        key,
        name: CITY_MAP[key].name,
      })),
    });
  }
  next();
};

/**
 * 取得 36 小時天氣預報
 * 使用 F-C0032-001 資料集
 */
const getWeather36Hours = async (req, res) => {
  const cityKey = req.params.city;
  const cityInfo = CITY_MAP[cityKey];
  const cacheKey = `36h_${cityKey}`;

  try {
    // 檢查快取
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        data: cachedData,
      });
    }

    // 呼叫 CWA API - 一般天氣預報（36小時）
    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/F-C0032-001`,
      {
        params: {
          Authorization: CWA_API_KEY,
          locationName: cityInfo.name,
        },
      }
    );

    const locationData = response.data.records.location[0];

    if (!locationData) {
      return res.status(404).json({
        error: "查無資料",
        message: `無法取得${cityInfo.name}天氣資料`,
      });
    }

    // 直接回傳 CWA API 原始資料結構
    const weatherData = {
      city: locationData.locationName,
      datasetDescription: response.data.records.datasetDescription,
      location: locationData,
    };

    // 存入快取
    cache.set(cacheKey, weatherData);

    res.json({
      success: true,
      cached: false,
      data: weatherData,
    });
  } catch (error) {
    console.error(`取得${cityInfo.name}天氣資料失敗:`, error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: "CWA API 錯誤",
        message: error.response.data.message || "無法取得天氣資料",
        details: error.response.data,
      });
    }

    res.status(500).json({
      error: "伺服器錯誤",
      message: "無法取得天氣資料，請稍後再試",
    });
  }
};

/**
 * 取得三日天氣預報
 * 使用 F-D0047-xxx 資料集（各都專屬）
 */
const getWeather3Days = async (req, res) => {
  const cityKey = req.params.city;
  const cityInfo = CITY_MAP[cityKey];
  const cacheKey = `3day_${cityKey}`;

  try {
    // 檢查快取
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        cached: true,
        data: cachedData,
      });
    }

    // 呼叫 CWA API - 三日天氣預報
    console.log(`[3Day] 呼叫 API: ${cityInfo.dataset3Day}`);
    const response = await axios.get(
      `${CWA_API_BASE_URL}/v1/rest/datastore/${cityInfo.dataset3Day}`,
      {
        params: {
          Authorization: CWA_API_KEY,
        },
      }
    );

    console.log(`[3Day] API 狀態: ${response.status}`);
    console.log(`[3Day] 回應結構:`, JSON.stringify({
      hasRecords: !!response.data?.records,
      hasLocations: !!response.data?.records?.Locations,
      LocationsType: Array.isArray(response.data?.records?.Locations) ? 'array' : typeof response.data?.records?.Locations
    }));

    // 檢查資料結構（注意：Locations 是大寫 L）
    if (!response.data?.records?.Locations) {
      console.error(`[3Day] 資料結構異常，完整回應:`, JSON.stringify(response.data).substring(0, 500));
      return res.status(500).json({
        error: "資料結構錯誤",
        message: "CWA API 回應格式異常",
        hint: "請檢查 Zeabur 環境變數 CWA_API_KEY 是否正確設定",
      });
    }

    const locationsArray = response.data.records.Locations;

    if (!locationsArray || locationsArray.length === 0) {
      return res.status(404).json({
        error: "查無資料",
        message: `無法取得${cityInfo.name}三日天氣資料`,
      });
    }

    // 直接回傳 CWA API 原始資料結構，保持 Locations（大寫）
    const weatherData = {
      Locations: locationsArray,
    };

    // 存入快取
    cache.set(cacheKey, weatherData);

    res.json({
      success: true,
      cached: false,
      data: weatherData,
    });
  } catch (error) {
    console.error(`[3Day] 錯誤 - ${cityInfo.name}:`, error.message);
    
    if (error.response) {
      console.error(`[3Day] HTTP ${error.response.status}:`, error.response.data);
      return res.status(error.response.status).json({
        error: "CWA API 錯誤",
        message: error.response.data.message || "無法取得天氣資料",
        statusCode: error.response.status,
        details: error.response.data,
      });
    }

    console.error(`[3Day] 系統錯誤:`, error.stack);
    res.status(500).json({
      error: "伺服器錯誤",
      message: "無法取得天氣資料，請稍後再試",
      errorMessage: error.message,
    });
  }
};

// Routes

// 首頁 - 顯示可用端點與六都選項
app.get("/", (req, res) => {
  res.json({
    message: "歡迎使用 CWA 天氣預報 API",
    availableCities: AVAILABLE_CITIES.map((key) => ({
      key,
      name: CITY_MAP[key].name,
    })),
    endpoints: {
      health: "GET /api/health",
      cities: "GET /api/cities",
      weather36Hours: "GET /api/weather/:city",
      weather3Days: "GET /api/weather/3day/:city",
    },
    examples: {
      taipei36Hours: "/api/weather/taipei",
      kaohsiung3Days: "/api/weather/3day/kaohsiung",
    },
  });
});

// 健康檢查
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    cacheStats: cache.getStats(),
  });
});

// 取得城市列表
app.get("/api/cities", (req, res) => {
  res.json({
    success: true,
    data: AVAILABLE_CITIES.map((key) => ({
      key,
      name: CITY_MAP[key].name,
      endpoints: {
        weather36Hours: `/api/weather/${key}`,
        weather3Days: `/api/weather/3day/${key}`,
      },
    })),
  });
});

// 36 小時天氣預報
app.get("/api/weather/:city", validateCity, handleValidation, getWeather36Hours);

// 三日天氣預報
app.get("/api/weather/3day/:city", validateCity, handleValidation, getWeather3Days);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "伺服器錯誤",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "找不到此路徑",
    availableEndpoints: {
      home: "/",
      health: "/api/health",
      cities: "/api/cities",
      weather36Hours: "/api/weather/:city",
      weather3Days: "/api/weather/3day/:city",
    },
  });
});

app.listen(PORT, () => {
  console.log(`🚀 伺服器已啟動於 http://localhost:${PORT}`);
  console.log(`📍 環境: ${process.env.NODE_ENV || "development"}`);
  console.log(`🏙️  支援城市: ${AVAILABLE_CITIES.join(", ")}`);
});
