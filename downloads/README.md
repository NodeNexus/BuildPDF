# Downloads Directory

Place your production-signed Android APK here.

### Default File Name
The default file name expected by `update.json` and the website is:
`app-release.apk`

Full path relative to site root:
`/downloads/app-release.apk`

### Replacing the APK
1. Build your signed release APK in Android Studio (`Build > Generate Signed Bundle / APK... > APK > release`) or via Gradle:
   ```bash
   ./gradlew assembleRelease
   ```
2. Copy the resulting APK file (usually from `app/build/outputs/apk/release/app-release.apk`) into this `downloads/` directory.
3. Compute the SHA-256 checksum and update `update.json` (you can use `scripts/update-release.ps1` on Windows or `node scripts/generate-manifest.js`).
4. Commit and push to Git to deploy to Render.
