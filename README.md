# TarinVibes 🦇

> La comunidad volvió, con otras vibes.

Homenaje no oficial a la comunidad estilo Taringa, construido desde cero para aprender React + TypeScript.

**No afiliado a Taringa.**

## ✨ Qué hace

- **Feed de comunidad** con posts por categoría
- **Crear post** con título, cuerpo y categoría
- **Votar** con puntos estilo Taringa (1 voto por usuario por post)
- **Comentarios** en cada post, guardados
- **Borrar** posts
- **Filtrar** por categoría: Música / Gatos / Tecnología / Humor / Vida / Gaming
- **Buscar** por título
- **Ordenar** por más recientes o más votados
- **Login simulado** - cambiar entre Lii, Mica y Tomi
- **Persistencia** con localStorage, como si fuera una base de datos

## 🛠️ Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- localStorage como capa de datos
- Arquitectura: `types` / `usePosts` (lógica) / `PostCard` (UI) / `App` (layout)

## 📁 Estructura

src/
data/
types.ts -> Categoria, User, Post, Comentario
usePosts.ts -> SEED, guardar, votar, agregar, borrar, comentar
components/
PostCard.tsx -> Tarjeta de cada post + comentarios
App.tsx -> Layout, filtros, crear post, feed



## 🚀 Cómo correrlo

```bash
npm install
npm run dev
















