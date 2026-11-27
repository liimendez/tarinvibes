import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Conversacion = {
  id: string
  nombre: string
  username: string
  avatar: string
  ultimoMensaje: string
  fecha: string
  hace: string
  sinLeer: number
}

export type MensajeChat = {
  id: string
  de: 'yo' | 'otro'
  texto: string
  hora: string
  createdAt: string
}

function haceTiempo(fecha: string) {
  const diff = Date.now() - new Date(fecha).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const hs = Math.floor(min / 60)
  if (hs < 24) return `hace ${hs} h`
  const dias = Math.floor(hs / 24)
  if (dias === 1) return 'ayer'
  return `hace ${dias} días`
}

export function useMensajes(miId?: string | null) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [chats, setChats] = useState<Record<string, MensajeChat[]>>({})
  const [usuarios, setUsuarios] = useState<{ id: string, nombre: string, username: string, avatar: string }[]>([])
  const [sinLeerTotal, setSinLeerTotal] = useState(0)

  const cargar = useCallback(async () => {
    if (!miId) return
    const { data: perfiles } = await supabase.from('profiles').select('id, nombre, username, avatar')
    const listaUsuarios = (perfiles || []).filter((p: any) => p.id !== miId)
    setUsuarios(listaUsuarios.map((p: any) => ({
      id: p.id,
      nombre: p.nombre || p.username || 'Usuario',
      username: p.username || 'usuario',
      avatar: p.avatar || '🦇',
    })))
    const { data: mensajes, error } = await supabase.from('mensajes').select('*').or(`emisor_id.eq.${miId},receptor_id.eq.${miId}`).order('created_at', { ascending: true })
    if (error) { console.log('Error cargando mensajes:', error); return }
    const mapaPerfiles = new Map((perfiles || []).map((p: any) => [p.id, p]))
    const porOtro: Record<string, any[]> = {}
    let totalSinLeer = 0
    ;(mensajes || []).forEach((m: any) => {
      const otroId = m.emisor_id === miId ? m.receptor_id : m.emisor_id
      if (!porOtro[otroId]) porOtro[otroId] = []
      porOtro[otroId].push(m)
      if (m.receptor_id === miId && !m.leido) totalSinLeer++
    })
    setSinLeerTotal(totalSinLeer)
    const convs: Conversacion[] = Object.entries(porOtro).map(([otroId, lista]) => {
      const perfil = mapaPerfiles.get(otroId)
      const ultimo = lista[lista.length - 1]
      const sinLeer = lista.filter((m: any) => m.receptor_id === miId && !m.leido).length
      return {
        id: otroId,
        nombre: perfil?.nombre || perfil?.username || 'Usuario',
        username: perfil?.username || 'usuario',
        avatar: perfil?.avatar || '🦇',
        ultimoMensaje: ultimo.texto,
        fecha: new Date(ultimo.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        hace: haceTiempo(ultimo.created_at),
        sinLeer,
      }
    }).sort((a, b) => {
      const ultimoA = porOtro[a.id][porOtro[a.id].length - 1].created_at
      const ultimoB = porOtro[b.id][porOtro[b.id].length - 1].created_at
      return new Date(ultimoB).getTime() - new Date(ultimoA).getTime()
    })
    setConversaciones(convs)
    const chatsArmados: Record<string, MensajeChat[]> = {}
    Object.entries(porOtro).forEach(([otroId, lista]) => {
      chatsArmados[otroId] = lista.map((m: any) => ({
        id: m.id,
        de: m.emisor_id === miId ? 'yo' : 'otro',
        texto: m.texto,
        hora: new Date(m.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: m.created_at,
      }))
    })
    setChats(chatsArmados)
  }, [miId])

  useEffect(() => { cargar() }, [cargar])

  useEffect(() => {
    if (!miId) return
    const canal = supabase.channel('mensajes-' + miId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, () => cargar())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensajes' }, () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [miId, cargar])

  async function enviarMensaje(receptorId: string, texto: string) {
    if (!miId || !texto.trim()) return
    const { error } = await supabase.from('mensajes').insert({ emisor_id: miId, receptor_id: receptorId, texto: texto.trim() })
    if (error) { alert('Error mandando mensaje: ' + error.message); return }
    await cargar()
  }

  async function marcarLeidos(otroId: string) {
    if (!miId) return
    await supabase.from('mensajes').update({ leido: true }).eq('emisor_id', otroId).eq('receptor_id', miId).eq('leido', false)
    await cargar()
  }

  async function iniciarChatCon(otroId: string) {
    const existe = conversaciones.find(c => c.id === otroId)
    if (existe) return existe
    const perfil = usuarios.find(u => u.id === otroId)
    if (!perfil) return null
    const nueva: Conversacion = {
      id: otroId,
      nombre: perfil.nombre,
      username: perfil.username,
      avatar: perfil.avatar,
      ultimoMensaje: 'Empezá la conversación...',
      fecha: 'Ahora',
      hace: 'ahora',
      sinLeer: 0,
    }
    setConversaciones(prev => [nueva, ...prev])
    return nueva
  }

  return { conversaciones, chats, usuarios, sinLeerTotal, enviarMensaje, marcarLeidos, iniciarChatCon, recargar: cargar }
}