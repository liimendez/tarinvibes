import { useEffect, useState } from 'react'
import type { Post, User } from './types'
import { supabase } from '../lib/supabase'

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

function mapPost(row: any): Post {
  return {
    id: row.id,
    titulo: row.titulo,
    slug: row.slug,
    cuerpo: row.cuerpo,
    categoria: row.categoria,
    tags: row.tags || [],
    autor: {
      id: row.autor_id || 'u1',
      nombre: row.profiles?.nombre || 'Lii Méndez',
      username: row.profiles?.username || 'lii',
      avatar: row.profiles?.avatar || '🦇',
    },
    puntos: row.puntos || 0,
    createdAt: row.created_at?.slice(0, 10) || '',
    comentarios: (row.comments || []).map((c: any) => ({
      id: c.id,
      postId: c.post_id,
      autor: {
        id: c.autor_id || 'u1',
        nombre: c.profiles?.nombre || 'Lii Méndez',
        username: c.profiles?.username || 'lii',
        avatar: c.profiles?.avatar || '🦇',
      },
      texto: c.texto,
      createdAt: c.created_at?.slice(0, 10) || '',
    })),
  }
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

async function cargar() {
  const { data: postsData, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.log('Error Supabase:', error)
    setLoading(false)
    return
  }

  const { data: commentsData } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true })

  const postsMapeados = (postsData || []).map((row: any) => ({
    id: row.id,
    titulo: row.titulo,
    slug: row.slug,
    cuerpo: row.cuerpo,
    categoria: row.categoria,
    tags: row.tags || [],
    autor: { id: 'u1', nombre: 'Lii Méndez', username: 'lii', avatar: '🦇' },
    puntos: row.puntos || 0,
    createdAt: row.created_at?.slice(0, 10) || '',
    comentarios: (commentsData || [])
      .filter((c: any) => c.post_id === row.id)
      .map((c: any) => ({
        id: c.id,
        postId: c.post_id,
        autor: { id: 'u1', nombre: 'Lii Méndez', username: 'lii', avatar: '🦇' },
        texto: c.texto,
        createdAt: c.created_at?.slice(0, 10) || '',
      })),
  }))

  setPosts(postsMapeados)
  setLoading(false)
}

  useEffect(() => {
    cargar()
  }, [])

  async function votar(id: string) {
    const post = posts.find(p => p.id === id)
    if (!post) return
    const { error } = await supabase
      .from('posts')
      .update({ puntos: post.puntos + 1 })
      .eq('id', id)
    if (!error) cargar()
  }

 async function agregar(p: Post) {
  console.log('Intentando crear post:', p)
  const { data, error } = await supabase.from('posts').insert({
    titulo: p.titulo,
    slug: p.slug,
    cuerpo: p.cuerpo,
    categoria: p.categoria,
    tags: p.tags,
    puntos: 0,
  }).select()

  console.log('Resultado insert:', data, error)
  if (error) {
    alert('Error al crear post: ' + error.message)
    return
  }
  cargar()
}

  async function borrar(id: string) {
    await supabase.from('posts').delete().eq('id', id)
    cargar()
  }

  async function comentar(postId: string, texto: string) {
    await supabase.from('comments').insert({
      post_id: postId,
      texto,
    })
    cargar()
  }

  return { posts, loading, votar, agregar, borrar, comentar, recargar: cargar }
}