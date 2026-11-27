import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type Notificacion = {
  id: string
  nombre: string
  avatar: string
  accion: string
  detalle: string
  fecha: string
  hace: string
  leida: boolean
  post_id?: string | null
}

function haceTiempo(fechaISO: string) {
  const diff = Date.now() - new Date(fechaISO).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  return `hace ${dias} d`
}

export function useNotificaciones(userId?: string) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  const cargar = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('para_usuario_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando notificaciones:', error)
      return
    }

    setNotificaciones((data || []).map((n: any) => ({
      id: n.id,
      nombre: n.de_nombre || 'Alguien',
      avatar: n.de_avatar || '🦇',
      accion: n.accion,
      detalle: n.detalle || '',
      fecha: new Date(n.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      hace: haceTiempo(n.created_at),
      leida: n.leida,
      post_id: n.post_id || null,
    })))
  }, [userId])

  const marcarTodasLeidas = useCallback(async () => {
    if (!userId) return
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('para_usuario_id', userId)
      .eq('leida', false)
  }, [userId])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Realtime: si llega una nueva, recargar sin F5
  useEffect(() => {
    if (!userId) return
    const canal = supabase
      .channel('notificaciones-' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `para_usuario_id=eq.${userId}` }, () => {
        cargar()
      })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [userId, cargar])

  const sinLeer = notificaciones.filter(n => !n.leida).length

  return { notificaciones, sinLeer, marcarTodasLeidas, recargar: cargar }
}