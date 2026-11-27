export type Categoria = 'Música' | 'Gatos' | 'Tecnología' | 'Humor' | 'Vida' | 'Gaming'

export interface User {
  id: string
  nombre: string
  username: string
  avatar: string
  bio?: string
  ciudad?: string
  peli_fav?: string
}

export interface Comentario {
  id: string
  postId: string
  autor: User
  texto: string
  createdAt: string
}

export interface Post {
  id: string
  titulo: string
  slug: string
  cuerpo: string
  descripcion?: string | null
  imagen_url?: string | null
  categoria: Categoria
  tags: string[]
  autor: User
  puntos: number
  createdAt: string
  comentarios: Comentario[]
  comunidad_id?: string | null
}

export type Comunidad = {
  id: string
  nombre: string
  slug: string
  descripcion: string
  icono: string
  miembros?: number
  estoyUnido?: boolean
}

export type Follow = {
  seguidor_id: string
  seguido_id: string
}