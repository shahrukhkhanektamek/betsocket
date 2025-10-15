#include <WiFi.h>
#include <SocketIOclient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

const char* serverHost = "192.168.1.100"; // आपके Node.js server का IP
const int serverPort = 3000;

// Wheel motor pin
const int motorPin = 5; // GPIO5, change as per your hardware

// Socket.IO client
SocketIOclient socket;

bool spinning = false;
int targetNumber = -1;

// Function to start motor
void startWheelMotor() {
  analogWrite(motorPin, 200); // PWM speed 0-255, adjust
  spinning = true;
}

// Function to stop motor smoothly
void stopWheelMotor() {
  for (int speed=200; speed>=0; speed-=5) {
    analogWrite(motorPin, speed);
    delay(50);
  }
  spinning = false;
}

// Socket event handlers
void onStartWheel(String payload) {
  Serial.println("🎡 Start command received from server");
  startWheelMotor();
}

void onManualStop(String payload) {
  Serial.print("🛑 Stop command received: ");
  Serial.println(payload);
  targetNumber = payload.toInt(); // Number 0-9

  // Stop motor smoothly
  stopWheelMotor();
  Serial.print("Wheel stopped at number: ");
  Serial.println(targetNumber);
}

void setup() {
  Serial.begin(115200);
  pinMode(motorPin, OUTPUT);
  analogWrite(motorPin, 0);

  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Connect to Socket.IO server
  socket.begin(serverHost, serverPort);
  socket.on("startWheel", onStartWheel);
  socket.on("manualStop", onManualStop);

  Serial.println("Socket.IO client started");
}

void loop() {
  socket.loop(); // keep socket alive

  // Optional: send status updates periodically
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 1000) {
    String status = spinning ? "Wheel spinning" : "Wheel idle";
    socket.emit("statusUpdate", status);
    lastUpdate = millis();
  }
}
