#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

const char* API_URL  = "https://4709272a4168.ngrok-free.app/api/container-events";

const int buttonPins[3] = {12, 14, 27};
const int ledGreen = 25;
const int ledRed = 26;

const String containerIds[3] = {"CONT-123", "CONT-456", "CONT-789"};
const String activeVoyage = "VOY-2025-09A";
const String deviceId = "ESP32-001";

void blinkLedSuccess();
void blinkLedError();
void sendContainerEvent(String containerId, String eventType);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("🚀 ESP32 iniciado!");

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("🔌 Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi conectado!");
  Serial.print("📡 IP: ");
  Serial.println(WiFi.localIP());

  for (int i = 0; i < 3; i++) {
    pinMode(buttonPins[i], INPUT_PULLUP);
  }
  pinMode(ledGreen, OUTPUT);
  pinMode(ledRed, OUTPUT);
  digitalWrite(ledGreen, LOW);
  digitalWrite(ledRed, LOW);
}

void loop() {
  for (int i = 0; i < 3; i++) {
    if (digitalRead(buttonPins[i]) == LOW) {
      Serial.printf("📦 Botão %d pressionado -> Container %s\n", i+1, containerIds[i].c_str());
      sendContainerEvent(containerIds[i], "moved");
      delay(500);
    }
  }
}
void sendContainerEvent(String containerId, String eventType) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    Serial.println("🌍 Iniciando requisição HTTP...");

    http.begin(API_URL);
    http.addHeader("Content-Type", "application/json");

    String payload = "{"
      "\"container_id\":\"" + containerId + "\","
      "\"event_type\":\"" + eventType + "\","
      "\"voyage_id\":\"" + activeVoyage + "\","
      "\"device_id\":\"" + deviceId + "\","
      "\"gpio\":" + String(millis() % 30) + ","
      "\"site\":\"Terminal 1\","
      "\"location\":\"BRSSZ-Porto de Santos\""
    "}";

    Serial.print("📤 Enviando payload: ");
    Serial.println(payload);

    int httpResponseCode = http.POST(payload);

    Serial.print("📥 Código HTTP: ");
    Serial.println(httpResponseCode);

    if (httpResponseCode == 201 || httpResponseCode == 200) {
      Serial.println("✅ Evento registrado com sucesso!");
      blinkLedSuccess();
    } else {
      String error = http.getString();
      Serial.print("❌ Erro HTTP: ");
      Serial.println(error);
      blinkLedError();
    }
    http.end();
  } else {
    Serial.println("⚠️ WiFi desconectado!");
    blinkLedError();
  }
}

void blinkLedSuccess() {
  digitalWrite(ledGreen, HIGH);
  delay(200);
  digitalWrite(ledGreen, LOW);
}

void blinkLedError() {
  digitalWrite(ledRed, HIGH);
  delay(200);
  digitalWrite(ledRed, LOW);
}