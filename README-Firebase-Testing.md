# Firebase Local Development Guide

This guide explains how to set up, run, and debug Firebase services locally using the Firebase Emulator Suite and VS Code.

---

## ✅ 1. Install Firebase CLI

Install the Firebase CLI globally:

```bash
npm install -g firebase-tools
```

Verify the installation:

```bash
firebase --version
```

---

## ✅ 2. Initialize Firebase Emulators

From your project root:

```bash
firebase init emulators
```

Choose the emulators you need:
- **Functions**
- **Firestore**
- **Auth** (optional)
- **Storage** (optional)

Set ports when prompted or accept defaults.

Example `firebase.json` configuration:

```json
{
  "emulators": {
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "auth": { "port": 9099 },
    "storage": { "port": 9199 }
  }
}
```

---

## ✅ 3. Start Emulators

Start all configured emulators:

```bash
firebase emulators:start
```

Start only specific emulators:

```bash
firebase emulators:start --only functions,firestore,storage
```

---

## ✅ 4. Connect Your App to Emulators

### Firestore
```js
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
const db = getFirestore();
connectFirestoreEmulator(db, "localhost", 8080);
```

### Storage
```js
import { getStorage, connectStorageEmulator } from "firebase/storage";
const storage = getStorage();
connectStorageEmulator(storage, "localhost", 9199);
```

---

## ✅ 5. Debug Functions in VS Code

### Create `.vscode/launch.json`
Inside your project root:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Firebase Functions",
      "program": "${workspaceFolder}/node_modules/firebase-tools/lib/bin/firebase.js",
      "args": ["emulators:start", "--only", "functions"],
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

### Install Firebase Tools Locally
(Required for VS Code debugger)

```bash
npm install --save-dev firebase-tools
```

---

## ✅ 6. Start Debugging

- Open VS Code
- Go to **Run & Debug** (`Ctrl + Shift + D`)
- Select **Debug Firebase Functions**
- Press ▶️ **Start Debugging**
- Add breakpoints and inspect variables using hover or **Debug Console**

---

## ✅ 7. Check Logs

- Logs appear in the **Debug Console** while debugging
- You can also use `console.log()` and `console.error()` in your functions

---

## ✅ 8. Stop Emulators

When finished:
- **In Terminal:** `Ctrl + C` then confirm `Y`
- **In VS Code:** Click **Stop (■)** or press `Shift + F5`

If a process gets stuck, kill it:
- **Windows:**
  ```bash
  netstat -ano | findstr :5001
  taskkill /PID [PID] /F
  ```
- **Mac/Linux:**
  ```bash
  lsof -i :5001
  kill -9 [PID]
  ```

---

## ✅ 9. Handle AI JSON Responses (Optional)

When parsing OpenAI responses that should be JSON, remove markdown wrappers:

```js
let content = completion.choices[0].message.content?.trim() ?? '';

if (content.startsWith('```')) {
  content = content.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
}

const aiResponse = JSON.parse(content);
```

---

### ✅ Done! Your Firebase project can now run **locally**, support **debugging**, and emulate **Firestore, Storage, and Functions**.

---
