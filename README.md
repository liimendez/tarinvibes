# TarinVibes 🦇

> La comunidad volvió, con otras vibes.

Red social en progreso con React + TypeScript + Supabase.

**Demo en vivo:** https://tarinvibes.vercel.app

## ✨ Qué hace

- **Auth real** con Supabase: registro, login, recuperar contraseña
- **Perfiles editables:** nombre, username, avatar, bio, ciudad y película favorita
- **Crear, editar y borrar posts** (solo el dueño puede editar / borrar)
- **Comentarios** guardados en base de datos
- **Votos:** 1 voto por persona, si votás de nuevo te lo saca
- **Filtrar** por categoría: Música / Gatos / Tecnología / Humor / Vida / Gaming
- **Filtrar por tags** clicables
- **Buscar** por título
- **Ordenar** por más recientes o más votados
- **Vista individual** de post y de usuario

## 🛠️ Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Supabase: Auth + PostgreSQL + RLS
- Vercel para deploy

## 📁 Estructura
src/
data/
types.ts -> Categoria, User, Post, Comentario
usePosts.ts -> cargar, votar, agregar, borrar, comentar, editar
components/
Auth.tsx -> login, registro, recuperar contraseña
PostCard.tsx -> tarjeta de post + comentarios
PostDetail.tsx -> vista individual de post
UserPanel.tsx -> perfil de usuario
App.tsx -> layout, filtros, crear post, feed
lib/
supabase.ts -> cliente de Supabase


## 🚀 Cómo correrlo

```bash
npm install
npm run dev

Necesitás un archivo .env.local con:

VITE_SUPABASE_URL=tu-url-de-supabase
VITE_SUPABASE_ANON_KEY=tu-anon-key

👩‍💻 Hecho por

Lii Méndez


