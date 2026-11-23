import { useEffect, useState } from 'react'
import type { Post, User } from './types'

const KEY = 'tarinvibes_v1'
const VOTOS_KEY = 'tarinvibes_votos'

export const USUARIOS: User[] = [
  { id: 'u1', nombre: 'Lii Méndez', username: 'lii', avatar: '🦇' },
  { id: 'u2', nombre: 'Mica Ruiz', username: 'mica', avatar: '🐱' },
  { id: 'u3', nombre: 'Tomi Herrera', username: 'tomi', avatar: '🎸' },
]

export function getUsuarioActual(): User {
  const guardado = localStorage.getItem('tarinvibes_user')
  if (guardado) return JSON.parse(guardado)
  return USUARIOS[0]
}

const SEED: Post[] = [
  {
    id: '1',
    titulo: 'Mi gato escucha más thrash que yo',
    slug: 'mi-gato-escucha-mas-thrash-que-yo',
    cuerpo: 'Les juro que cada vez que pongo metallica, Luna se acuesta al lado del parlante. ¿Sus gatos también tienen bandas favoritas?',
    categoria: 'Gatos',
    tags: ['gatos', 'thrash'],
    autor: USUARIOS[0],
    puntos: 42,
    createdAt: '2026-11-22',
    comentarios: [],
  },
  {
    id: '2',
    titulo: 'De DBA a frontend: lo que nadie te cuenta',
    slug: 'de-dba-a-frontend',
    cuerpo: 'Como DBA aprendí a pensar en índices, queries y performance. En frontend eso sirve un montón.',
    categoria: 'Tecnología',
    tags: ['dba', 'frontend'],
    autor: USUARIOS[0],
    puntos: 28,
    createdAt: '2026-11-21',
    comentarios: [],
  },
]

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      const guardado = localStorage.getItem(KEY)
      if (guardado) {
        const parsed = JSON.parse(guardado)
        const conComentarios = parsed.map((p: any) => ({ ...p, comentarios: p.comentarios || [] }))
        setPosts(conComentarios)
      } else {
        localStorage.setItem(KEY, JSON.stringify(SEED))
        setPosts(SEED)
      }
      setLoading(false)
    }, 300)
  }, [])

  function guardar(next: Post[]) {
    setPosts(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

 function votar(id: string) {
  const votosGuardados = JSON.parse(localStorage.getItem(VOTOS_KEY) || '[]') as string[]
  if (votosGuardados.includes(id)) {
    alert('Ya votaste este post!')
    return
  }
  const nuevosVotos = [...votosGuardados, id]
  localStorage.setItem(VOTOS_KEY, JSON.stringify(nuevosVotos))
  guardar(posts.map(p => p.id === id ? { ...p, puntos: p.puntos + 1 } : p))
}

  function agregar(p: Post) {
    guardar([p, ...posts])
  }

  function borrar(id: string) {
    guardar(posts.filter(p => p.id !== id))
  }

  function comentar(postId: string, texto: string) {
    guardar(posts.map(p => p.id === postId ? {
      ...p,
      comentarios: [...(p.comentarios || []), {
        id: Date.now().toString(),
        postId,
        autor: getUsuarioActual(),
        texto,
        createdAt: new Date().toISOString().slice(0, 10)
      }]
    } : p))
  }

  return { posts, loading, votar, agregar, borrar, comentar }
}