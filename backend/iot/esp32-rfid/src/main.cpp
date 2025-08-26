#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <vector>

// ---------- Pinos ----------
#define BTN1 13
#define BTN2 14
#define BTN3 26
#define LED_GREEN 25
#define LED_RED   33


const char* WIFI_SSID = "Wokwi-GUEST";     
const char* WIFI_PASS = "";
const int   WIFI_CH   = 6;                 


const char* API_URL   = "https://httpbin.org/post";


struct Btn {
  uint8_t pin;
  int lastStable;
  int lastRead;
  unsigned long lastChange;
  const char* containerId;
  const char* location;
} btns[3] = {
  {BTN1, HIGH, HIGH, 0, "CNT-1001", "Patio-A"},
  {BTN2, HIGH, HIGH, 0, "CNT-1002", "Patio-B"},
  {BTN3, HIGH, HIGH, 0, "CNT-1003", "Patio-C"}
};

String siteId = "PORTO-SP";


std::vector<String> pending;
unsigned long lastRetry = 0;


void ledBlink(int pin, int times=1, int on=80, int off=80) {
  for (int i=0;i<times;i++) { digitalWrite(pin,HIGH); delay(on); digitalWrite(pin,LOW); delay(off); }
}

String nowISO() {
  time_t now; time(&now);
  struct tm tm; gmtime_r(&now, &tm);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &tm);
  return String(buf);
}


void wifiReset() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true, true);
  delay(100);
  WiFi.setAutoReconnect(true);
}

void wifiEnsure() {
  if (WiFi.status() == WL_CONNECTED) return;

  wifiReset();
  WiFi.begin(WIFI_SSID, WIFI_PASS, WIFI_CH);

  Serial.print("Conectando WiFi ("); Serial.print(WIFI_SSID); Serial.print(") ");
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi: ");
  Serial.println(WiFi.status()==WL_CONNECTED ? "conectado" : "desconectado");

  if (WiFi.status()==WL_CONNECTED) {
    Serial.print("IP: "); Serial.println(WiFi.localIP());
    configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  }

  
  WiFi.mode(WIFI_STA);
  int n = WiFi.scanNetworks();
  Serial.print("Redes visíveis: "); Serial.println(n);
  for (int i = 0; i < n; i++) {
    Serial.printf("  %d) %s (RSSI %d)\n", i+1, WiFi.SSID(i).c_str(), WiFi.RSSI(i));
  }
}


bool sendPayload(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  int code = http.POST(payload);
  String resp = http.getString(); // só pra log
  http.end();
  Serial.printf("HTTP %d | %s\n", code, resp.length()? resp.c_str() : "(sem corpo)");
  return (code >= 200 && code < 300);
}

bool postEvent(const char* containerId, const char* location, int gpio) {
  String payload = String("{\"containerId\":\"")+containerId+
                   "\",\"eventType\":\"RFID_DETECTED\""
                   ",\"site\":\""+siteId+
                   "\",\"location\":\""+location+
                   "\",\"gpio\":"+String(gpio)+
                   ",\"timestamp\":\""+nowISO()+"\"}";

  Serial.print("POST "); Serial.print(API_URL); Serial.print(" -> ");
  Serial.println(payload);

  wifiEnsure();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Offline: guardando na fila.");
    pending.push_back(payload);
    ledBlink(LED_RED, 1);
    return false;
  }

  bool ok = sendPayload(payload);
  ledBlink(ok ? LED_GREEN : LED_RED, 2);
  if (!ok) pending.push_back(payload);
  return ok;
}


void setup() {
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);

  Serial.begin(115200);
  delay(200);
  Serial.println("BOOT");
  Serial.println("Dica: se S1/S2/S3 ficam sempre =1, gire o botão pra usar o outro lado no GND.");

  for (int i=0;i<3;i++) pinMode(btns[i].pin, INPUT_PULLUP);

  wifiEnsure();
  Serial.println("Pronto. Pressione um botão para simular leitura RFID.");
  ledBlink(LED_GREEN, 3, 60, 60);
}

void loop() {
  const unsigned long DEBOUNCE = 25;

  
  for (int i=0;i<3;i++) {
    int reading = digitalRead(btns[i].pin);
    if (reading != btns[i].lastRead) {
      btns[i].lastChange = millis();
      btns[i].lastRead   = reading;
    }
    if (millis() - btns[i].lastChange > DEBOUNCE) {
      if (reading != btns[i].lastStable) {
        btns[i].lastStable = reading;

       
        Serial.print("Status => S1="); Serial.print(digitalRead(BTN1));
        Serial.print(" S2=");          Serial.print(digitalRead(BTN2));
        Serial.print(" S3=");          Serial.println(digitalRead(BTN3));

        if (reading == LOW) {
          Serial.print("[PRESS] ");
          Serial.print(btns[i].containerId);
          Serial.print(" @ "); Serial.print(btns[i].location);
          Serial.print(" gpio="); Serial.println(btns[i].pin);
          postEvent(btns[i].containerId, btns[i].location, btns[i].pin);
        } else {
          Serial.print("[RELEASE] gpio="); Serial.println(btns[i].pin);
        }
      }
    }
  }

  
  static unsigned long t=0;
  if (millis()-t > 1000) {
    t = millis();
    Serial.print("S1="); Serial.print(digitalRead(BTN1));
    Serial.print(" S2="); Serial.print(digitalRead(BTN2));
    Serial.print(" S3="); Serial.println(digitalRead(BTN3));
  }

 
  if (millis() - lastRetry > 5000) {
    lastRetry = millis();
    wifiEnsure();
    if (WiFi.status() == WL_CONNECTED && !pending.empty()) {
      Serial.printf("Conectado: reenviando %u eventos pendentes...\n", (unsigned)pending.size());
      std::vector<String> left;
      for (auto &p : pending) {
        if (sendPayload(p)) {
          ledBlink(LED_GREEN, 1);
        } else {
          left.push_back(p); // mantém se falhou
        }
      }
      pending.swap(left);
      Serial.printf("Fila restante: %u\n", (unsigned)pending.size());
    }
  }
}
