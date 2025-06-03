# Script: update-ngrok-env.ps1
# Tự động cập nhật VNPAY_RETURN_URL trong .env với link ngrok mới nhất

# Chạy ngrok ở cổng 3000 (nền, nếu chưa chạy)
Start-Process -NoNewWindow -FilePath "ngrok" -ArgumentList "http 3000"
Start-Sleep -Seconds 3

# Lấy public URL của ngrok
$ngrokApi = "http://127.0.0.1:4040/api/tunnels"
$ngrokUrl = ""
try {
    $tunnels = Invoke-RestMethod $ngrokApi
    $ngrokUrl = $tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -ExpandProperty public_url
} catch {
    Write-Host "Không lấy được URL ngrok. Hãy chắc chắn ngrok đã chạy và cổng 4040 mở."
    exit 1
}

if ($ngrokUrl -eq "") {
    Write-Host "Không tìm thấy public_url của ngrok."
    exit 1
}

# Cập nhật .env
$envPath = ".env"
if (Test-Path $envPath) {
    (Get-Content $envPath) -replace 'VNPAY_RETURN_URL=.*', "VNPAY_RETURN_URL=$ngrokUrl/payment/result" | Set-Content $envPath
} else {
    Set-Content $envPath "VNPAY_RETURN_URL=$ngrokUrl/payment/result"
}

Write-Host "Đã cập nhật VNPAY_RETURN_URL thành $ngrokUrl/payment/result"

# Gợi ý khởi động lại server
Write-Host "Hãy khởi động lại server để cấu hình mới có hiệu lực!"
