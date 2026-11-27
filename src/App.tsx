import { useCallback, useEffect, useState } from 'react'
import Auth from './components/Auth'
import { supabase } from './lib/supabase'
import { usePosts } from './data/usePosts'
import { useNotificaciones } from './data/useNotificaciones'
import type { Categoria, Post, User } from './data/types'
import PostCard from './components/PostCard'
import PostDetail from './components/PostDetail'
import UserPanel from './components/UserPanel'
import { useComunidades } from './data/useComunidades'
import Navbar from './components/Navbar'

const CATEGORIAS: Categoria[] = ['Música', 'Gatos', 'Tecnología', 'Humor', 'Vida', 'Gaming']

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// --- MENSAJES ADENTRO DE APP.TSX PARA NO DEPENDER DE useMensajes.ts ---
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

function useMensajes(miId?: string | null) {
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
// --- FIN MENSAJES ---

export default function App() {
  const { posts, loading, votar, agregar, borrar, comentar, editar, reaccionarComentario } = usePosts()
  const [sesion, setSesion] = useState<any>(null)
  const [isRecovery, setIsRecovery] = useState(() => window.location.hash.includes('type=recovery'))
  const [q, setQ] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagenUrl, setImagenUrl] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('Música')
  const [orden, setOrden] = useState<'recientes' | 'top'>('recientes')
  const [tagFiltro, setTagFiltro] = useState<string>('')
  const [tagsTexto, setTagsTexto] = useState('')
  const [vista, setVista] = useState<'feed' | 'post' | 'usuario'>('feed')
  const [postSeleccionado, setPostSeleccionado] = useState<Post | null>(null)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<User | null>(null)
  const { comunidades, unirse, salir } = useComunidades()
  const [comunidadFiltro, setComunidadFiltro] = useState<string>('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [panel, setPanel] = useState<'ninguno' | 'notificaciones' | 'mensajes'>('ninguno')

  const { notificaciones, sinLeer: notificacionesSinLeer, marcarTodasLeidas } = useNotificaciones(sesion?.user?.id)
  const { conversaciones, chats, usuarios, sinLeerTotal: mensajesSinLeer, enviarMensaje: enviarMensajeReal, marcarLeidos, iniciarChatCon } = useMensajes(sesion?.user?.id)

  const [chatCon, setChatCon] = useState<Conversacion | null>(null)
  const [textoChat, setTextoChat] = useState('')
  const [tema, setTema] = useState<'oscuro' | 'claro'>(() => {
    return localStorage.getItem('tarinvibes-tema') === 'claro' ? 'claro' : 'oscuro'
  })

  function cambiarTema() {
    const nuevo = tema === 'oscuro' ? 'claro' : 'oscuro'
    setTema(nuevo)
    localStorage.setItem('tarinvibes-tema', nuevo)
  }

  function abrirNotificaciones() {
    setChatCon(null)
    setVista('feed')
    if (panel !== 'notificaciones') {
      marcarTodasLeidas()
    }
    setPanel(panel === 'notificaciones' ? 'ninguno' : 'notificaciones')
  }

  function abrirMensajes() {
    setChatCon(null)
    setVista('feed')
    setPanel(panel === 'mensajes' ? 'ninguno' : 'mensajes')
  }

  function abrirChat(conv: Conversacion) {
    setChatCon(conv)
    setPanel('ninguno')
    marcarLeidos(conv.id)
    window.scrollTo(0, 0)
  }

  function enviarMensaje(e: React.FormEvent) {
    e.preventDefault()
    if (!textoChat.trim() || !chatCon) return
    enviarMensajeReal(chatCon.id, textoChat.trim())
    setTextoChat('')
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true)
      setSesion(s)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (postSeleccionado) {
      const actualizado = posts.find(p => p.id === postSeleccionado.id)
      if (actualizado) setPostSeleccionado(actualizado)
    }
  }, [posts])

  const filtrados = posts
    .filter(p =>
      (!q || p.titulo.toLowerCase().includes(q.toLowerCase()) || p.descripcion?.toLowerCase().includes(q.toLowerCase())) &&
      (!tagFiltro || p.tags?.includes(tagFiltro)) &&
      (!comunidadFiltro || p.comunidad_id === comunidadFiltro) &&
      (orden !== 'top' || p.puntos > 0)
    )
    .sort((a, b) => orden === 'top' ? b.puntos - a.puntos : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const totalEnComunidad = comunidadFiltro ? posts.filter(p => p.comunidad_id === comunidadFiltro).length : posts.length

  function elegirComunidad(id: string) {
    setComunidadFiltro(id === comunidadFiltro ? '' : id)
    setTagFiltro('')
    setVista('feed')
  }

  function publicar(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return alert('Poné un título')
    const nuevo: Post = {
      id: Date.now().toString(),
      titulo,
      slug: slugify(titulo),
      cuerpo,
      descripcion: descripcion || cuerpo.slice(0, 140),
      imagen_url: imagenUrl || null,
      categoria,
      tags: tagsTexto.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      autor: { id: sesion?.user?.id || 'u1', nombre: 'Yo', username: 'yo', avatar: '🦇' },
      puntos: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      comentarios: [],
      comunidad_id: comunidadFiltro || null,
    }
    agregar(nuevo)
    setTitulo('')
    setDescripcion('')
    setImagenUrl('')
    setCuerpo('')
    setTagsTexto('')
    setMostrarForm(false)
  }

  function abrirPost(p: Post) {
    setPostSeleccionado(p)
    setVista('post')
    window.scrollTo(0, 0)
  }

  function abrirUsuario(u: User) {
    setUsuarioSeleccionado(u)
    setVista('usuario')
    window.scrollTo(0, 0)
  }

  async function abrirMiPerfil() {
    const { data } = await supabase
      .from('profiles')
      .select('id, nombre, username, avatar, bio, ciudad, peli_fav')
      .eq('id', sesion?.user?.id)
      .maybeSingle()
    if (data) {
      abrirUsuario({ id: data.id, nombre: data.nombre, username: data.username, avatar: data.avatar, bio: data.bio, ciudad: data.ciudad, peli_fav: data.peli_fav })
    } else {
      const yo = posts.find(p => p.autor.id === sesion?.user?.id)?.autor || { id: sesion?.user?.id, nombre: sesion?.user?.email?.split('@')[0] || 'Yo', username: sesion?.user?.email?.split('@')[0] || 'yo', avatar: '🦇' }
      abrirUsuario(yo)
    }
  }

  function volverFeed() {
    setVista('feed')
    setPostSeleccionado(null)
    setUsuarioSeleccionado(null)
    setComunidadFiltro('')
    setTagFiltro('')
    setQ('')
    setPanel('ninguno')
    setChatCon(null)
  }

  function abrirNotificacion(postId?: string | null) {
    if (!postId) return
    const post = posts.find(p => p.id === postId)
    if (post) {
      setPanel('ninguno')
      setChatCon(null)
      abrirPost(post)
    }
  }

  if (isRecovery) {
    return (
      <div className="min-h-screen p-6">
        <Auth onLogin={() => { setIsRecovery(false); window.location.hash = ''; window.location.reload() }} />
      </div>
    )
  }

  if (!sesion) {
    return (
      <div className="min-h-screen p-6">
        <Auth onLogin={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col ${tema === 'claro' ? 'tema-claro' : ''}`}>
      <Navbar
        q={q}
        setQ={setQ}
        tema={tema}
        onCambiarTema={cambiarTema}
        onInicio={() => { setPanel('ninguno'); setChatCon(null); volverFeed() }}
        onMiPerfil={abrirMiPerfil}
        onSalir={() => supabase.auth.signOut()}
        onNotificaciones={abrirNotificaciones}
        onMensajes={abrirMensajes}
        notificacionesSinLeer={notificacionesSinLeer}
        mensajesSinLeer={mensajesSinLeer}
        vistaActual={vista}
      />

      <main className="max-w-7xl w-full mx-auto px-4 pb-10 flex flex-col md:grid md:grid-cols-4 gap-4 flex-1 pt-4">
        <aside className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 h-fit space-y-3 order-2 md:order-none md:col-span-1">
          <select value={orden} onChange={e => setOrden(e.target.value as 'recientes' | 'top')} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2">
            <option value="recientes">🕐 Más recientes</option>
            <option value="top">🔥 Más votados</option>
          </select>
          <h2 className="font-bold pt-2">Comunidades</h2>
          {comunidades.map(c => (
            <div key={c.id} className={`flex justify-between items-center p-2 rounded-xl hover:bg-[#2E1065] ${comunidadFiltro === c.id ? 'bg-violet-600/30 border border-violet-500' : ''}`}>
              <button onClick={() => elegirComunidad(c.id)} className="text-left flex-1 text-sm">
                {c.icono} {c.nombre} <span className="text-xs text-[#A78BFA]">· {c.miembros} miembros</span>
              </button>
              {c.estoyUnido ? (
                <button onClick={() => salir(c.id)} className="text-xs bg-[#2E1065] px-2 py-1 rounded-full">Salir</button>
              ) : (
                <button onClick={() => unirse(c.id)} className="text-xs bg-violet-600 px-2 py-1 rounded-full">Unirse</button>
              )}
            </div>
          ))}
          {comunidadFiltro && (
            <button onClick={() => setComunidadFiltro('')} className="w-full text-xs text-[#A78BFA] pt-1">✕ Ver todas las comunidades</button>
          )}
        </aside>

        <section className="space-y-4 order-1 md:order-none md:col-span-3">
          {panel === 'notificaciones' && !chatCon && (
            <div className="bg-[#171029] border border-violet-500 rounded-2xl overflow-hidden">
              <div className="flex justify-between items-center p-4 pb-2">
                <h2 className="font-bold text-lg">🔔 Notificaciones</h2>
                <button onClick={() => setPanel('ninguno')} className="text-xs text-[#A78BFA]">✕ Cerrar</button>
              </div>
              {notificaciones.length === 0 ? (
                <p className="p-4 text-sm text-[#A78BFA]">Sin notificaciones por ahora. Cuando alguien te vote o te comente, te aparece acá.</p>
              ) : (
                <div className="divide-y divide-[#3B2A66]/60">
                  {notificaciones.map(n => (
                    <button key={n.id} onClick={() => abrirNotificacion(n.post_id)} className="w-full flex gap-3 p-3 text-left items-start hover:bg-[#2E1065]/50 cursor-pointer">
                      <span className="text-2xl shrink-0 w-10 h-10 bg-[#2E1065] rounded-full flex items-center justify-center">{n.avatar}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm leading-snug">
                          {n.nombre && <b>{n.nombre} </b>}{n.accion} {n.detalle && <span className="text-[#A78BFA]">· {n.detalle}</span>}
                        </span>
                        <span className="block text-xs text-[#A78BFA] mt-1">{n.fecha} · {n.hace}</span>
                        {n.post_id && <span className="block text-xs text-violet-300 mt-1">Tocá para ver el post →</span>}
                      </span>
                      {!n.leida && <span className="w-2.5 h-2.5 bg-violet-500 rounded-full mt-2 shrink-0"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {panel === 'mensajes' && !chatCon && (
            <div className="bg-[#171029] border border-violet-500 rounded-2xl overflow-hidden">
              <div className="flex justify-between items-center p-4 pb-2">
                <h2 className="font-bold text-lg">💬 Mensajes</h2>
                <button onClick={() => setPanel('ninguno')} className="text-xs text-[#A78BFA]">✕ Cerrar</button>
              </div>
              <p className="text-xs text-[#A78BFA] px-4 pb-2">Chats privados · tocá uno para entrar</p>

              {usuarios.filter(u => !conversaciones.find(c => c.id === u.id)).length > 0 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-[#A78BFA] mb-2">Empezar chat nuevo:</p>
                  <div className="flex gap-2 flex-wrap">
                    {usuarios.filter(u => !conversaciones.find(c => c.id === u.id)).map(u => (
                      <button key={u.id} onClick={async () => {
                        const conv = await iniciarChatCon(u.id)
                        if (conv) abrirChat(conv)
                      }} className="text-xs bg-[#2E1065] border border-[#3B2A66] px-2 py-1 rounded-full">
                        {u.avatar} {u.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {conversaciones.length === 0 ? (
                <p className="p-4 text-sm text-[#A78BFA]">Todavía no tenés mensajes privados</p>
              ) : (
                <div className="divide-y divide-[#3B2A66]/60">
                  {conversaciones.map(conv => (
                    <button key={conv.id} onClick={() => abrirChat(conv)} className="w-full flex gap-3 p-3 hover:bg-[#2E1065]/50 text-left items-center">
                      <span className="text-2xl shrink-0 w-11 h-11 bg-[#2E1065] rounded-full flex items-center justify-center relative">{conv.avatar}
                        {conv.sinLeer > 0 && <span className="absolute -top-1 -right-1 bg-violet-500 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{conv.sinLeer}</span>}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex justify-between gap-2">
                          <b className="text-sm truncate">{conv.nombre}</b>
                          <span className="text-xs text-[#A78BFA] shrink-0">{conv.hace}</span>
                        </span>
                        <span className="block text-sm text-[#A78BFA] truncate">{conv.ultimoMensaje}</span>
                        <span className="block text-xs text-[#A78BFA] mt-0.5">{conv.fecha}</span>
                      </span>
                      <span className="text-[#A78BFA]">›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {chatCon && (
            <div className="bg-[#171029] border border-violet-500 rounded-2xl overflow-hidden flex flex-col h-96">
              <div className="flex items-center gap-3 p-3 border-b border-[#3B2A66] bg-[#0B0714]">
                <button onClick={() => { setChatCon(null); setPanel('mensajes') }} className="text-[#A78BFA]">←</button>
                <span className="text-2xl w-10 h-10 bg-[#2E1065] rounded-full flex items-center justify-center">{chatCon.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">{chatCon.nombre}</p>
                  <p className="text-xs text-green-400">● Activo ahora · Chat privado</p>
                </div>
                <button onClick={() => setChatCon(null)} className="text-xs text-[#A78BFA]">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {(chats[chatCon.id] || []).map(m => (
                  <div key={m.id} className={`flex ${m.de === 'yo' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`w-4/5 max-w-md px-3 py-2 rounded-2xl text-sm ${m.de === 'yo' ? 'bg-violet-600 text-white rounded-br-md' : 'bg-[#2E1065] rounded-bl-md'}`}>
                      <p>{m.texto}</p>
                      <p className={`text-xs mt-1 text-right ${m.de === 'yo' ? 'text-violet-200' : 'text-[#A78BFA]'}`}>{m.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={enviarMensaje} className="flex gap-2 p-3 border-t border-[#3B2A66] bg-[#0B0714]">
                <input value={textoChat} onChange={e => setTextoChat(e.target.value)} placeholder={`Mensaje para ${chatCon.nombre}...`} className="flex-1 bg-[#171029] border border-[#3B2A66] rounded-full px-4 py-2 text-sm outline-none" />
                <button className="bg-violet-600 px-4 py-2 rounded-full font-bold text-sm">Enviar ➤</button>
              </form>
            </div>
          )}

          {!chatCon && vista === 'post' && postSeleccionado && (
            <PostDetail
              post={postSeleccionado}
              isOwner={postSeleccionado.autor.id === sesion?.user?.id}
              onVolver={volverFeed}
              onVote={() => votar(postSeleccionado.id)}
              onDelete={() => { borrar(postSeleccionado.id); volverFeed() }}
              onComentar={(texto) => comentar(postSeleccionado.id, texto)}
              onEditar={(datos) => editar(postSeleccionado.id, datos)}
              onTagClick={(tag) => { setTagFiltro(tag); setVista('feed') }}
              onAbrirUsuario={abrirUsuario}
              onReaccionarComentario={(commentId, tipo) => reaccionarComentario(commentId, tipo)}
            />
          )}

          {!chatCon && vista === 'usuario' && usuarioSeleccionado && (
            <UserPanel
              usuario={usuarioSeleccionado}
              posts={posts}
              isOwn={usuarioSeleccionado.id === sesion?.user?.id}
              onVolver={volverFeed}
              onAbrirPost={abrirPost}
              onTagClick={(tag) => { setTagFiltro(tag); setVista('feed') }}
              onPerfilActualizado={() => window.location.reload()}
              onMensaje={async (u) => {
                const conv = await iniciarChatCon(u.id)
                if (conv) {
                  setVista('feed')
                  setPanel('ninguno')
                  abrirChat(conv)
                }
              }}
            />
          )}

          {!chatCon && vista === 'feed' && (
            <>
              {!mostrarForm ? (
                <button onClick={() => setMostrarForm(true)} className="w-full bg-violet-600 hover:bg-violet-500 px-4 py-3 rounded-2xl font-bold text-left">
                  + Crear post ✍
                </button>
              ) : (
                <form onSubmit={publicar} className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold">+ Crear post</h2>
                    <button type="button" onClick={() => setMostrarForm(false)} className="text-xs text-[#A78BFA]">✕ Cerrar</button>
                  </div>
                  <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del post *" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                  <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Breve descripción (lo que se ve en la tarjeta)" maxLength={160} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                  <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} placeholder="Link de imagen (opcional) ej: https://..." className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                  {imagenUrl && <img src={imagenUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border border-[#3B2A66]" />}
                  <select value={categoria} onChange={e => setCategoria(e.target.value as Categoria)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3">
                    {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input value={tagsTexto} onChange={e => setTagsTexto(e.target.value)} placeholder="Tags separados por coma, ej: thrash, gatos, dba" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                  <textarea value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={4} placeholder="Escribí tu post... (contenido completo, se ve al hacer click)" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                  <div className="flex gap-2">
                    <button className="bg-violet-600 px-4 py-2 rounded-xl font-bold">Publicar</button>
                    <button type="button" onClick={() => setMostrarForm(false)} className="bg-[#2E1065] px-4 py-2 rounded-xl text-sm">Cancelar</button>
                  </div>
                  {comunidadFiltro && <p className="text-xs text-[#A78BFA]">Se va a publicar en: {comunidades.find(c => c.id === comunidadFiltro)?.nombre}</p>}
                </form>
              )}

              {comunidadFiltro && (() => {
                const comu = comunidades.find(c => c.id === comunidadFiltro)
                if (!comu) return null
                return (
                  <div className="bg-[#171029] border border-[#8B5CF6] rounded-2xl p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-4xl">{comu.icono}</div>
                        <h2 className="text-2xl font-black mt-2">Bienvenido a la comunidad de {comu.nombre} {comu.icono}</h2>
                        <p className="text-[#A78BFA] text-sm mt-1">{comu.descripcion}</p>
                        <p className="text-xs mt-2">👥 {comu.miembros} miembros · 📝 {totalEnComunidad} posts en esta comunidad</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {comu.estoyUnido ? (
                          <button onClick={() => salir(comu.id)} className="bg-[#2E1065] px-3 py-1 rounded-full text-sm">Salir</button>
                        ) : (
                          <button onClick={() => unirse(comu.id)} className="bg-violet-600 px-3 py-1 rounded-full text-sm font-bold">+ Unirse</button>
                        )}
                        <button onClick={() => setComunidadFiltro('')} className="text-xs text-[#A78BFA]">✕ Quitar filtro</button>
                      </div>
                    </div>
                    {filtrados.length === 0 && (
                      <p className="mt-4 bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3 text-sm">
                        {orden === 'top' ? 'En esta comunidad todavía nadie votó ningún post. ¡Sé el primero en votar con 🔥!' : `Todavía no hay posts en ${comu.nombre}. ¡Sé el primero en publicar! 👇`}
                      </p>
                    )}
                  </div>
                )
              })()}

              {orden === 'top' && !comunidadFiltro && (
                <div className="bg-[#FF8A00]/20 border border-[#FF8A00] rounded-xl p-2 flex justify-between text-sm">
                  <span>🔥 Mostrando solo posts con votos · {filtrados.length} posts</span>
                  <button onClick={() => setOrden('recientes')}>Ver todos</button>
                </div>
              )}

              {tagFiltro && (
                <div className="bg-[#FF8A00]/20 border border-[#FF8A00] rounded-xl p-2 flex justify-between text-sm">
                  <span>Filtrando por #{tagFiltro}</span>
                  <button onClick={() => setTagFiltro('')}>✕ Quitar filtro</button>
                </div>
              )}

              {loading ? <p className="text-[#A78BFA]">Cargando comunidad...</p> : filtrados.length === 0 && !comunidadFiltro ? <p className="bg-[#171029] p-4 rounded-2xl">{orden === 'top' ? 'Todavía nadie votó ningún post. ¡Sé el primero en votar con 🔥!' : 'Sin posts. ¡Creá el primero!'}</p> : (
                <div className="grid lg:grid-cols-2 gap-4 items-start">
                  {filtrados.map(p => (
                    <PostCard key={p.id} post={p} onVote={() => votar(p.id)} onDelete={() => borrar(p.id)} onComentar={(texto) => comentar(p.id, texto)} onEditar={(datos) => editar(p.id, datos)} onTagClick={(tag) => setTagFiltro(tag)} isOwner={p.autor.id === sesion?.user?.id} onAbrirPost={() => abrirPost(p)} onAbrirUsuario={() => abrirUsuario(p.autor)} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <footer className="max-w-7xl w-full mx-auto px-6 py-6 mt-auto text-center text-xs text-[#A78BFA] border-t border-[#3B2A66]/50">
        <p>TarinVibes — Homenaje no oficial a la comunidad, hecho con otras vibes.</p>
        <p>No afiliado a Taringa. Hecho por Lii Méndez para aprender React + TypeScript.</p>
      </footer>
    </div>
  )
}