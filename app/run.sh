IP_ADDR=$(cmd.exe /c ipconfig | grep -A 7 "Wireless\ LAN\ adapter\ Wi-Fi:" | grep "IPv4" |awk -F: '{print $2}')
IP_ADDR=$(echo "$IP_ADDR" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
sed -i 's/^EXPO_PUBLIC_IP_ADDRESS="[^"]*"/EXPO_PUBLIC_IP_ADDRESS="'"$IP_ADDR"'"/' .env
echo $IP_ADDR " should equal the one printed on flask"


