/*
  EcoRide Bangalore - Sensor Node
  Board: Arduino UNO / ESP32
  Sensors: 
    - MQ-135 (Analog A0) for Air Quality
    - HC-SR04 (Trig 9, Echo 10) for Vehicle Counting
  
  Output: JSON string over Serial (Baud 9600)
  Format: {"aqi": 120, "vehicle_count": 5}
*/

const int PIN_MQ135 = A0;
const int PIN_TRIG = 9;
const int PIN_ECHO = 10;

int vehicleCount = 0;
unsigned long lastSendTime = 0;
const long INTERVAL = 5000; // Send data every 5 seconds

void setup() {
  Serial.begin(9600);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  
  // Warmup delay
  delay(1000);
}

void loop() {
  // 1. Vehicle Counting (Simple distance threshold)
  long duration, distance;
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  
  duration = pulseIn(PIN_ECHO, HIGH);
  distance = (duration / 2) / 29.1; // cm
  
  // If object detected within 200cm, count it (debounce needed in real world)
  if (distance > 0 && distance < 200) {
    vehicleCount++;
    delay(500); // Simple debounce
  }

  // 2. Send Data Periodically
  unsigned long currentMillis = millis();
  if (currentMillis - lastSendTime >= INTERVAL) {
    int aqiValue = analogRead(PIN_MQ135);
    
    // Create JSON string
    // Send data in format: Vehicles:5,Air:120
    Serial.print("Vehicles:");
    Serial.print(vehicleCount);
    Serial.print(",Air:");
    Serial.println(aqiValue);
    
    // Reset counter for next window
    vehicleCount = 0;
    lastSendTime = currentMillis;
  }
}
