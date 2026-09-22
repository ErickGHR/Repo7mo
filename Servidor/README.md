# Servidor de películas

API Express que consulta MongoDB Atlas. Requiere Node.js 22.13 o superior.

## Ejecutar

Desde esta carpeta:

```powershell
npm install
Copy-Item .env.example .env
```

Edita `.env` con la URI de Atlas **Connect > Drivers** y la contraseña del usuario
de base de datos. No pegues el comando `mongosh` ni sus opciones en la URI.
Si `.env` ya existe y está configurado, conserva ese archivo.

```powershell
npm start
```

El servidor escucha en el puerto 3000 después de conectarse a MongoDB.
`npm run dev` reinicia automáticamente al editar el código.

## Configuración

- `MONGODB_URI`: conexión a Atlas; usa codificación URL para caracteres especiales
  en el usuario o contraseña.
- `MONGODB_DB`: por defecto `sample_mflix`.
- `PORT`: por defecto `3000`.

En Atlas, autoriza la IP de la computadora en **Network Access**, crea un usuario
con permiso de lectura y carga los datos de ejemplo `sample_mflix` si no existen.
La colección consultada se llama `movies`.

## Rutas y comprobaciones

- `GET /health`: comprueba MongoDB; responde 200 o 503.
- `GET /movies`: devuelve hasta 100 películas ordenadas por `_id`, con título,
  descripción y póster. El límite evita descargar toda la base de ejemplo.
- `npm test`: prueba las respuestas HTTP, CORS y fallos con una base simulada.
- `npm run check`: revisa la sintaxis del servidor.

En PowerShell puedes comprobar la conexión real con:

```powershell
Invoke-RestMethod http://localhost:3000/health
Invoke-RestMethod http://localhost:3000/movies
```

Para acceder desde el celular, usa la IP local de esta computadora y permite Node.js
en el firewall de la red privada. El archivo `.env` se ignora en Git.
