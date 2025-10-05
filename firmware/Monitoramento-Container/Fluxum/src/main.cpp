#include <Arduino.h>
#include <Wire.h>
#include "GyverBME280.h"
#include <TinyGPS++.h>
#include <SPI.h>
#include <MFRC522.h>
#include <esp_task_wdt.h>
#include <WiFi.h>
#include <HTTPClient.h>

// --- FLAG DE DEPURACAO ---
#define FAKE_RFID_SCAN false 

// --- CONFIGURAÇÕES DE REDE ---
const char* ssid = "wneves";
const char* password = "20437355wgrjj";
// Substitua pelo IP do seu computador na rede local
const char* serverUrl = "http://192.168.15.13:3000/api/container-events"; 

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

    String event_type = "HEARTBEAT";
  if (ultimaTagRfidLida.length() > 0) {
    event_type = "RFID_DETECTED";
  }

  String jsonString = "{";
  jsonString += "\"device_id\":\"" + deviceId + "\""; // Ajustado para 'device_id'
  jsonString += ",\"event_type\":\"" + event_type + "\""; // <-- CAMPO ADICIONADO AQUI

  // Lógica Final do Timestamp: Só adiciona o campo se for válido (ano > 2000).
  if (gps.date.isValid() && gps.time.isValid() && gps.date.year() > 2000) {
    char timestamp[24];
    sprintf(timestamp, "%04d-%02d-%02dT%02d:%02d:%02dZ", 
            gps.date.year(), gps.date.month(), gps.date.day(), 
            gps.time.hour(), gps.time.minute(), gps.time.second());
    jsonString += ",\"timestamp\":\"" + String(timestamp) + "\"";
  }

  if (tempC == 0 && umidade == 0 && pressao == 0) {
    jsonString += ",\"ambiente_error\":\"Falha na leitura do BME280\"";
  } else {
    jsonString += ",\"temperatura\":" + String(tempC);
    jsonString += ",\"umidade\":" + String(umidade);
    jsonString += ",\"pressao_hpa\":" + String(pressao / 100.0F);
  }

  if (gps.location.isValid()) {
    jsonString += ",\"latitude\":" + String(gps.location.lat(), 6);
    jsonString += ",\"longitude\":" + String(gps.location.lng(), 6);
  } else {
    jsonString += ",\"gps_error\":\"Localizacao invalida\"";
  }

  if (ultimaTagRfidLida.length() > 0) {
    jsonString += ",\"rfid_tag\":\"" + ultimaTagRfidLida + "\"";
    ultimaTagRfidLida = ""; 
  }

  jsonString += "}";
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
    Serial.println("ERRO: Sem conexão Wi-Fi.");
  }
}

void setup_wifi() {
  delay(10);
  Serial.println("\nConectando ao Wi-Fi...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
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
    Serial.println("\nFalha ao conectar no Wi-Fi.");
  }
}

// ======================================================================
// --- FUNÇÕES PRINCIPAIS ---
// ======================================================================

void setup(void) {
  Serial.begin(115200);
  
  esp_task_wdt_add(NULL);
  
  setup_wifi(); 
  
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  SPI.begin();
  mfrc522.PCD_Init();
  
  if (!bme.begin()) {
    Serial.println("ERRO FATAL: Sensor BME280 nao encontrado!");
    while (1); 
  }
  
  delay(1000);
  Serial.println("\n--- IOT Fluxum (Hardware Real v1.7) iniciada ---");
  Serial.print("Device ID: ");
  Serial.println(getDeviceId());
  Serial.println("----------------------------------------------");
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
    // Apenas para depuração, podemos imprimir o pacote antes de enviar
    Serial.println("--- Gerando Pacote de Dados ---");
    Serial.println(pacoteDeDados); 
    
    enviarDadosParaApi(pacoteDeDados);
  }
}