# Tienda de Vehículos (Frontend)

Frontend en React + Vite (TS) listo para conectarse a un backend vía API.

## Scripts
- `npm i`
- `npm run dev`

## Backend esperado (proxy por Vite)
- `/api/filters`
- `/api/vehicles` (acepta query de filtros)
- `/api/vehicles/:id`
- `/api/vehicles/:id/related`
- `/api/blogs`
- `/api/blogs/:id`

Puedes cambiar la base URL creando `.env` con:
```
VITE_API_URL=http://localhost:3001
```
Si no lo defines, se usa el proxy de Vite a `http://localhost:3001`.
