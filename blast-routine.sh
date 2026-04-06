#!/bin/bash

# daily_curl.sh - Script untuk menjalankan curl request harian
# Tanggal: $(date +"%Y-%m-%d %H:%M:%S")

# Konfigurasi
URL="https://intelixapp.ecentrix.net:8443/pmapi/api/v1/data-blast"  # Ganti dengan URL yang diinginkan
LOG_FILE="/home/ecentrix/project_managent/blast-logs/daily_curl.log"
MAX_TIMEOUT=30

# Fungsi logging
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Membuat direktori log jika belum ada
mkdir -p "$(dirname "$LOG_FILE")"

log_message "Starting daily curl request..."

# Jalankan curl request dengan error handling
curl_output=$(curl -s \
    --max-time "$MAX_TIMEOUT" \
    --connect-timeout 10 \
    --retry 3 \
    --retry-delay 5 \
    --write-out "HTTP_CODE:%{http_code};TIME_TOTAL:%{time_total}" \
    --output /tmp/curl_response_$(date +%s).tmp \
    "$URL" 2>&1)

curl_exit_code=$?

# Cek hasil curl
if [ $curl_exit_code -eq 0 ]; then
    log_message "SUCCESS - Curl request completed successfully"
    log_message "Response: $curl_output"
else
    log_message "ERROR - Curl request failed with exit code: $curl_exit_code"
    log_message "Error output: $curl_output"
fi

# Cleanup temporary files older than 1 day
find /tmp -name "curl_response_*.tmp" -mtime +1 -delete 2>/dev/null

log_message "Daily curl request finished"

# =====================================
# SETUP CRONTAB
# =====================================
# Untuk mengatur jadwal harian jam 09:00, jalankan perintah:
# crontab -e
# 
# Kemudian tambahkan baris berikut:
# 0 9 * * * /home/user/daily_curl.sh
#
# Atau gunakan script setup otomatis di bawah ini:

setup_crontab() {
    echo "Setting up crontab for daily execution at 09:00..."
    
    # Dapatkan path absolut script ini
    SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
    
    # Backup crontab yang ada
    crontab -l > /tmp/crontab_backup_$(date +%s) 2>/dev/null || true
    
    # Tambahkan job baru ke crontab (jika belum ada)
    (crontab -l 2>/dev/null | grep -v "$SCRIPT_PATH"; echo "0 9 * * * $SCRIPT_PATH") | crontab -
    
    echo "Crontab updated successfully!"
    echo "Current crontab entries:"
    crontab -l
}

# Uncomment baris di bawah untuk setup otomatis crontab
if ! crontab -l 2>/dev/null | grep -q "$(basename "$0")"; then
    setup_crontab
fi