#include "dht_sensor.h"
#include "config.h"
#include <DHT.h>

static DHT dht(DHTPIN, DHTTYPE);

void initDHT() {
  dht.begin();
  Serial.printf("[DHT] Da khoi tao cam bien DHT11 tren chan %d.\n", DHTPIN);
}

bool readDHT(float &temperature, float &humidity) {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[DHT - LOI] Khong the doc du lieu tu DHT11!");
    return false;
  }

  return true;
}
