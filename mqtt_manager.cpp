#include "mqtt_manager.h"
#include "config.h"
#include <WiFi.h>

static WiFiClient espClient;
static PubSubClient client(espClient);

void initMQTT(MqttMessageCallback callback) {
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(callback);
  Serial.print("[MQTT] Da cau hinh broker: ");
  Serial.print(MQTT_BROKER);
  Serial.print(" : ");
  Serial.println(MQTT_PORT);
}

void checkMQTTConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  while (!client.connected()) {
    Serial.print("[MQTT] Dang ket noi toi MQTT Broker...");

    // Tạo Client ID duy nhất theo MAC / Efuse của ESP32
    uint32_t chipId = (uint32_t)ESP.getEfuseMac();
    String clientId = String(MQTT_CLIENT_ID) + "_" + String(chipId, HEX);

    bool connected = false;
    if (strlen(MQTT_USERNAME) > 0) {
      connected = client.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD);
    } else {
      connected = client.connect(clientId.c_str());
    }

    if (connected) {
      Serial.print(" Thanh cong! (Client ID: ");
      Serial.print(clientId);
      Serial.println(")");
      client.subscribe(TOPIC_DEVICE_CONTROL);
      Serial.print("[MQTT] Da Subscribe vao topic: ");
      Serial.println(TOPIC_DEVICE_CONTROL);
    } else {
      Serial.print(" That bai, ma loi rc=");
      Serial.print(client.state());
      Serial.println(". Thu lai sau 3 giay...");
      delay(3000);
      break;
    }
  }
}

void handleMQTTLoop() {
  if (client.connected()) {
    client.loop();
  }
}

bool publishSensorData(float temperature, float humidity, int lightValue) {
  if (!client.connected()) {
    return false;
  }

  char payload[128];
  snprintf(payload, sizeof(payload), 
           "temperature=%.1f,humidity=%.1f,light=%d", 
           temperature, humidity, lightValue);

  bool success = client.publish(TOPIC_SENSOR_DATA, payload);
  if (success) {
    Serial.print("[MQTT -> Publish Sensor]: ");
    Serial.println(payload);
  } else {
    Serial.println("[MQTT -> Publish LOI] Khong the gui goi tin!");
  }
  return success;
}

bool publishDeviceStatus(const char* deviceId, const char* status, long logId) {
  if (!client.connected()) {
    return false;
  }

  char payload[64];
  snprintf(payload, sizeof(payload), "%s=%s", deviceId, status);

  bool success = client.publish(TOPIC_DEVICE_STATUS, payload);
  if (success) {
    Serial.print("[MQTT -> Status Response]: ");
    Serial.println(payload);
  } else {
    Serial.println("[MQTT -> Status Response LOI] Khong the gui ACK!");
  }
  return success;
}
