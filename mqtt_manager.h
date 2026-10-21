#ifndef MQTT_MANAGER_H
#define MQTT_MANAGER_H

#include <Arduino.h>
#include <PubSubClient.h>

typedef void (*MqttMessageCallback)(char* topic, byte* payload, unsigned int length);

void initMQTT(MqttMessageCallback callback);
void checkMQTTConnection();
void handleMQTTLoop();
bool publishSensorData(float temperature, float humidity, int lightValue = 0);
bool publishDeviceStatus(const char* deviceId, const char* status, long logId = 0);

#endif // MQTT_MANAGER_H
