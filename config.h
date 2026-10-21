#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// 1. CẤU HÌNH KẾT NỐI WIFI
#define WIFI_SSID               "MERCUSYS_5B6E"              // Tên WiFi của máy tính đang kết nối
#define WIFI_PASSWORD           ""                           // Mật khẩu WiFi

// 2. CẤU HÌNH MQTT BROKER
#define MQTT_BROKER             "192.168.0.101"       // IP máy tính trong mạng WiFi (từ ipconfig)
#define MQTT_PORT               8883                  // Port theo yêu cầu của bạn

#define MQTT_CLIENT_ID          "ESP32_IoT_Client" 
#define MQTT_USERNAME           "admin"         
#define MQTT_PASSWORD           "123456"   

// 3. CÁC MQTT TOPIC GIAO TIẾP CHUẨN HÓA
#define TOPIC_SENSOR_DATA       "data_sensor"         // ESP32 Publish dữ liệu nhiệt độ, độ ẩm, ánh sáng
#define TOPIC_DEVICE_CONTROL    "device_control"      // ESP32 Subscribe để nhận lệnh bật/tắt đèn
#define TOPIC_DEVICE_STATUS     "device_status"       // ESP32 Publish phản hồi trạng thái đèn

// 4. CẤU HÌNH CHÂN PHẦN CỨNG ESP32
#define DHTPIN                  4                     // GPIO 4  - Cảm biến DHT11 (Nhiệt độ, Độ ẩm)
#define DHTTYPE                 DHT11                 // Loại cảm biến DHT11

#define PIN_LIGHT_SENSOR        32                   

#define PIN_LED_1               19                    // GPIO 19 - Đèn LED 1
#define PIN_LED_2               21                    // GPIO 21 - Đèn LED 2

// 5. THỜI GIAN ĐỊNH KỲ
#define SENSOR_READ_INTERVAL_MS 3000                  // Chu kỳ gửi dữ liệu cảm biến (3 giây)

#endif // CONFIG_H
