import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type NotificacionReal = {
  id: string
  avatar: string
  nombre: string
  accion: string
  detalle: string
  fecha: string
  hace: string
  leida: boolean
  created_at: string
}

function formatearFecha(iso: string) {
  const fecha = new Date(iso)
  const ahora = new Date()
  const diffMin = Math.floor((ahora.getTime() - fecha.getTime()) / 60000)
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const esHoy = fecha.toDateString() === ahora.toDateString()

  let hace = ''
  if (diffMin < 1) hace = 'ahora'
  else if (diffMin < 60) hace = `hace ${diffMin} min`
  else if (diffMin < 1440) hace = `hace ${Math.floor(diffMin / 60)} hs`
  else hace = `hace ${Math.floor(diffMin / 1440)} días`

  const fechaTexto = esHoy
    ? `Hoy, ${hora}`
    : fecha.toLocaleDateString('es-AR') + ', ' + hora

  return { fecha: fechaTexto, hace }
}

export function useNotificaciones(userId?: string) {
  const [notificaciones, setNotificaciones] = useState<NotificacionReal[]>([])

  async function cargar() {
    if (!userId) return
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('para_usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotificaciones(data.map((n: any) => {
        const f = formatearFecha(n.created_at)
        return {
          id: n.id,
          avatar: n.de_avatar || '🦇',
          nombre: n.de_nombre || '',
          accion: n.accion,
          detalle: n.detalle || '',
          fecha: f.fecha,
          hace: f.hace,
          leida: n.leida,
          created_at: n.created_at,
        }
      }))
    }
  }

  useEffect(() => { cargar() }, [userId])

  // Escucha en vivo: cuando Xime comenta, te llega sin F5
  useEffect(() => {
    if (!userId) return
    const canal = supabase
      .channel('notificaciones-' + userId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `para_usuario_id=eq.${userId}`
      }, () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [userId])

  async function crearNotificacion(datos: {
    para_usuario_id: string
    de_nombre: string
    de_avatar: string
    accion: string
    detalle?: string
    tipo?: string
    post_id?: string
  }) {
    if (datos.para_usuario_id === userId) return
    await supabase.from('notificaciones').insert({
      para_usuario_id: datos.para_usuario_id,
      de_usuario_id: userId,
      de_nombre: datos.de_nombre,
      de_avatar: datos.de_avatar,
      accion: datos.accion,
      detalle: datos.detalle || '',
      tipo: datos.tipo || 'comentario',
      post_id: datos.post_id || null,
    })
  }

  async function marcarTodasLeidas() {
    if (!userId) return
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('para_usuario_id', userId)
      .eq('leida', false)
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  return {
    notificaciones,
    sinLeer: notificaciones.filter(n => !n.leida).length,
    crearNotificacion,
    marcarTodasLeidas,
    recargar: cargar,
  }
}