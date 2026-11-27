import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Comunidad } from './types'

export function useComunidades() {
  const [comunidades, setComunidades] = useState<Comunidad[]>([])
  const [misComunidades, setMisComunidades] = useState<string[]>([])

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('comunidades').select('*').order('nombre')
    console.log('COMUNIDADES:', data, error)

    const { data: miembros, error: errorMiembros } = await supabase.from('comunidad_miembros').select('comunidad_id, user_id')
    console.log('MIEMBROS:', miembros, errorMiembros)

    const conteo = new Map<string, number>()
    ;(miembros || []).forEach((m: any) => conteo.set(m.comunidad_id, (conteo.get(m.comunidad_id) || 0) + 1))

    setComunidades((data || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      descripcion: c.descripcion,
      icono: c.icono,
      miembros: conteo.get(c.id) || 0,
      estoyUnido: (miembros || []).some((m: any) => m.comunidad_id === c.id && m.user_id === user?.id)
    })))
    setMisComunidades((miembros || []).filter((m: any) => m.user_id === user?.id).map((m: any) => m.comunidad_id))
  }

  useEffect(() => { cargar() }, [])

  async function unirse(comunidadId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Tenés que entrar para unirte')
    const { error } = await supabase.from('comunidad_miembros').insert({ comunidad_id: comunidadId, user_id: user.id })
    if (error) return alert('Error al unirse: ' + error.message)
    cargar()
  }

  async function salir(comunidadId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('comunidad_miembros').delete().eq('comunidad_id', comunidadId).eq('user_id', user.id)
    cargar()
  }

  return { comunidades, misComunidades, unirse, salir, recargar: cargar }
}

export function useSeguidores(usuarioId: string) {
  const [seguidores, setSeguidores] = useState(0)
  const [seguidos, setSeguidos] = useState(0)
  const [loSigo, setLoSigo] = useState(false)
  const [miId, setMiId] = useState<string | null>(null)

  async function cargar() {
    const { data: { user } } = await supabase.auth.getUser()
    setMiId(user?.id || null)
    const { data: f1 } = await supabase.from('follows').select('*').eq('seguido_id', usuarioId)
    const { data: f2 } = await supabase.from('follows').select('*').eq('seguidor_id', usuarioId)
    setSeguidores(f1?.length || 0)
    setSeguidos(f2?.length || 0)
    setLoSigo((f1 || []).some((f: any) => f.seguidor_id === user?.id))
  }

  useEffect(() => { if (usuarioId) cargar() }, [usuarioId])

  async function toggleSeguir() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return alert('Tenés que entrar para seguir')
    if (user.id === usuarioId) return
    if (loSigo) {
      await supabase.from('follows').delete().eq('seguidor_id', user.id).eq('seguido_id', usuarioId)
    } else {
      await supabase.from('follows').insert({ seguidor_id: user.id, seguido_id: usuarioId })
    }
    cargar()
  }

  return { seguidores, seguidos, loSigo, miId, toggleSeguir }
}