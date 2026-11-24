// fix url - forzar rebuild con la URL correcta de Supabase
import { useEffect, useState } from 'react'
import Auth from './components/Auth'
import { supabase } from './lib/supabase'
import { usePosts } from './data/usePosts'
import type { Categoria, Post } from './data/types'
import PostCard from './components/PostCard'

const CATEGORIAS: Categoria[] = ['Música', 'Gatos', 'Tecnología', 'Humor', 'Vida', 'Gaming']

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function App() {
  const { posts, loading, votar, agregar, borrar, comentar } = usePosts()
  const [sesion, setSesion] = useState<any>(null)
  const [cat, setCat] = useState<string>('Todas')
  const [q, setQ] = useState('')
  const [titulo, setTitulo] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [categoria, setCategoria] = useState<Categoria>('Música')
  const [orden, setOrden] = useState<'recientes' | 'top'>('recientes')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  const filtrados = posts
    .filter(p =>
      (cat === 'Todas' || p.categoria === cat) &&
      (!q || p.titulo.toLowerCase().includes(q.toLowerCase()))
    )
    .sort((a, b) => orden === 'top' ? b.puntos - a.puntos : b.id.localeCompare(a.id))

  function publicar(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return alert('Poné un título')
    const nuevo: Post = {
      id: Date.now().toString(),
      titulo,
      slug: slugify(titulo),
      cuerpo,
      categoria,
      tags: [],
      autor: { id: sesion?.user?.id || 'u1', nombre: 'Yo', username: 'yo', avatar: '🦇' },
      puntos: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      comentarios: [],
    }
    agregar(nuevo)
    setTitulo('')
    setCuerpo('')
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
          <h1 className="text-3xl font-black">Tarin<span className="text-[#FF8A00]">Vibes</span></h1>
          <p className="text-[#A78BFA]">La comunidad volvió, con otras vibes</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="bg-[#2E1065] border border-[#8B5CF6] px-3 py-1 rounded-full text-sm">{sesion.user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="bg-red-500/20 border border-red-500 px-3 py-1 rounded-full text-sm">Salir</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-10 grid md:grid-cols-[220px_1fr] gap-4">
        <aside className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 h-fit space-y-2">
          <h2 className="font-bold">Categorías</h2>
          {['Todas', ...CATEGORIAS].map(c => (
            <button key={c} onClick={() => setCat(c)} className={cat === c ? 'w-full text-left bg-violet-600 p-2 rounded-xl font-bold' : 'w-full text-left p-2 rounded-xl hover:bg-[#2E1065]'}>
              {c}
            </button>
          ))}
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 mt-2" />
          <select value={orden} onChange={e => setOrden(e.target.value as 'recientes' | 'top')} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 mt-2">
            <option value="recientes">🕐 Más recientes</option>
            <option value="top">🔥 Más votados</option>
          </select>
        </aside>

        <section className="space-y-4">
          <form onSubmit={publicar} className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 space-y-3">
            <h2 className="font-bold">+ Crear post</h2>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del post *" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
            <select value={categoria} onChange={e => setCategoria(e.target.value as Categoria)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3">
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea value={cuerpo} onChange={e => setCuerpo(e.target.value)} rows={4} placeholder="Escribí tu post..." className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
            <button className="bg-violet-600 px-4 py-2 rounded-xl font-bold">Publicar</button>
          </form>

          {loading ? <p className="text-[#A78BFA]">Cargando comunidad...</p> : filtrados.length === 0 ? <p className="bg-[#171029] p-4 rounded-2xl">Sin posts. ¡Creá el primero!</p> : filtrados.map(p => (
            <PostCard key={p.id} post={p} onVote={() => votar(p.id)} onDelete={() => borrar(p.id)} onComentar={(texto) => comentar(p.id, texto)} />
          ))}
        </section>
      </main>
      <footer className="max-w-6xl mx-auto px-6 pb-8 text-center text-xs text-[#A78BFA]">
       <p>TarinVibes — Homenaje no oficial a la comunidad, hecho con otras vibes. v2</p>
        <p>No afiliado a Taringa. Hecho por Lii Méndez para aprender React + TypeScript.</p>
      </footer>
    </div>
  )
}