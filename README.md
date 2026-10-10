# BuildPDF - Android App Update & APK Distribution Host

Official static website and update manifest distribution service for **BuildPDF** (developed by **Vaishnav Balpande**), hosted on **Render Static Sites**.

This project provides:
1. **Responsive Branded Landing Page** for **BuildPDF** with dark glassmorphism design, direct **Download APK** button, technical specifications, release changelog, package checksums, and a mobile QR code scanner.
2. **In-App Update Manifest (`/update.json`)** formatted for Android in-app update checkers, pre-configured with **CORS** (`Access-Control-Allow-Origin: *`) and cache-invalidation headers.
3. **Automated Manifest Tools** (`Node.js`, `PowerShell`, `Bash`) to automatically compute SHA-256 hashes and update version metadata with one command.
4. **Security Guardrails** configured via `.gitignore` to prevent committing Android keystores (`*.jks`, `*.keystore`), credentials, or signing keys.

---

## 📁 Project Structure

```text
BuildPDF/
├── .gitignore                    # Protects signing keys (*.jks, *.keystore) and secrets
├── index.html                    # Responsive, branded landing page
├── update.json                   # Android in-app update manifest
├── render.yaml                   # Render Blueprint with static site & CORS headers
├── _headers                      # Alternative static hosting headers file
├── package.json                  # NPM scripts for local testing and manifest automation
├── css/
│   └── styles.css                # Dark mode, glassmorphism, responsive grid styling
├── js/
│   └── app.js                    # Client-side manifest sync, copy tool & QR code
├── downloads/
│   ├── README.md                 # APK folder instructions
│   └── app-release.apk           # Standalone release APK file
└── scripts/
    ├── generate-manifest.js      # Zero-dependency Node.js manifest & SHA-256 updater
    ├── update-release.ps1        # Windows PowerShell manifest & SHA-256 updater
    ├── update-release.sh         # Linux / macOS / CI manifest updater
    └── serve.js                  # Zero-dependency local dev server with CORS simulation
```

---

## ⚙️ Configuration & Placeholders

The site is already branded for **BuildPDF** developed by **Vaishnav Balpande**.

When you deploy to Render, fill in your Render domain:

| Setting | Location | Example Value |
| :--- | :--- | :--- |
| **App Name** | Configured as `BuildPDF` in `index.html` | `BuildPDF` |
| **Developer** | Configured as `Vaishnav Balpande` | `Vaishnav Balpande` |
| **Render Domain** | `update.json` (`apkUrl` field) | `https://buildpdf-updates.onrender.com` |

---

## 📱 Update Manifest Schema (`/update.json`)

The manifest is hosted at the root endpoint `/update.json`:

```json
{
  "versionCode": 1,
  "versionName": "1.0.0",
  "apkUrl": "https://YOUR-RENDER-DOMAIN/downloads/app-release.apk",
  "sha256": "REPLACE_WITH_SHA256",
  "releaseNotes": "Initial release"
}
```

* **`versionCode`** *(integer)*: Internal incrementing build number (e.g., `1`, `2`, `14`). Android apps compare this integer (`remoteVersionCode > localVersionCode`) to detect new releases.
* **`versionName`** *(string)*: User-visible semantic version (e.g., `"1.0.0"`, `"2.1.4"`).
* **`apkUrl`** *(string)*: Public HTTPS URL to download the APK.
* **`sha256`** *(string)*: Lowercase SHA-256 hex checksum of the APK file for tamper verification.
* **`releaseNotes`** *(string)*: Changelog summary displayed in the website and in-app update dialogs.

---

## 🚀 Releasing a New App Update

Whenever you build a new version of your Android app:

### Step 1: Export your signed release APK
In Android Studio:
* Click **Build > Generate Signed Bundle / APK...**
* Select **APK** > Next
* Choose your keystore and key alias
* Select the **release** build variant and click **Create**

*(Or via terminal: `./gradlew assembleRelease`)*

### Step 2: Copy the APK to the `downloads/` directory
Rename or copy the generated APK (typically located at `app/build/outputs/apk/release/app-release.apk`) to:
```text
downloads/app-release.apk
```

### Step 3: Update `update.json` and compute SHA-256

You can do this **automatically** or **manually**:

#### Option A: Automated (Recommended)

**Using Node.js:**
```bash
# Basic (automatically hashes downloads/app-release.apk and updates update.json)
node scripts/generate-manifest.js

# Or specify new release parameters in one command:
node scripts/generate-manifest.js --versionCode 2 --versionName 1.1.0 --notes "Added PDF compression and dark theme" --domain https://YOUR-RENDER-DOMAIN.onrender.com
```

**Using Windows PowerShell:**
```powershell
.\scripts\update-release.ps1 -VersionCode 2 -VersionName "1.1.0" -ReleaseNotes "Added PDF compression" -RenderDomain "https://YOUR-RENDER-DOMAIN.onrender.com"
```

**Using Linux / macOS Bash:**
```bash
chmod +x scripts/update-release.sh
./scripts/update-release.sh downloads/app-release.apk
```

#### Option B: Manual Calculation
If you prefer calculating the checksum manually:

* **Windows PowerShell:**
  ```powershell
  Get-FileHash downloads\app-release.apk -Algorithm SHA256
  ```
* **macOS / Linux:**
  ```bash
  sha256sum downloads/app-release.apk
  # or
  shasum -a 256 downloads/app-release.apk
  ```

Copy the resulting 64-character hash into the `"sha256"` property in `update.json`.

---

## 🌐 Deploying to Render

### Method 1: Using Render Blueprint (`render.yaml`) — Automated

Render Blueprints automatically apply all required custom headers and CORS rules:

1. Push this repository to **GitHub** or **GitLab**.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your Git repository.
5. Render will detect `render.yaml` and configure the **Static Site** with all headers automatically!
6. Click **Apply**.

### Method 2: Manual Static Site Setup via Dashboard

If you prefer setting up the Static Site manually through Render's UI:

1. Click **New +** > **Static Site**.
2. Connect your Git repository.
3. Configure the settings:
   * **Name:** `your-app-updates`
   * **Branch:** `main` (or your default branch)
   * **Build Command:** *(leave empty)*
   * **Publish Directory:** `.`
4. Click **Create Static Site**.

#### Configuring CORS & Headers in the Dashboard:
To ensure your Android app can fetch `/update.json` cross-origin without restriction:
1. In the Render Dashboard, open your Static Site.
2. Go to the **Headers** tab in the left-hand navigation.
3. Click **Add Header Rule** and configure:
   * **Path:** `/update.json`
   * **Header Name:** `Access-Control-Allow-Origin`
   * **Header Value:** `*`
4. Click **Add Header Rule** again for Cache Invalidation:
   * **Path:** `/update.json`
   * **Header Name:** `Cache-Control`
   * **Header Value:** `no-cache, no-store, must-revalidate`
5. *(Optional for APK downloads)*:
   * **Path:** `/downloads/*`
   * **Header Name:** `Access-Control-Allow-Origin`
   * **Header Value:** `*`
6. Click **Save Changes**.

---

## 💻 Local Testing

You can test the website and verify CORS headers locally before deploying:

```bash
# Start local development server on port 3000
npm start
# or: node scripts/serve.js
```

Then verify with curl or in your browser:
* Website: [http://localhost:3000](http://localhost:3000)
* Manifest: [http://localhost:3000/update.json](http://localhost:3000/update.json)
* Test CORS header:
  ```bash
  curl -I http://localhost:3000/update.json
  ```
  Expected output includes:
  ```http
  HTTP/1.1 200 OK
  Access-Control-Allow-Origin: *
  Content-Type: application/json; charset=utf-8
  Cache-Control: no-cache, no-store, must-revalidate
  ```

---

## 🤖 Android In-App Update Implementation Example

Here is a lightweight Kotlin example showing how your Android app can consume `/update.json`:

```kotlin
data class UpdateManifest(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val sha256: String,
    val releaseNotes: String
)

class UpdateChecker(private val context: Context) {
    private val manifestUrl = "https://YOUR-RENDER-DOMAIN/update.json"

    fun checkForUpdates(onUpdateAvailable: (UpdateManifest) -> Unit) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val client = OkHttpClient()
                val request = Request.Builder()
                    .url(manifestUrl)
                    .cacheControl(CacheControl.FORCE_NETWORK) // Prevent stale cached updates
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) return@launch
                    val jsonStr = response.body?.string() ?: return@launch
                    val json = JSONObject(jsonStr)

                    val manifest = UpdateManifest(
                        versionCode = json.getInt("versionCode"),
                        versionName = json.getString("versionName"),
                        apkUrl = json.getString("apkUrl"),
                        sha256 = json.getString("sha256"),
                        releaseNotes = json.getString("releaseNotes")
                    )

                    // Get currently installed app version code
                    val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
                    val currentVersionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        packageInfo.longVersionCode.toInt()
                    } else {
                        @Suppress("DEPRECATION")
                        packageInfo.versionCode
                    }

                    if (manifest.versionCode > currentVersionCode) {
                        withContext(Dispatchers.Main) {
                            onUpdateAvailable(manifest)
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("UpdateChecker", "Failed to check update", e)
            }
        }
    }
}
```

---

## 🔒 Security Best Practices

1. **Never Commit Private Keys:** Your keystore (`*.jks`, `*.keystore`) and passwords must never be stored in this static web repository. The included `.gitignore` automatically excludes them.
2. **Always Enforce HTTPS:** Render automatically issues free SSL/TLS certificates for your site and custom domains. Always use `https://` in `apkUrl`.
3. **Verify Checksums Before Installing:** In your Android app, compute the SHA-256 hash of the downloaded APK file and compare it against `manifest.sha256` before invoking the Android package installer Intent.
