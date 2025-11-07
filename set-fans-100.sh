#!/bin/bash
# Script to set CPU and GPU fans to 100%
# Requires sudo privileges

set -euo pipefail

echo "Setting CPU fans to 100%..."

# Set all PWM fans to manual mode (1) and 100% (255)
for pwm in 1 2 4 5 6; do
    if [ -f "/sys/class/hwmon/hwmon3/pwm${pwm}_enable" ]; then
        echo 1 > "/sys/class/hwmon/hwmon3/pwm${pwm}_enable" 2>/dev/null || true
        echo 255 > "/sys/class/hwmon/hwmon3/pwm${pwm}" 2>/dev/null || true
        echo "  PWM${pwm} set to manual 100%"
    fi
done

echo "Setting GPU fan to 100%..."
# Enable GPU fan control and set to 100%
nvidia-settings -a "[gpu:0]/GPUFanControlState=1" -a "[fan:0]/GPUTargetFanSpeed=100" 2>/dev/null || {
    echo "Warning: GPU fan control may require X server or CoolBits enabled"
}

echo "Done! Fans should now be at 100%"
echo ""
echo "Current status:"
for pwm in 1 2 4 5 6; do
    if [ -f "/sys/class/hwmon/hwmon3/pwm${pwm}_enable" ]; then
        enable=$(cat "/sys/class/hwmon/hwmon3/pwm${pwm}_enable")
        speed=$(cat "/sys/class/hwmon/hwmon3/pwm${pwm}")
        echo "  PWM${pwm}: enable=${enable}, speed=${speed} (${speed}/255 = $((speed*100/255))%)"
    fi
done
nvidia-smi --query-gpu=fan.speed --format=csv 2>/dev/null || echo "  GPU fan: Unable to query"

