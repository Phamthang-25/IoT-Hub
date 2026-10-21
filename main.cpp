#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

#include "config.h"
#include "wifi_manager.h"
#include "mqtt_manager.h"
#include "dht_sensor.h"

// Biến lưu mốc thời gian đọc cảm biến định kỳ
unsigned long lastSensorReadTime = 0;

// HÀM HỖ TRỢ LẤY GIÁ TRỊ TỪ CHUỖI JSON ĐƠN GIẢN
String getJsonValue(const String& json, const String& key) {
  int keyPos = json.indexOf("\"" + key + "\"");
  if (keyPos < 0) return "";
  int colonPos = json.indexOf(":", keyPos);
  if (colonPos < 0) return "";
  int firstQuote = json.indexOf("\"", colonPos);
  if (firstQuote < 0) return "";
  int secondQuote = json.indexOf("\"", firstQuote + 1);
  if (secondQuote < 0) return "";
  return json.substring(firstQuote + 1, secondQuote);
}

// HÀM CALLBACK: XỬ LÝ KHI NHẬN LỆNH ĐIỀU KHIỂN TỪ MQTT
void onMqttMessageReceived(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("\n-------------------------------------------");
  Serial.print("[MQTT Callback] Nhan lenh tu Topic: ");
  Serial.println(topic);
  Serial.print("[MQTT Callback] Noi dung: ");
  Serial.println(message);

  String raw = message;
  raw.trim();
  String upperMsg = raw;
  upperMsg.toUpperCase();

  String deviceId = getJsonValue(message, "device_id");
  if (deviceId == "") deviceId = getJsonValue(message, "device");
  String action   = getJsonValue(message, "action");
  if (action == "")   action   = getJsonValue(message, "status");

  // Nhận dạng lệnh văn bản thô từ terminal (Ví dụ: "LED1 ON", "led1=off", "LED2 ON")
  if (deviceId == "") {
    if (upperMsg.indexOf("LED1") >= 0 || upperMsg.indexOf("LED_1") >= 0) deviceId = "led1";
    else if (upperMsg.indexOf("LED2") >= 0 || upperMsg.indexOf("LED_2") >= 0) deviceId = "led2";
  }
  if (action == "") {
    if (upperMsg.indexOf("OFF") >= 0 || upperMsg.indexOf("=0") >= 0 || upperMsg.endsWith(" 0")) {
      action = "OFF";
    } else if (upperMsg.indexOf("ON") >= 0 || upperMsg.indexOf("=1") >= 0 || upperMsg.endsWith(" 1")) {
      action = "ON";
    }
  }

  deviceId.toLowerCase();
  action.toUpperCase();

  // Xử lý bật/tắt đèn
  // ĐÈN LED 1 (GPIO 19)
  if (deviceId == "led1" || deviceId == "led_1") {
    if (action == "ON") {
      digitalWrite(PIN_LED_1, HIGH);
      Serial.println("-> [THIET BI] Da BAT Den LED 1 (GPIO 19)");
      publishDeviceStatus("LED1", "ON");
    } else if (action == "OFF") {
      digitalWrite(PIN_LED_1, LOW);
      Serial.println("-> [THIET BI] Da TAT Den LED 1 (GPIO 19)");
      publishDeviceStatus("LED1", "OFF");
    }
  }
  // ĐÈN LED 2 (GPIO 21)
  else if (deviceId == "led2" || deviceId == "led_2") {
    if (action == "ON") {
      digitalWrite(PIN_LED_2, HIGH);
      Serial.println("-> [THIET BI] Da BAT Den LED 2 (GPIO 21)");
      publishDeviceStatus("LED2", "ON");
    } else if (action == "OFF") {
      digitalWrite(PIN_LED_2, LOW);
      Serial.println("-> [THIET BI] Da TAT Den LED 2 (GPIO 21)");
      publishDeviceStatus("LED2", "OFF");
    }
  }
  else {
    Serial.println("-> [CANH BAO] Khong xac dinh duoc thiet bi hoac lenh!");
  }
  Serial.println("-------------------------------------------");
}

// SETUP: KHỞI TẠO HỆ THỐNG
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("    ESP32 - HE THONG SENSOR & MOSQUITTO     ");

  // Cấu hình chân Output cho 2 đèn LED
  pinMode(PIN_LED_1, OUTPUT);
  pinMode(PIN_LED_2, OUTPUT);
  digitalWrite(PIN_LED_1, LOW);
  digitalWrite(PIN_LED_2, LOW);

  // Tự động nháy 2 LED khi khởi động để báo hiệu phần cứng sẵn sàng
  digitalWrite(PIN_LED_1, HIGH); delay(300); digitalWrite(PIN_LED_1, LOW);
  digitalWrite(PIN_LED_2, HIGH); delay(300); digitalWrite(PIN_LED_2, LOW);

  // Kích hoạt con Điện Trở Ẩn 45.000 Ohm tích hợp bên trong chân 32 của ESP32!
  pinMode(PIN_LIGHT_SENSOR, INPUT_PULLDOWN);

  // Khởi tạo cảm biến nhiệt độ & độ ẩm DHT11
  initDHT();
  
  // Khởi tạo kết nối WiFi
  initWiFi();
  
  // Khởi tạo kết nối MQTT Broker
  initMQTT(onMqttMessageReceived);
}

// LOOP: VÒNG LẶP CHÍNH
void loop() {
  // Duy trì kết nối MQTT và xử lý sự kiện
  checkMQTTConnection();
  handleMQTTLoop();

  // Đọc và gửi dữ liệu cảm biến định kỳ mỗi 3 giây
  unsigned long currentMillis = millis();
  if (currentMillis - lastSensorReadTime >= SENSOR_READ_INTERVAL_MS) {
    lastSensorReadTime = currentMillis;

    // Tự động kết nối lại WiFi nếu mất mạng
    checkWiFiConnection();

    float temperature = 0.0;
    float humidity = 0.0;

    if (readDHT(temperature, humidity)) {
      long sumLight = 0;
      for(int i = 0; i < 10; i++) {
        sumLight += analogRead(PIN_LIGHT_SENSOR);
        delay(10);
      }
      int rawLight = sumLight / 10;
      
      int lightValue = map(rawLight, 2850, 3050, 0, 100);
      
      if (lightValue < 0) lightValue = 0;
      if (lightValue > 100) lightValue = 100;

      Serial.println("----------------------------------------");
      Serial.printf("Nhiet do : %.1f *C\n", temperature);
      Serial.printf("Do am    : %.1f %%\n", humidity);
      Serial.printf("Anh sang : %d (GPIO %d)\n", lightValue, PIN_LIGHT_SENSOR);

      // Gửi dữ liệu lên Mosquitto Broker
      publishSensorData(temperature, humidity, lightValue);
    }
  }
}
