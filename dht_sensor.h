#ifndef DHT_SENSOR_H
#define DHT_SENSOR_H

#include <Arduino.h>

void initDHT();
bool readDHT(float &temperature, float &humidity);

#endif // DHT_SENSOR_H
