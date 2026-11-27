import { useEffect, useState } from 'react'
import Auth from './components/Auth'
import { supabase } from './lib/supabase'
import { usePosts } from './data/usePosts'
import type { Categoria, Post, User } from './data/types'
import PostCard from './components/PostCard'
import PostDetail from './components/PostDetail'
import UserPanel from './components/UserPanel'
import { useComunidades } from './data/useComunidades'

const CATEGORIAS: Categoria[] = ['Música', 'Gatos', 'Tecnología', 'Humor', 'Vida', 'Gaming']

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function App() {
  const { posts, loading, votar, agregar, borrar, comentar, editar } = usePosts()
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

  // Total real de la comunidad, sin el filtro de "Más votados"
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
    <div className="min-h-screen">
      <header className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div>
          <button onClick={volverFeed} className="text-left">
            <div className="flex items-center gap-2">
 
  <h1 className="text-3xl font-black">Tarin<span className="text-[#FF8A00]">Vibes</span></h1>
   <img src="/logo.png" alt="TarinVibes" className="w-10 h-10 object-contain" />
</div>
            <p className="text-[#A78BFA]">La comunidad volvió, con otras vibes</p>
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={abrirMiPerfil} className="bg-[#2E1065] border border-[#8B5CF6] px-3 py-1 rounded-full text-sm hover:bg-violet-600">👤 Mi perfil</button>
          <span className="bg-[#2E1065] border border-[#8B5CF6] px-3 py-1 rounded-full text-sm hidden sm:inline">{sesion.user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 border border-red-500 px-3 py-1 rounded-full text-sm">Salir</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-10 grid md:grid-cols-[220px_1fr] gap-4">
        <aside className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 h-fit space-y-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2" />
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

        <section className="space-y-4">
          {vista === 'post' && postSeleccionado && (
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
            />
          )}

          {vista === 'usuario' && usuarioSeleccionado && (
            <UserPanel
              usuario={usuarioSeleccionado}
              posts={posts}
              isOwn={usuarioSeleccionado.id === sesion?.user?.id}
              onVolver={volverFeed}
              onAbrirPost={abrirPost}
              onTagClick={(tag) => { setTagFiltro(tag); setVista('feed') }}
              onPerfilActualizado={() => window.location.reload()}
            />
          )}

          {vista === 'feed' && (
            <>
              <form onSubmit={publicar} className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 space-y-3">
                <h2 className="font-bold">+ Crear post</h2>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del post *" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                <input value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Breve descripción (lo que se ve en la tarjeta)" maxLength={160} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                <input value={imagenUrl} onChange={e => setImagenUrl(e.target.value)} placeholder="Link de imagen (opcional) ej: https://..." className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                {imagenUrl && <img src={imagenUrl} alt="preview" className="w-full h-40 object-cover rounded-xl border border-[#3B2A66]" />}
                <select value={categoria} onChange={e => setCategoria(e.target.value as Categoria)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3">
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
                <input value={tagsTexto} onChange={e => setTagsTexto(e.target.value)} placeholder="Tags separados por coma, ej: thrash, gatos, dba" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                <textarea value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={4} placeholder="Escribí tu post... (contenido completo, se ve al hacer click)" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                <button className="bg-violet-600 px-4 py-2 rounded-xl font-bold">Publicar</button>
                {comunidadFiltro && <p className="text-xs text-[#A78BFA]">Se va a publicar en: {comunidades.find(c => c.id === comunidadFiltro)?.nombre}</p>}
              </form>

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

              {loading ? <p className="text-[#A78BFA]">Cargando comunidad...</p> : filtrados.length === 0 && !comunidadFiltro ? <p className="bg-[#171029] p-4 rounded-2xl">{orden === 'top' ? 'Todavía nadie votó ningún post. ¡Sé el primero en votar con 🔥!' : 'Sin posts. ¡Creá el primero!'}</p> : filtrados.map(p => (
                <PostCard key={p.id} post={p} onVote={() => votar(p.id)} onDelete={() => borrar(p.id)} onComentar={(texto) => comentar(p.id, texto)} onEditar={(datos) => editar(p.id, datos)} onTagClick={(tag) => setTagFiltro(tag)} isOwner={p.autor.id === sesion?.user?.id} onAbrirPost={() => abrirPost(p)} onAbrirUsuario={() => abrirUsuario(p.autor)} />
              ))}
            </>
          )}
        </section>
      </main>
      <footer className="max-w-6xl mx-auto px-6 pb-8 text-center text-xs text-[#A78BFA]">
        <p>TarinVibes — Homenaje no oficial a la comunidad, hecho con otras vibes.</p>
        <p>No afiliado a Taringa. Hecho por Lii Méndez para aprender React + TypeScript.</p>
      </footer>
    </div>
  )
}