# **ploom-backend**

Серверная часть проекта Ploom, предоставляющая API для управления пользователями и генерации 3D-моделей на основе ИИ из изображений.

### [README in English](./README.md) | [CHANGELOG](./CHANGELOG.md) | [TODO](./TODO.md)

---

## 🚀 Обзор

**ploom-backend** — это приложение на Node.js, написанное на TypeScript, которое интегрирует передовые модели ИИ для преобразования 2D-изображений в 3D-объекты. Оно обеспечивает аутентификацию пользователей, управление профилями и удобный интерфейс для работы с моделью Trellis от [fal.ai](https://fal.ai).

### Основные возможности
- **Генерация 3D через ИИ**: Создание высококачественных 3D-моделей из одного или нескольких изображений.
- **Управление пользователями**: Безопасная регистрация и авторизация.
- **Обработка изображений**: Загрузка аватаров и наборов изображений для генерации с помощью Multer.
- **Постоянное хранение данных**: Использование SQLite для быстрого и надежного управления данными.
- **Разработка на TypeScript**: Полностью типизированная кодовая база для удобства поддержки и разработки.

---

## 🛠 Технологический стек

- **Среда выполнения**: [Node.js](https://nodejs.org/)
- **Язык**: [TypeScript](https://www.typescriptlang.org/)
- **Фреймворк**: [Express.js](https://expressjs.com/)
- **База данных**: [SQLite](https://sqlite.org/) (через `better-sqlite3`)
- **Интеграция ИИ**: [fal.ai](https://fal.ai) (модель Trellis)
- **Загрузка файлов**: [Multer](https://github.com/expressjs/multer)

---

## 📂 Структура проекта

```text
├── db/                   # Схема базы данных и файлы SQLite
├── public/               # Статические файлы и загруженные изображения
│   ├── profile_images/   # Аватары пользователей
│   ├── uploaded_images/  # Изображения для генерации 3D
│   └── generated_images/ # Локальный кэш результатов
├── src/                  # Исходный код
│   ├── api/              # Обработчики API
│   │   └── v1/           # Версионированные эндпоинты
│   ├── app/              # Ядро приложения
│   ├── models/           # Абстракции БД и хранилища
│   ├── types/            # Типы TypeScript и кастомные ошибки
│   ├── config.ts         # Загрузчик конфигурации
│   └── main.ts           # Точка входа
├── tests/                # Тесты
└── config.toml           # (Генерируемый) Файл конфигурации
```

---

## ⚙️ Конфигурация

Проект использует файл `config.toml` для настроек среды. Если файл отсутствует, он будет автоматически создан при первом запуске.

### Структура `config.toml`:
```toml
[server]
hostname = "localhost"
port = 3000

[database]
file = "db/main.sqlite"
schema = "db/schema.sql"

[api]
key = "vash-fal-ai-api-key" # Получите на https://fal.ai
```

---

## 📡 Документация API

### Список эндпоинтов

| Путь | Метод | Описание |
|:-----|:------:|:------------|
| `/` | `GET` | Информация об API и проверка работоспособности |
| `/api/v1/authorize-user` | `POST` | Авторизация пользователя |
| `/api/v1/register-new-user` | `POST` | Регистрация нового аккаунта |
| `/api/v1/profile` | `GET` | Получение данных профиля |
| `/api/v1/generate-from-single` | `POST` | Генерация 3D из одного фото |
| `/api/v1/generate-from-multiple` | `POST` | Генерация 3D из 1-5 фото |

---

### Подробные спецификации

#### 1. **Авторизация пользователя**
`POST /api/v1/authorize-user`
- **Параметры запроса (Query)**:
  - `email` (string): Email пользователя.
  - `password` (string): Пароль.
- **Успешный ответ**: `200 OK`
  ```json
  {
    "message": "User successfully authorized. All data is correct.",
    "token": "...",
    "user": { "name": "...", "surname": "...", "email": "..." }
  }
  ```

#### 2. **Регистрация пользователя**
`POST /api/v1/register-new-user`
- **Параметры запроса (Query)**: `name`, `surname`, `email`, `password`.
- **Данные формы (Body)**:
  - `profile_image` (файл, опционально): Аватар пользователя.
- **Успешный ответ**: `200 OK`
  ```json
  { "message": "User successfully registered.", "token": "..." }
  ```

#### 3. **Профиль пользователя**
`GET /api/v1/profile`
- **Заголовки**:
  - `Authorization`: `Bearer <token>`
- **Успешный ответ**: `200 OK`
  ```json
  { "name": "...", "surname": "...", "email": "...", "profile_image_path": "..." }
  ```

#### 4. **Генерация ИИ (одно изображение)**
`POST /api/v1/generate-from-single`
- **Параметры запроса (Query)**:
  - `user_id` (number): ID пользователя.
- **Данные формы (Body)**:
  - `image` (файл): Исходное изображение.
- **Успешный ответ**: `200 OK`
  ```json
  {
    "message": "Image generated successfully.",
    "generated_image_url": "https://..."
  }
  ```

#### 5. **Генерация ИИ (несколько изображений)**
`POST /api/v1/generate-from-multiple`
- **Параметры запроса (Query)**:
  - `user_id` (number): ID пользователя.
- **Данные формы (Body)**:
  - `images` (файлы[]): Массив от 1 до 5 изображений.
- **Успешный ответ**: `200 OK`
  ```json
  {
    "message": "3D Model generated successfully.",
    "generated_image_url": "https://..."
  }
  ```

---

## 🛠 Установка и запуск

1. **Установка зависимостей**:
   ```bash
   npm install
   ```

2. **Настройка конфигурации**:
   Отредактируйте сгенерированный `config.toml`, добавив ваш API ключ `fal.ai`.

3. **Запуск (Разработка)**:
   ```bash
   npm start
   ```

4. **Сборка и запуск (Production)**:
   ```bash
   npm run js
   ```

---

## 📄 Лицензия
Этот проект лицензирован под лицензией Apache-2.0 — подробности в файле [LICENSE.txt](LICENSE.txt).
