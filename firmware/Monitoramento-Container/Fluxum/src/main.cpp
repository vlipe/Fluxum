#include <Arduino.h>
#include <Wire.h>
#include "GyverBME280.h"
#include <TinyGPS++.h>
#include <SPI.h>
#include <MFRC522.h>
#include "esp_system.h"



// --- Configuração dos Pinos ---
const int GPS_RX_PIN = 16, GPS_TX_PIN = 17;
const int RFID_SS_PIN = 26, RFID_RST_PIN = 27;

// --- Objetos dos Sensores ---
GyverBME280 bme;
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);

// --- Variáveis Globais para os Timers---
unsigned long previousDataMillis = 0;
const long dataInterval = 8000;
unsigned long previousRfidMillis = 0;
const long rfidInterval = 200;
String ultimaTagRfidLida = "";

// ======================================================================
// --- FUNÇÕES AUXILIARES ---
// ======================================================================

String getDeviceId() {
  uint8_t baseMac[6] = {0,0,0,0,0,0};
  esp_read_mac(baseMac, ESP_MAC_WIFI_STA);
  char deviceId[18];
  sprintf(deviceId, "%02X:%02X:%02X:%02X:%02X:%02X",
          baseMac[0], baseMac[1], baseMac[2],
          baseMac[3], baseMac[4], baseMac[5]);
  return String(deviceId);
}

void checaRfid() {
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String tagId = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) tagId += "0";
      tagId += String(mfrc522.uid.uidByte[i], HEX);
    }
    tagId.toUpperCase();
    ultimaTagRfidLida = tagId;
    mfrc522.PICC_HaltA();
  }
}

// --- FUNÇÃO OTIMIZADA PARA USAR MENOS MEMÓRIA ---
String montarPacoteJson() {
  String deviceId = getDeviceId();
  float tempC = bme.readTemperature();
  float umidade = bme.readHumidity();
  float pressao = bme.readPressure();

  String jsonString = "{\n";
  jsonString += "\t\"deviceId\":\"" + deviceId + "\",\n";
  
  // Lógica do Timestamp OTIMIZADA (sem sprintf)
  if (gps.date.isValid() && gps.time.isValid()) {
    String timestamp = String(gps.date.year()) + "-";
    if (gps.date.month() < 10) timestamp += "0";
    timestamp += String(gps.date.month()) + "-";
    if (gps.date.day() < 10) timestamp += "0";
    timestamp += String(gps.date.day()) + "T";
    if (gps.time.hour() < 10) timestamp += "0";
    timestamp += String(gps.time.hour()) + ":";
    if (gps.time.minute() < 10) timestamp += "0";
    timestamp += String(gps.time.minute()) + ":";
    if (gps.time.second() < 10) timestamp += "0";
    timestamp += String(gps.time.second()) + "Z";
    jsonString += "\t\"timestamp\":\"" + timestamp + "\",\n";
  } else {
    jsonString += "\t\"timestamp_error\":\"Aguardando sincronia do GPS\",\n";
  }
  
  if (tempC == 0 && umidade == 0 && pressao == 0) {
    jsonString += "\t\"ambiente_error\":\"Falha na leitura do BME280\",\n";
  } else {
    jsonString += "\t\"temperatura\":" + String(tempC) + ",\n";
    jsonString += "\t\"umidade\":" + String(umidade) + ",\n";
    jsonString += "\t\"pressao_hpa\":" + String(pressao / 100.0F) + ",\n";
  }

  if (gps.location.isValid()) {
    jsonString += "\t\"latitude\":" + String(gps.location.lat(), 6) + ",\n";
    jsonString += "\t\"longitude\":" + String(gps.location.lng(), 6);
  } else {
    jsonString += "\t\"gps_error\":\"Localizacao invalida\"";
  }

  if (ultimaTagRfidLida.length() > 0) {
    jsonString += ",\n\t\"rfid_tag\":\"" + ultimaTagRfidLida + "\"";
    ultimaTagRfidLida = ""; 
  }

  jsonString += "\n}";
  return jsonString;
}

// ======================================================================
// --- FUNÇÕES PRINCIPAIS ---
// ======================================================================

void setup(void) {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  SPI.begin();
  mfrc522.PCD_Init();
  
  if (!bme.begin()) {
    Serial.println("ERRO: Nao foi possivel encontrar o sensor BME280, verifique as conexoes!");
    while (1); 
  }
  
  delay(1000);
  Serial.println("\n--- IOT Fluxum (FINAL) iniciada ---");
  Serial.print("Device ID: ");
  Serial.println(getDeviceId());
  Serial.println("-----------------------------------");
}

void loop(void) {
  while (gpsSerial.available() > 0) { gps.encode(gpsSerial.read()); }
  
  unsigned long currentMillis = millis();

  if (currentMillis - previousRfidMillis >= rfidInterval) {
    previousRfidMillis = currentMillis;
    checaRfid(); 
  }
  
  if (currentMillis - previousDataMillis >= dataInterval) {
    previousDataMillis = currentMillis;
    String pacoteDeDados = montarPacoteJson();
    Serial.println("--- Novo Pacote de Dados ---");
    Serial.println(pacoteDeDados);
  }
}