// 1 = Wokwi (botões), 0 = RC522 real
#define USE_WOKWI_SIM 1

#include <WiFi.h>
#include <time.h>

// ======= REDE/ENDPOINT =======
#if USE_WOKWI_SIM
  const char* WIFI_SSID = "Wokwi-GUEST";
  const char* WIFI_PASS = "";
  const int   WIFI_CH   = 6;


  const char* API_HOST  = "cockatoo-thorough-aardvark.ngrok-free.app";
  const int   API_PORT  = 80;
  const char* API_PATH  = "/api/container-events";

  // Botões
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
// =============================

#define LED_GREEN 25
#define LED_RED   33

String nowISO() {
  time_t now; time(&now);
  struct tm tm; gmtime_r(&now, &tm);
  char b[25]; strftime(b, sizeof(b), "%Y-%m-%dT%H:%M:%SZ", &tm);
  return String(b);
}

void ledBlink(int pin, int n=1, int on=80, int off=80) {
  for (int i=0;i<n;i++){ digitalWrite(pin,HIGH); delay(on); digitalWrite(pin,LOW); delay(off); }
}

void wifiEnsure() {
  if (WiFi.status()==WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true,true);
  delay(100);
#if USE_WOKWI_SIM
  WiFi.begin(WIFI_SSID, WIFI_PASS, WIFI_CH);
#else
  WiFi.begin(WIFI_SSID, WIFI_PASS);
#endif
  unsigned long t0=millis();
  Serial.printf("Conectando WiFi (%s)", WIFI_SSID);
  while (WiFi.status()!=WL_CONNECTED && millis()-t0<15000){ delay(250); Serial.print("."); }
  Serial.println();
  if (WiFi.status()==WL_CONNECTED) {
    Serial.print("WiFi OK | IP: "); Serial.println(WiFi.localIP());
    configTime(0,0,"pool.ntp.org","time.nist.gov");
  } else {
    Serial.println("WiFi FAIL");
  }
}

// ======= POST HTTP =======
bool postEventRaw(const String& payload) {
  if (WiFi.status()!=WL_CONNECTED) return false;

  WiFiClient client;
  Serial.printf("Conectando a %s:%d\n", API_HOST, API_PORT);
  if (!client.connect(API_HOST, API_PORT)) {
    Serial.println("Falha na conexão TCP");
    return false;
  }

  // Monta request HTTP
  String req;
  req  = String("POST ") + API_PATH + " HTTP/1.1\r\n";
  req += String("Host: ") + API_HOST + "\r\n";
  req += "Content-Type: application/json\r\n";
  req += "Connection: close\r\n";
  req += String("Content-Length: ") + payload.length() + "\r\n\r\n";
  req += payload;

  client.print(req);

  // Lê a primeira linha (status)
  String status = client.readStringUntil('\n');
  status.trim();
  Serial.print("STATUS: "); Serial.println(status);

  bool ok = status.startsWith("HTTP/1.1 200") || status.startsWith("HTTP/1.1 201");

  // (Opcional) ler resto do corpo para log
  unsigned long t0 = millis();
  while (client.connected() && millis()-t0 < 3000) {
    while (client.available()) {
      String line = client.readStringUntil('\n');
      Serial.println(line);
      t0 = millis();
    }
  }
  client.stop();
  return ok;
}
// =======================================

#if !USE_WOKWI_SIM
String uidHex(const MFRC522::Uid& uid){
  String s; for (byte i=0;i<uid.size;i++){ if(uid.uidByte[i]<0x10) s+='0'; s+=String(uid.uidByte[i],HEX); }
  s.toUpperCase(); return s;
}
#endif

void setup(){
  Serial.begin(115200);
  delay(100);

  Serial.printf("HOST: %s\nPATH: %s\nPORT: %d\nMODE=%s\n",
    API_HOST, API_PATH, API_PORT, USE_WOKWI_SIM ? "WOKWI" : "RC522");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);

#if USE_WOKWI_SIM
  pinMode(BTN1, INPUT_PULLUP);
  pinMode(BTN2, INPUT_PULLUP);
  pinMode(BTN3, INPUT_PULLUP);
#else
  SPI.begin(); rfid.PCD_Init();
#endif

  wifiEnsure();
  Serial.println("Pronto.");
}

void loop(){
  wifiEnsure();

#if USE_WOKWI_SIM
  struct Btn { int pin; const char* id; const char* loc; } M[] = {
    { BTN1, "CNT-1001", "Patio-A" },
    { BTN2, "CNT-1002", "Patio-B" },
    { BTN3, "CNT-1003", "Patio-C" }
  };
  static int last[3]={HIGH,HIGH,HIGH};

  for (int i=0;i<3;i++){
    int cur=digitalRead(M[i].pin);
    if (cur==LOW && last[i]==HIGH){
      String payload = String("{\"containerId\":\"")+M[i].id+
                       "\",\"eventType\":\"RFID_DETECTED\",\"site\":\"PORTO-SP\""+
                       ",\"location\":\""+M[i].loc+"\",\"gpio\":"+M[i].pin+
                       ",\"timestamp\":\""+nowISO()+"\"}";
      bool ok = postEventRaw(payload);
      ledBlink(ok?LED_GREEN:LED_RED, 2);
    }
    last[i]=cur;
  }
  delay(10);

#else
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()){ delay(20); return; }
  String uid = uidHex(rfid.uid);
  String payload = String("{\"containerId\":\"")+uid+
                   "\",\"eventType\":\"RFID_DETECTED\",\"site\":\"PORTO-SP\""+
                   ",\"location\":\"Gate-A\",\"gpio\":-1"+
                   ",\"timestamp\":\""+nowISO()+"\"}";
  bool ok = postEventRaw(payload);
  ledBlink(ok?LED_GREEN:LED_RED, 2);
  rfid.PICC_HaltA(); rfid.PCD_StopCrypto1();
#endif
}