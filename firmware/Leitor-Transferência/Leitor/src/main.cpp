#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SPI.h>
#include <MFRC522.h>

// --- Configuração dos Pinos ---
#define BUTTON_PIN 4
#define VOLTAGE_PIN 34
#define RFID_SS_PIN 26
#define RFID_RST_PIN 27

// --- Objetos dos Módulos ---
Adafruit_SSD1306 display(128, 64, &Wire, -1);
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);

// --- Controle de Estados da Interface ---
enum State { BOOTING, WAITING_FOR_BUTTON, READING_TAG, SHOWING_SUCCESS };
State currentState = BOOTING;

// ======================================================================
// --- FUNÇÕES DE LÓGICA E DADOS ---
// ======================================================================

float lerVoltagemBateria() {
  int valorADC = analogRead(VOLTAGE_PIN);
  if (valorADC < 100) return 0.0;
  float voltagemNoPino = valorADC * (3.3 / 4095.0);
  return voltagemNoPino * 2.0;
}

String getDeviceId() {
  #ifdef WOKWI
    return "HANDHELD-READER-01";
  #else
    uint8_t baseMac[6];
    esp_read_mac(baseMac, ESP_MAC_WIFI_STA);
    char deviceId[18];
    sprintf(deviceId, "%02X:%02X:%02X:%02X:%02X:%02X", baseMac[0], baseMac[1], baseMac[2], baseMac[3], baseMac[4], baseMac[5]);
    return String(deviceId);
  #endif
}

void sendScanEvent(String tagId) {
  String deviceId = getDeviceId();
  float batteryVoltage = lerVoltagemBateria();

  String jsonString = "{";
  jsonString += "\"deviceId\":\"" + deviceId + "\",";
  jsonString += "\"eventType\":\"scan\",";
  jsonString += "\"timestamp\":\"" + String(millis()) + "\",";
  jsonString += "\"payload\":{\"tagId\":\"" + tagId + "\"},";
  jsonString += "\"batteryVoltage\":" + String(batteryVoltage);
  jsonString += "}";

  Serial.println("\n--- ENVIANDO EVENTO DE SCAN PARA API ---");
  Serial.println(jsonString);
}

// ======================================================================
// --- FUNÇÕES DE EXIBIÇÃO ---
// ======================================================================

void displayBootScreen() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(15, 25);
  display.print("Leitor");
  display.setCursor(20, 45);
  display.print("Fluxum");
  display.display();
}

void displayHomeScreen() {
  float batteryVoltage = lerVoltagemBateria();
  bool isConnected = false; 

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.print("Bat: ");
  display.print(batteryVoltage, 1);
  display.print("V");

  display.setCursor(80, 0);
  display.print("Rede: ");
  if (isConnected) {
    display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
    display.print(" OK ");
  } else {
    display.print(" X ");
  }
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(12, 30);
  display.println("Clique no botao para");
  display.setCursor(22, 45);
  display.println("iniciar a leitura");

  display.display();
}

void displayReadingScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(15, 15);
  display.println("Leitura iniciada,");
  display.setCursor(10, 35);
  display.println("aproxime o leitor");
  display.setCursor(25, 50);
  display.println("da tag...");
  display.display();
}

void displaySuccessScreen(String tagId) {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  
  display.setCursor(10, 10);
  display.print("Leitura");
  display.setCursor(5, 30);
  display.print("Concluida!");

  display.setTextSize(1);
  display.setCursor(0, 55);
  display.print("ID: ");
  display.println(tagId);

  display.display();
}

// ======================================================================
// --- FUNÇÕES PRINCIPAIS (CORRIGIDAS) ---
// ======================================================================

void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(VOLTAGE_PIN, INPUT);

  SPI.begin();
  mfrc522.PCD_Init();
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("Falha ao iniciar display OLED"));
    for(;;);
  }
  
  // 1. Mostra a tela de Boot
  displayBootScreen();
  delay(3000); // Espera 3 segundos
  
  // 2. Transição para o próximo estado ANTES de entrar no loop
  currentState = WAITING_FOR_BUTTON;
}

void loop() {
  // --- CÓDIGO DE DEPURAÇÃO DO BOTÃO (O "DEDO-DURO") ---
  int estadoDoBotao = digitalRead(BUTTON_PIN);

  // ----------------------------------------------------

  switch (currentState) {
    case WAITING_FOR_BUTTON:
      displayHomeScreen();
      // Agora verificamos a variável que lemos no início do loop
      if (estadoDoBotao == LOW) {
        currentState = READING_TAG;
        delay(200); // Debounce
      }
      break;

    case READING_TAG:
    { 
      displayReadingScreen();
      unsigned long startTime = millis();
      bool tagLida = false;
      while (millis() - startTime < 5000) { // Tenta ler por 5 segundos
        if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
          String tagId = "";
          for (byte i = 0; i < mfrc522.uid.size; i++) {
            if (mfrc522.uid.uidByte[i] < 0x10) tagId += "0";
            tagId += String(mfrc522.uid.uidByte[i], HEX);
          }
          tagId.toUpperCase();
          
          displaySuccessScreen(tagId);
          sendScanEvent(tagId);
          
          tagLida = true;
          break; 
        }
      }
      
      // Após a tentativa de leitura (bem-sucedida ou não), 
      // muda para o estado de exibir o resultado.
      currentState = SHOWING_SUCCESS;
      // Se não leu nenhuma tag, a tela de sucesso não mostrará ID, 
      // mas ainda esperamos para o usuário ver a tela de "lendo".
      delay(4000); 
      break;
    }

    case SHOWING_SUCCESS:
      currentState = WAITING_FOR_BUTTON;
      break;
  }
  
  delay(100); // Adiciona uma pequena pausa para estabilidade
}