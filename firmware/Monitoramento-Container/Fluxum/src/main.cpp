#include <Arduino.h>
#include <Wire.h>
#include "GyverBME280.h"
#include <TinyGPS++.h>
#include <SPI.h>
#include <MFRC522.h>
#include <esp_task_wdt.h>
#include <WiFi.h>        // Biblioteca para Wi-Fi
#include <HTTPClient.h>  // Biblioteca para requisições HTTP

// --- FLAG DE DEPURACAO (FALSE para hardware real) ---
#define FAKE_RFID_SCAN false 

// --- CONFIGURAÇÕES DE REDE ---
const char* ssid = "wneves";
const char* password = "20437355wgrjj";
// Substitua pelo IP do seu computador na rede local
const char* serverUrl = "http://192.168.15.13:3000/api/v1/telemetry/iot-data"; 

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
  #ifdef WOKWI
    return "AA:BB:CC:DD:EE:FF";
  #else
    uint8_t baseMac[6];
    esp_read_mac(baseMac, ESP_MAC_WIFI_STA);
    char deviceId[18];
    sprintf(deviceId, "%02X:%02X:%02X:%02X:%02X:%02X", baseMac[0], baseMac[1], baseMac[2], baseMac[3], baseMac[4], baseMac[5]);
    return String(deviceId);
  #endif
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

String montarPacoteJson() {
  String deviceId = getDeviceId();
  float tempC = bme.readTemperature();
  float umidade = bme.readHumidity();
  float pressao = bme.readPressure();

  String jsonString = "{\n";
  jsonString += "\t\"deviceId\":\"" + deviceId + "\",\n";
  
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

void enviarDadosParaApi(String jsonPayload) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    Serial.println("-> Enviando pacote para a API...");
    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    } else {
      Serial.printf("Erro na requisição HTTP: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end();
  } else {
    Serial.println("ERRO: Sem conexão Wi-Fi. Dados seriam salvos na memória.");
  }
}

void setup_wifi() {
  delay(10);
  Serial.println("\nConectando ao Wi-Fi...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) { // Tenta por 10 segundos
    delay(500);
    Serial.print(".");
    esp_task_wdt_reset();
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi conectado!");
    Serial.print("Endereço de IP do dispositivo: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n--- FALHA AO CONECTAR NO WI-FI ---");
    // Imprime o status do erro para sabermos o motivo
    Serial.print("Status da Conexao: ");
    Serial.println(WiFi.status()); 
    Serial.println("WL_IDLE_STATUS: 0");
    Serial.println("WL_NO_SSID_AVAIL: 1");
    Serial.println("WL_CONNECT_FAILED: 4");
    Serial.println("WL_CONNECTION_LOST: 5");
    Serial.println("WL_DISCONNECTED: 6");
    Serial.println("Verifique SSID, senha e sinal.");
  }
}

// ======================================================================
// --- FUNÇÕES PRINCIPAIS ---
// ======================================================================

void setup(void) {
  Serial.begin(115200);
  
  setup_wifi(); // Conecta ao Wi-Fi primeiro
  
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  SPI.begin();
  mfrc522.PCD_Init();
  
  if (!bme.begin()) {
    Serial.println("ERRO FATAL: Sensor BME280 nao encontrado!");
    while (1); 
  }
  
  esp_task_wdt_add(NULL);
  
  delay(1000);
  Serial.println("\n--- IOT Fluxum (v1.5 com Wi-Fi) iniciada ---");
  Serial.print("Device ID: ");
  Serial.println(getDeviceId());
  Serial.println("-------------------------------------------");
}

void loop(void) {
  esp_task_wdt_reset();
  while (gpsSerial.available() > 0) { gps.encode(gpsSerial.read()); }

  unsigned long currentMillis = millis();

  if (currentMillis - previousRfidMillis >= rfidInterval) {
    previousRfidMillis = currentMillis;
    #if !FAKE_RFID_SCAN
      checaRfid();
    #endif
  }
  
  if (currentMillis - previousDataMillis >= dataInterval) {
    previousDataMillis = currentMillis;
    String pacoteDeDados = montarPacoteJson();
    enviarDadosParaApi(pacoteDeDados);
  }
}