import serial.tools.list_ports
import serial

def list_ports():
    ports = serial.tools.list_ports.comports()
    print("Available Ports:")
    for port, desc, hwid in ports:
        print(f"{port}: {desc} [{hwid}]")
        
        # Try to open it to see if it's busy
        try:
            s = serial.Serial(port)
            s.close()
            print(f"  -> Status: Available")
        except (OSError, serial.SerialException) as e:
            print(f"  -> Status: BUSY/ACCESS DENIED ({e})")

if __name__ == "__main__":
    list_ports()
