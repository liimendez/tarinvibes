import { useEffect, useState } from 'react'
import type { Post, User, Categoria } from './types'
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

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, nombre, username, avatar, bio, ciudad, peli_fav')

    const mapaPerfiles = new Map((profilesData || []).map((p: any) => [p.id, p]))

    function autorDe(autorId: string | null): User {
      if (autorId && mapaPerfiles.has(autorId)) {
        const p = mapaPerfiles.get(autorId)
        return { id: p.id, nombre: p.nombre || p.username || 'Usuario', username: p.username || 'usuario', avatar: p.avatar || '🦇', bio: p.bio || '', ciudad: p.ciudad || '', peli_fav: p.peli_fav || '' }
      }
      return { id: 'u1', nombre: 'Lii Méndez', username: 'lii', avatar: '🦇', bio: '', ciudad: '', peli_fav: '' }
    }

    const postsMapeados = (postsData || []).map((row: any) => ({
      id: row.id,
      titulo: row.titulo,
      slug: row.slug,
      cuerpo: row.cuerpo,
      descripcion: row.descripcion || (row.cuerpo ? row.cuerpo.slice(0, 140) + (row.cuerpo.length > 140 ? '...' : '') : ''),
      imagen_url: row.imagen_url || null,
      categoria: row.categoria,
      tags: row.tags || [],
      comunidad_id: row.comunidad_id || null,
      autor: autorDe(row.autor_id),
      puntos: row.puntos || 0,
      createdAt: row.created_at || '',
      comentarios: (commentsData || [])
        .filter((c: any) => c.post_id === row.id)
        .map((c: any) => ({
          id: c.id,
          postId: c.post_id,
          autor: autorDe(c.autor_id),
          texto: c.texto,
          createdAt: c.created_at || '',
        })),
    }))

    setPosts(postsMapeados)
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  // Helper: trae nombre y avatar de quien está haciendo la acción
  async function miPerfil(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('nombre, username, avatar')
      .eq('id', userId)
      .maybeSingle()
    return {
      nombre: data?.nombre || data?.username || 'Alguien',
      avatar: data?.avatar || '🦇',
    }
  }

  // Helper: crea la notificación real en Supabase, sin avisarme a mi mismo
  async function crearNotificacion(params: {
    para_usuario_id: string
    de_usuario_id: string
    de_nombre: string
    de_avatar: string
    tipo: string
    accion: string
    detalle: string
    post_id: string
  }) {
    if (!params.para_usuario_id) return
    if (params.para_usuario_id === params.de_usuario_id) return
    const { error } = await supabase.from('notificaciones').insert({
      para_usuario_id: params.para_usuario_id,
      de_usuario_id: params.de_usuario_id,
      de_nombre: params.de_nombre,
      de_avatar: params.de_avatar,
      tipo: params.tipo,
      accion: params.accion,
      detalle: params.detalle,
      post_id: params.post_id,
    })
    if (error) console.log('Error creando notificacion:', error)
  }

  async function votar(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Tenés que entrar para votar')
      return
    }
    const post = posts.find(p => p.id === id)
    if (!post) return

    const { data: votoExistente } = await supabase
      .from('votes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (votoExistente) {
      await supabase.from('votes').delete().eq('id', votoExistente.id)
      await supabase.from('posts').update({ puntos: Math.max(0, post.puntos - 1) }).eq('id', id)
      // Si saca el voto, no mandamos notificación
    } else {
      const { error } = await supabase.from('votes').insert({ post_id: id, user_id: user.id })
      if (error) {
        console.log('Error al votar:', error)
        return
      }
      await supabase.from('posts').update({ puntos: post.puntos + 1 }).eq('id', id)

      // NOTIFICACION REAL DE VOTO
      const yo = await miPerfil(user.id)
      await crearNotificacion({
        para_usuario_id: post.autor.id,
        de_usuario_id: user.id,
        de_nombre: yo.nombre,
        de_avatar: yo.avatar,
        tipo: 'voto',
        accion: 'te votó un post 🔥',
        detalle: `“${post.titulo}”`,
        post_id: id,
      })
    }
    cargar()
  }

  async function agregar(p: Post) {
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Intentando crear post:', p)
    const { data, error } = await supabase.from('posts').insert({
      titulo: p.titulo,
      slug: p.slug,
      cuerpo: p.cuerpo,
      descripcion: p.descripcion || (p.cuerpo ? p.cuerpo.slice(0, 140) : ''),
      imagen_url: p.imagen_url || null,
      categoria: p.categoria,
      tags: p.tags,
      puntos: 0,
      autor_id: user?.id || null,
      comunidad_id: p.comunidad_id || null,
    }).select()

    console.log('Resultado insert:', data, error)
    if (error) {
      alert('Error al crear post: ' + error.message)
      return
    }
    cargar()
  }

  async function borrar(id: string) {
    if (!confirm('¿Borrar este post?')) return
    await supabase.from('posts').delete().eq('id', id)
    cargar()
  }

  async function editar(id: string, datos: { titulo: string, cuerpo: string, categoria: Categoria, descripcion?: string, imagen_url?: string | null }) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...datos } : p))
    await supabase.from('posts').update({
      titulo: datos.titulo,
      cuerpo: datos.cuerpo,
      categoria: datos.categoria,
      descripcion: datos.descripcion,
      imagen_url: datos.imagen_url,
    }).eq('id', id)
  }

  async function comentar(postId: string, texto: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Tenés que entrar para comentar')
      return
    }
    const post = posts.find(p => p.id === postId)
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      texto,
      autor_id: user?.id || null,
    })
    if (error) {
      console.log('Error al comentar:', error)
      return
    }

    // NOTIFICACION REAL DE COMENTARIO
    if (post) {
      const yo = await miPerfil(user.id)
      await crearNotificacion({
        para_usuario_id: post.autor.id,
        de_usuario_id: user.id,
        de_nombre: yo.nombre,
        de_avatar: yo.avatar,
        tipo: 'comentario',
        accion: 'comentó en tu post 💬',
        detalle: `“${texto.slice(0, 60)}”`,
        post_id: postId,
      })
    }

    cargar()
  }

  return { posts, loading, votar, agregar, borrar, comentar, editar }
}