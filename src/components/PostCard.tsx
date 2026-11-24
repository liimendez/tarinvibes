import { useState } from 'react'
import type { Post, Categoria } from '../data/types'




type Props = {
  post: Post
  onVote: () => void
  onDelete: () => void
  onComentar: (texto: string) => void
  onEditar?: (datos: { titulo: string, cuerpo: string, categoria: Categoria }) => void
  onTagClick?: (tag: string) => void
  onAbrirPost?: () => void
  onAbrirUsuario?: () => void
  isOwner?: boolean
}

export default function PostCard({ post, onVote, onDelete, onComentar, onEditar, onTagClick, onAbrirPost, isOwner }: Props) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [tituloEdit, setTituloEdit] = useState(post.titulo)
  const [cuerpoEdit, setCuerpoEdit] = useState(post.cuerpo)
  const [catEdit, setCatEdit] = useState<Categoria>(post.categoria)

  function guardarEdicion() {
    if (!tituloEdit.trim()) return alert('Poné un título')
    onEditar?.({ titulo: tituloEdit, cuerpo: cuerpoEdit, categoria: catEdit })
    setEditando(false)
  }

  return (
    <article className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 flex gap-3">
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onVote}
          className="bg-[#2E1065] w-9 h-9 rounded-full font-bold hover:bg-[#FF8A00] hover:text-black"
        >
          ▲
        </button>
        <b>{post.puntos}</b>
        <span className="text-xs text-[#A78BFA]">puntos</span>
      </div>

      <div className="flex-1">
        <div className="flex gap-2 flex-wrap">
          <span className="bg-[#2E1065] px-2 py-0.5 rounded-full text-xs">
            {post.categoria}
          </span>
          {post.tags.map((t) => (
            <button key={t} onClick={() => onTagClick?.(t)} className="text-xs text-[#FF8A00] bg-[#FF8A00]/10 border border-[#FF8A00]/30 px-2 py-0.5 rounded-full hover:bg-[#FF8A00] hover:text-black" title={`Filtrar por #${t}`}>
              #{t}
            </button>
          ))}
        </div>

        {editando ? (
          <div className="space-y-2 mt-2">
            <input value={tituloEdit} onChange={e => setTituloEdit(e.target.value)} placeholder="Título" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <select value={catEdit} onChange={e => setCatEdit(e.target.value as Categoria)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm">
              {['Música', 'Gatos', 'Tecnología', 'Humor', 'Vida', 'Gaming'].map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea value={cuerpoEdit} onChange={e => setCuerpoEdit(e.target.value)} rows={3} placeholder="Escribí tu post..." className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={guardarEdicion} className="bg-violet-600 px-3 py-1 rounded-xl text-sm font-bold">Guardar</button>
              <button onClick={() => { setEditando(false); setTituloEdit(post.titulo); setCuerpoEdit(post.cuerpo); setCatEdit(post.categoria) }} className="bg-[#2E1065] px-3 py-1 rounded-xl text-sm">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <h3 onClick={onAbrirPost} className="text-lg font-bold mt-1 cursor-pointer hover:text-[#FF8A00]">{post.titulo}</h3>
            <p className="text-sm text-[#A78BFA]">
              {post.autor.avatar} {post.autor.nombre} @{post.autor.username} · {post.createdAt}
            </p>
            <p className="text-sm mt-2">{post.cuerpo}</p>
          </>
        )}

        <button onClick={() => setAbierto(!abierto)} className="text-xs text-[#A78BFA] mt-2 block">
          💬 {post.comentarios?.length || 0} comentarios
        </button>

        {abierto && (
          <div className="mt-3 space-y-2">
            {post.comentarios?.map(c => (
              <p key={c.id} className="bg-[#0B0714] p-2 rounded-xl text-sm">
                <b>{c.autor.avatar} {c.autor.nombre}</b> · {c.texto}
              </p>
            ))}
            <div className="flex gap-2">
              <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribí un comentario..." className="flex-1 bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
              <button onClick={() => { if (texto.trim()) { onComentar(texto); setTexto('') } }} className="bg-violet-600 px-3 rounded-xl text-sm font-bold">Enviar</button>
            </div>
          </div>
        )}

        {isOwner && (
          <div className="flex gap-3 mt-2">
            {onEditar && (
              <button onClick={() => setEditando(true)} className="text-xs text-[#A78BFA] block">
                ✏️ Editar
              </button>
            )}
            <button onClick={onDelete} className="text-xs text-red-300 block">
              Borrar
            </button>
          </div>
        )}
      </div>
    </article>
  )
}