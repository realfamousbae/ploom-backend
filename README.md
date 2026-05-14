# **ploom-backend**

The server-side component of the Ploom project, providing a robust API for user management and AI-powered 3D model generation from images.

### [README на русском языке](./README_RU.md) | [CHANGELOG](./CHANGELOG.md) | [TODO](./TODO.md)

---

## 🚀 Overview

**ploom-backend** is a Node.js application built with TypeScript that integrates advanced AI models to transform 2D images into 3D assets. It handles user authentication, profile management, and provides a seamless interface for the [fal.ai](https://fal.ai) Trellis-2 model.

### Key Features
- **AI 3D Generation**: Generate high-quality 3D models from single or multiple images.
- **User Management**: Secure registration and authorization.
- **Image Processing**: Handles profile pictures and multi-image uploads using Multer.
- **Persistent Storage**: Uses SQLite for fast and reliable data management.
- **TypeScript First**: Fully typed codebase for better maintainability and developer experience.

---

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [SQLite](https://sqlite.org/) (via `better-sqlite3`)
- **AI Integration**: [fal.ai](https://fal.ai) (Trellis-2 model)
- **File Handling**: [Multer](https://github.com/expressjs/multer)

---

## 📂 Project Structure

```text
├── db/                   # Database schema and SQLite files
├── public/               # Static assets and uploaded images
│   ├── profile_images/   # User profile pictures
│   ├── uploaded_images/  # Images used for 3D generation
│   └── generated_images/ # Local cache for generated results
├── src/                  # Source code
│   ├── api/              # API Route handlers
│   │   └── v1/           # Versioned API endpoints
│   ├── app/              # Core application logic
│   ├── models/           # Database and storage abstractions
│   ├── types/            # TypeScript interfaces and custom errors
│   ├── config.ts         # Configuration loader
│   └── main.ts           # Entry point
├── tests/                # Test suites
└── config.toml           # (Generated) Application configuration
```

---

## ⚙️ Configuration

The project supports two configuration sources, with environment variables taking precedence over the TOML file. This makes it equally suitable for local development and managed deployments (e.g. Render).

### Environment Variables

| Variable | Description | Default |
|:---------|:------------|:--------|
| `HOST` | Hostname to bind the HTTP server to. | `0.0.0.0` |
| `PORT` | Port to listen on (1–65535). Injected automatically by Render. | `3000` |
| `DATA_DIR` | Root directory for writable data (database + uploaded/generated images). Use the mount path of a persistent disk in production. | `./` |
| `DB_FILE` | SQLite database file path. Resolved under `DATA_DIR` when relative. | `db/main.sqlite` |
| `FAL_API_KEY` | API key for [fal.ai](https://fal.ai). **Required.** | — |

When `FAL_API_KEY` is set, the server starts without `config.toml`. Otherwise, on first launch a template `config.toml` is generated and the process exits so you can fill it in.

### `config.toml` (local development fallback)

```toml
[server]
hostname = "localhost"
port = 3000

[database]
file = "db/main.sqlite"
schema = "db/schema.sql"

[api]
key = "your-fal-ai-api-key" # Obtain from https://fal.ai
```

On startup the application creates the runtime directories (`DATA_DIR/public/profile_images`, `uploaded_images`, `generated_images`, and the directory of the SQLite file) automatically.

---

## 📡 API Documentation

### Endpoint Summary

| Path | Method | Description |
|:-----|:------:|:------------|
| `/` | `GET` | API Information & Health Check |
| `/api/v1/authorize-user` | `POST` | Authenticate user |
| `/api/v1/register-new-user` | `POST` | Create a new account |
| `/api/v1/profile` | `GET` | Retrieve user profile data |
| `/api/v1/generate-from-single` | `POST` | Generate 3D from one image |
| `/api/v1/generate-from-multiple` | `POST` | Generate 3D from 1-5 images |

---

### Detailed Specifications

#### 1. **User Authorization**
`POST /api/v1/authorize-user`
- **Query Parameters**:
  - `email` (string): User's email.
  - `password` (string): User's password.
- **Success Response**: `200 OK`
  ```json
  {
    "message": "User successfully authorized. All data is correct.",
    "token": "...",
    "user": { "name": "...", "surname": "...", "email": "..." }
  }
  ```

#### 2. **User Registration**
`POST /api/v1/register-new-user`
- **Query Parameters**: `name`, `surname`, `email`, `password`.
- **Form Data (Body)**:
  - `profile_image` (file, optional): User's avatar.
- **Success Response**: `200 OK`
  ```json
  { "message": "User successfully registered.", "token": "..." }
  ```

#### 3. **User Profile**
`GET /api/v1/profile`
- **Headers**:
  - `Authorization`: `Bearer <token>`
- **Success Response**: `200 OK`
  ```json
  { "name": "...", "surname": "...", "email": "...", "profile_image_path": "..." }
  ```

#### 4. **AI Generation (Single Image)**
`POST /api/v1/generate-from-single`
- **Query Parameters**:
  - `user_id` (number): Unique user ID.
- **Form Data (Body)**:
  - `image` (file): Source image for generation.
- **Success Response**: `200 OK`
  ```json
  {
    "message": "Image generated successfully.",
    "generated_image_url": "https://..."
  }
  ```

#### 5. **AI Generation (Multiple Images)**
`POST /api/v1/generate-from-multiple`
- **Query Parameters**:
  - `user_id` (number): Unique user ID.
- **Form Data (Body)**:
  - `images` (files[]): Array of 1-5 images.
- **Success Response**: `200 OK`
  ```json
  {
    "message": "3D Model generated successfully.",
    "generated_image_url": "https://..."
  }
  ```

---

## 🛠 Installation & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```
   A committed `package-lock.json` is provided for reproducible installs.

2. **Setup Config**:
   Either set the environment variables listed above (at minimum `FAL_API_KEY`), or edit the generated `config.toml`.

3. **Run (Development)**:
   ```bash
   npm start          # ts-node, no build step
   ```

4. **Build & Run (Production)**:
   ```bash
   npm run build      # tsc -> dist/
   npm run serve      # node dist/main.js
   # or as a single command:
   npm run js
   ```

---

## ☁️ Deployment (Render)

The backend is ready to deploy to [Render](https://render.com) as a Web Service.

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run serve`
- **Environment Variables**: set `FAL_API_KEY`. Optionally override `HOST`, `DB_FILE`, etc. `PORT` is injected by Render automatically.
- **Persistent Disk**: attach a disk and set `DATA_DIR` to its mount path (e.g. `/var/data`). The SQLite database and uploaded/generated images will live there and survive redeploys.

The server binds to `0.0.0.0` by default and accepts the full 1–65535 port range, so no extra configuration is required for Render's networking.

---

## 📄 License
This project is licensed under the Apache-2.0 License - see the [LICENSE.txt](LICENSE.txt) file for details.
