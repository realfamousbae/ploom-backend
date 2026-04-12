# Changelog

### [CHANGELOG in russian language](./CHANGELOG_RU.md)

### **`v.0.3.0` from 21.05.2026** (Current)
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
