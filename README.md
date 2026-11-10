# Key Control Premium · Render

Panel en HTML/CSS/JavaScript con un servidor Node persistente para Render y Firebase Realtime Database. Las keys nuevas usan `Premium_XXXXXXXXX-0000`, duran de 1 segundo a 365 días y quedan sin dispositivo asociado hasta su primer uso.

## Desplegar en Render

1. Sube esta carpeta a un repositorio Git y crea un **Web Service** en Render desde ese repositorio; `render.yaml` incluye la configuración.
2. Agrega estas variables privadas en la configuración del servicio:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: JSON completo de una cuenta de servicio de Firebase.
   - `FIREBASE_DATABASE_URL`: URL de Realtime Database.
   - `ADMIN_API_SECRET`: secreto aleatorio largo para acceder al panel.
3. Despliega y abre la URL del servicio. Pulsa **Conectar** e ingresa `ADMIN_API_SECRET`.

El servicio inicia con `npm start`, expone `/healthz` para la comprobación de salud y barre keys vencidas cada cinco minutos mientras el proceso está activo. Cada carga del panel también elimina las vencidas. La validación de una key expirada la elimina junto con su índice de dispositivo.

## Amarre al primer dispositivo

La primera llamada válida a `/api/key/validate?key=...&deviceId=HWID-...` asocia la key de forma atómica al `deviceId`. Las llamadas siguientes solo reciben `valid: true` si envían el mismo identificador; otra instalación recibe `reason: "device_mismatch"`. El endpoint conserva compatibilidad con las keys `FREE_...` existentes.

El script debe enviar el mismo identificador estable en cada validación. Roblox Luau normal no expone el HWID físico del dispositivo; el script o el entorno que lo ejecuta debe proporcionarlo. Si ese identificador se genera o se puede cambiar desde el cliente, el amarre también se puede suplantar.

## Archivos principales

- `server.js`: servidor Express y limpieza periódica.
- `index.html`, `styles.css`, `app.js`: panel de administración.
- `api/admin/keys.js`: emisión, listado y borrado en Firebase.
- `api/key/validate.js`: validación y amarre atómico al primer uso.
- `render.yaml`: configuración de Render.
- El resto de `api/` y `lib/`: rutas del proyecto fuente.
