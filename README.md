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
1. Mendeteksi lokasi instalasi 9router di sistem Anda (Linux VPS / Windows / macOS).
2. Menemukan file chunk webpack executor CodeBuddy.
3. Membuat backup otomatis file asli (`.bak`).
4. Menginjeksi metode `buildHeaders()` lengkap dengan generator UUID & tracing b3.
5. Memverifikasi sintaks kode hasil patch agar 9router tetap aman dan stabil.

---

## 🚀 Cara Pemasangan di VPS (Linux / Ubuntu / Debian)

### 1. Masuk ke VPS dan Clone Repository
```bash
git clone https://github.com/ajiazhar/9router-codebuddy-fix.git
cd 9router-codebuddy-fix
```

### 2. Jalankan Script Patch
```bash
node patch.js
```

*Jika instalasi 9router Anda berada di path non-standar, Anda bisa menyebutkan path-nya secara langsung:*
```bash
node patch.js /path/to/node_modules/9router
```

### 3. Restart 9router di VPS Anda
Tergantung cara Anda menjalankan 9router:

* **Jika menggunakan PM2:**
  ```bash
  pm2 restart 9router
  # atau
  pm2 restart all
  ```

* **Jika menggunakan Systemd Service:**
  ```bash
  sudo systemctl restart 9router
  ```

* **Jika dijalankan manual di terminal / screen / tmux:**
  Hentikan proses (`Ctrl + C`), lalu jalankan kembali:
  ```bash
  9router
  ```

---

## 💻 Cara Pemasangan di Windows

Buka Command Prompt atau PowerShell, lalu jalankan:

```powershell
git clone https://github.com/<username>/9router-codebuddy-fix.git
cd 9router-codebuddy-fix
node patch.js
```

Restart 9router setelah patch berhasil.

---

## 🔄 Cara Rollback / Mengembalikan ke Asli (Restore)

Jika ingin membatalkan patch dan kembali ke file bawaan:
```bash
node restore.js
```
Lalu restart 9router.

---

## ⚠️ Catatan Penting Mengenai Pembaruan 9router (`npm update`)

Setiap kali Anda memperbarui 9router via npm:
```bash
npm update -g 9router
```
NPM akan menimpa file chunk dengan versi resmi terbaru. Jika setelah update muncul error 11128 kembali, Anda cukup menjalankan ulang:
```bash
node patch.js
```
dan restart 9router.

---

## 📄 License
MIT
