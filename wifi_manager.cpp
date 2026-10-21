#include "wifi_manager.h"
#include "config.h"
#include <WiFi.h>

void initWiFi() {
  Serial.println("\n[WIFI] Dang khoi tao ket noi WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Ket noi WiFi thanh cong!");
    Serial.print("[WIFI] Dia chi IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WIFI - CANH BAO] Khong the ket noi WiFi luc nay. Se thu lai trong loop.");
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Mat ket noi WiFi! Dang ket noi lai...");
    WiFi.disconnect();
    WiFi.reconnect();
  }
}
