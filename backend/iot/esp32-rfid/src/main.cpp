// 1 = Wokwi (botões), 0 = RC522 real
#define USE_WOKWI_SIM 1

#include <WiFi.h>
#include <time.h>

#if USE_WOKWI_SIM
  const char* WIFI_SSID = "Wokwi-GUEST";
  const char* WIFI_PASS = "";
  const int   WIFI_CH   = 6;

  const char* API_HOST  = "cockatoo-thorough-aardvark.ngrok-free.app";
  const int   API_PORT  = 80;
  const char* API_PATH  = "/api/container-events";

  #define BTN1 13
  #define BTN2 14
  #define BTN3 26
#else
  #include <SPI.h>
  #include <MFRC522.h>
  #define RC522_SS  5
  #define RC522_RST 27
  MFRC522 rfid(RC522_SS, RC522_RST);

  const char* WIFI_SSID = "apto53c";
  const char* WIFI_PASS = "Thiagoemia";

  const char* API_HOST  = "192.168.15.69";
  const int   API_PORT  = 3000;
  const char* API_PATH  = "/api/container-events";
#endif

#define LED_GREEN 25
#define LED_RED   33

#ifndef MFRC522_H
  namespace MFRC522 {
    struct Uid {
      byte uidByte[10];
      byte size;
    };
  }
#endif

String nowISO() {
  time_t now; time(&now);
  struct tm tm; 
  gmtime_r(&now, &tm);
  char b[25]; 
  strftime(b, sizeof(b), "%Y-%m-%dT%H:%M:%SZ", &tm);
  return String(b);
}

void ledBlink(int pin, int n=1, int on=80, int off=80) {
  for (int i=0; i<n; i++) {
    digitalWrite(pin, HIGH); 
    delay(on); 
    digitalWrite(pin, LOW); 
    delay(off);
  }
}

void wifiEnsure() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true, true);
  delay(100);
  
  #if USE_WOKWI_SIM
    WiFi.begin(WIFI_SSID, WIFI_PASS, WIFI_CH);
  #else
    WiFi.begin(WIFI_SSID, WIFI_PASS);
  #endif
  
  unsigned long t0 = millis();
  Serial.printf("Conectando WiFi (%s)", WIFI_SSID);
  
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) {
    delay(250); 
    Serial.print(".");
  }
  Serial.println();
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi OK | IP: "); 
    Serial.println(WiFi.localIP());
    
    configTzTime("UTC0", "pool.ntp.org", "time.nist.gov");
    delay(500);
  } else {
    Serial.println("WiFi FAIL");
    ledBlink(LED_RED, 3, 200, 200);
  }
}

bool postEventRaw(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi não conectado");
    return false;
  }

  WiFiClient client;
  Serial.printf("Conectando a %s:%d\n", API_HOST, API_PORT);
  
  if (!client.connect(API_HOST, API_PORT)) {
    Serial.println("Falha na conexão TCP");
    return false;
  }

  String req;
  req  = String("POST ") + API_PATH + " HTTP/1.1\r\n";
  req += String("Host: ") + API_HOST + "\r\n";
  req += "Content-Type: application/json\r\n";
  req += "Connection: close\r\n";
  req += String("Content-Length: ") + payload.length() + "\r\n\r\n";
  req += payload;

  client.print(req);
  delay(10);

  String response = "";
  unsigned long timeout = millis();
  while (client.connected() && millis() - timeout < 3000) {
    if (client.available()) {
      String line = client.readStringUntil('\n');
      response += line + "\n";
      timeout = millis();
    }
  }
  
  client.stop();
  
  bool ok = response.indexOf("HTTP/1.1 200") != -1 || 
            response.indexOf("HTTP/1.1 201") != -1;
  
  Serial.print("Resposta: ");
  Serial.println(response);
  
  return ok;
}

#if !USE_WOKWI_SIM
String uidHex(const MFRC522::Uid& uid) {
  String s; 
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) s += '0';
    s += String(uid.uidByte[i], HEX);
  }
  s.toUpperCase(); 
  return s;
}
#endif

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.printf("HOST: %s\nPATH: %s\nPORT: %d\nMODE=%s\n",
    API_HOST, API_PATH, API_PORT, USE_WOKWI_SIM ? "WOKWI" : "RC522");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

  #if USE_WOKWI_SIM
    pinMode(BTN1, INPUT_PULLUP);
    pinMode(BTN2, INPUT_PULLUP);
    pinMode(BTN3, INPUT_PULLUP);
    Serial.println("Modo SIMULAÇÃO (Wokwi) ativo");
  #else
    SPI.begin(); 
    rfid.PCD_Init();
    Serial.println("Modo RFID real ativo");
  #endif

  wifiEnsure();
  Serial.println("Sistema pronto.");
}

void loop() {
  static unsigned long lastWifiCheck = 0;
  
  if (millis() - lastWifiCheck > 30000) {
    wifiEnsure();
    lastWifiCheck = millis();
  }

  #if USE_WOKWI_SIM
    struct Btn { 
      int pin; 
      const char* id; 
      const char* loc; 
    } buttons[] = {
      { BTN1, "CNT-1001", "Patio-A" },
      { BTN2, "CNT-1002", "Patio-B" },
      { BTN3, "CNT-1003", "Patio-C" }
    };
    
    static int lastState[3] = {HIGH, HIGH, HIGH};

    for (int i = 0; i < 3; i++) {
      int currentState = digitalRead(buttons[i].pin);
      
      if (currentState == LOW && lastState[i] == HIGH) {
        Serial.printf("Botão %d pressionado - Container: %s\n", i+1, buttons[i].id);
        
        String payload = String("{\"containerId\":\"") + buttons[i].id +
                         "\",\"eventType\":\"RFID_DETECTED\",\"site\":\"PORTO-SP\"" +
                         ",\"location\":\"" + buttons[i].loc + "\",\"gpio\":" + buttons[i].pin +
                         ",\"timestamp\":\"" + nowISO() + "\"}";
        
        bool ok = postEventRaw(payload);
        ledBlink(ok ? LED_GREEN : LED_RED, ok ? 2 : 4);
        
        delay(300);
      }
      lastState[i] = currentState;
    }
    delay(50);

  #else
    if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
      String uid = uidHex(rfid.uid);
      Serial.printf("RFID detectado: %s\n", uid.c_str());
      
      String payload = String("{\"containerId\":\"") + uid +
                       "\",\"eventType\":\"RFID_DETECTED\",\"site\":\"PORTO-SP\"" +
                       ",\"location\":\"Gate-A\",\"gpio\":-1" +
                       ",\"timestamp\":\"" + nowISO() + "\"}";
      
      bool ok = postEventRaw(payload);
      ledBlink(ok ? LED_GREEN : LED_RED, ok ? 2 : 4);
      
      rfid.PICC_HaltA(); 
      rfid.PCD_StopCrypto1();
      delay(1000);
    }
    delay(100);
  #endif
}