# 9Router CodeBuddy Fix

Fix for **Tencent CodeBuddy** (`cbai/*`, `codebuddy-intl`, `codebuddy-cn`) integration in [9router](https://github.com/decolua/9router).

Resolves **HTTP 503 / 400 Error 11128**:
```json
{
  "code": 11128,
  "msg": "request illegal",
  "displayMsg": { "en": "Request blocked. Please send it again" },
  "displayTips": { 
    "en": "This call failed channel verification, possibly because it was not sent from an official client. Please resend from the official client." 
  }
}
```

---

## 🔍 Root Cause (Penyebab Masalah)

Server Tencent CodeBuddy mewajibkan header verifikasi channel IDE resmi dan pelacakan sesi percakapan unik per-request (`X-Conversation-ID`, `X-Conversation-Request-ID`, `X-Request-Trace-Id`, `b3` tracing, `X-Domain`, `X-Agent-Intent`, dll.).

Secara default, instalasi resmi 9router belum menyertakan header-header verifikasi ini pada executor CodeBuddy (`CodeBuddyIntlExecutor` & `CodeBuddyExecutor`), sehingga Tencent menganggap panggilan API tersebut tidak sah (*channel verification failed*).

Script patch ini secara otomatis:
1. Mendeteksi lokasi instalasi 9router di sistem Anda (Linux VPS, Windows, macOS, atau Docker container).
2. Menemukan file chunk webpack executor CodeBuddy yang tepat (`super("codebuddy-intl")`).
3. Membuat backup otomatis file asli (`.bak`).
4. Menginjeksi metode `buildHeaders()` lengkap dengan generator UUID & tracing b3.
5. Memverifikasi sintaks kode hasil patch agar 9router tetap aman dan stabil.

---

## 🐳 Cara Pemasangan di Docker (Paling Umum di VPS)

Jika 9router Anda berjalan di dalam Docker container (seperti image `decolua/9router`):

```bash
git clone https://github.com/ajiazhar/9router-codebuddy-fix.git
cd 9router-codebuddy-fix
docker cp patch.js 9router:/tmp/patch.js
docker exec -it 9router node /tmp/patch.js
docker restart 9router
```

---

## 🚀 Cara Pemasangan di Linux VPS (Non-Docker / Standalone)

```bash
git clone https://github.com/ajiazhar/9router-codebuddy-fix.git
cd 9router-codebuddy-fix
node patch.js
```

Restart service 9router di VPS:
* **Jika menggunakan PM2:**
  ```bash
  pm2 restart 9router
  ```
* **Jika menggunakan Systemd:**
  ```bash
  sudo systemctl restart 9router
  ```

---

## 💻 Cara Pemasangan di Windows

Buka Command Prompt atau PowerShell:
```powershell
git clone https://github.com/ajiazhar/9router-codebuddy-fix.git
cd 9router-codebuddy-fix
node patch.js
```
Restart aplikasi 9router setelah patch berhasil.

---

## 🔄 Cara Rollback (Restore)

Jika ingin membatalkan patch dan kembali ke file bawaan original:
```bash
node restore.js
```
Lalu restart 9router.

---

## ⚠️ Catatan Pembaruan 9router (`npm update` / Docker pull)

Jika suatu saat container atau package 9router diperbarui ke versi baru, npm/docker akan menimpa file chunk dengan versi default. Cukup jalankan ulang script patch di atas untuk mengaktifkan kembali kodenya.

---

## 📄 License
MIT
