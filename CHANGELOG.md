# Changelog

### [CHANGELOG in russian language](./CHANGELOG_RU.md)

### **`Unreleased`**
- **Deployment Readiness**: Backend prepared for [Render](https://render.com). Configuration is now read from environment variables (`HOST`, `PORT`, `DATA_DIR`, `DB_FILE`, `FAL_API_KEY`) with `config.toml` as a fallback for local development.
- **Persistent Storage Layout**: SQLite database and uploaded/generated image folders resolve under `DATA_DIR`, making the service compatible with mounted persistent disks.
- **Build Pipeline**: Added `build` (`tsc`) and `serve` (`node dist/main.js`) npm scripts; the server now binds to `0.0.0.0` by default and accepts the full 1–65535 port range.
- **Reproducible Installs**: Committed `package-lock.json` and removed it from `.gitignore`.
- **Code Quality**: Typo fixes and small cleanup across API handlers, application bootstrap and shared types.

### **`v.0.3.0` from 12.04.2026** (Latest release)
- **AI 3D Generation**: Integrated `fal-ai/trellis` model for high-quality 3D asset generation from single and multiple images.
- **Enhanced Documentation**: Completely rewritten README with detailed API specifications, project structure, and configuration guides.
- **Profile Management**: Added `/api/v1/profile` endpoint to retrieve user data.
- **Improved Security**: Implemented Bearer token authentication for profile access.
- **Bug Fixes**: Fixed several issues in database interaction and error handling.
- **Performance**: Optimized image upload processing and local storage management.

### **`v.0.1.2-alpha` from 09.11.2025**
- The relational database is connected and configured and later must be integrated into new parts of project.
- Added 2 new API paths: `/api/v1/authorize-user` and `/api/v1/register-new-user`.
- Existing code has been optimized and improved, and many non-API-related components have been improved.

### **`v.0.1.1-alpha` from 03.11.2025**
- When making a POST request to the `/api/v1/generate-from-multiple` and `/api/v1/generate-from-single` routes, the `user_id` parameter — a unique user ID — must now be specified in the request parameters.
- Route names have been changed.
- Implemented a basic database structure, with the main part integrated into `/api/v1/generate-from-single`.
- Added saving of necessary parameters to the corresponding database tables.
- Updated and extended parameters used when creating API requests.
- Improved and optimized existing code to increase stability and performance.
