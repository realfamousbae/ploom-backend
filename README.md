# **ploom-backend** - the server part of the Ploom-backend project.

### [README in russian language](./README_RU.md)

### [CHANGELOG since last update](./CHANGELOG.md)

### [Checklist of set and completed project tasks.](./TODO.md)

## Implemented API functionality
Currently, saving of images transmitted with a POST-request to a `./public/images/` for storing public images and deploying a sqlite database has been implemented. POST-requests accepts only `.jpg`, `.jpeg`, or `.png` extension.

|  Path   | Method | Any type of request data | Returns
|:-------:|:------:|:----------------------------------------------------------------------------:|:----:|
| `/` | **GET** | None. | `200 OK` code + `json`-dictionary about using the **POST** method in the correct way. |
| `/api/v1/authorize-user` | **POST** | In the `params` block, the `email` key and `password` of the authorized user must be string values. | `200 OK` code + `json`-dictionary with a message indicating successful completion if the transferred user data is correct. / `500 Bad Request` if transmitted data is incorrect or the user with such data does not exist in the database. |
| `/api/v1/generate-from-single` | **POST** | In the `params block`, the `user_id` key **must be a numeric value** - the unique user ID. In the `body` block, the `image` key's value **must be a file**.| `200 OK` code if image provided and everything is ok. / `500 Bad Request` if something went wrong. |
| `/api/v1/generate-from-multiple` | **POST** | In the `params block`, the `user_id` key **must be a numeric value** - the unique user ID. In the `body` block, the `images` key must be an array containing **1-5 files**.  | `200 OK` code image provided and everything is ok. / `500 Bad Request` if something went wrong. |
| `/api/v1/register-new-user` | **POST** | In the `params` block, the keys `name`, `surname`, `email` and `password` must be string values. Optionally, in the `body` block, the value of the `profile_image` key **must be a file**. | `200 OK` code + `json`-dictionary with a message indicating successful completion if the transferred user data is correct. / `500 Bad Request` if a user with this data already exists. |

In all cases, the response to the request will be a `JSON` dictionary that will **ALWAYS, WITHOUT EXCEPTION**, contain a `"message"` key (`{ "message": "..." }`) describing the request result. Even if something goes wrong and an unexpected exception occurs, the sender will be able to view the server message.

## Build and running
First of all make sure you have the [latest version of Node.js](https://nodejs.org/en) installed on your PC. If everything is like this, use the command in the root of project to install all dependencies:
```bat
npm i 
```

### The way to run directly is with TypeScript and `ts-node`:
```bat 
npm start
```

### To transpile source code to JavaScript and run it through Node.js:
```bat
npm run js
```

### To just transpile the source code to JavaScript, use:
```bash
npx tsc
```
Output files will be located in `./dist` folder.

###### Detailed documentation and code comments will be compiled later.
