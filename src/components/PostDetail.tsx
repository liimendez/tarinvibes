import { useState } from 'react'
import type { Post, Categoria } from '../data/types'

type Props = {
  post: Post
  isOwner: boolean
  onVolver: () => void
  onVote: () => void
  onDelete: () => void
  onComentar: (texto: string) => void
  onEditar: (datos: { titulo: string, cuerpo: string, categoria: Categoria }) => void
  onTagClick?: (tag: string) => void
  onAbrirUsuario: (autor: Post['autor']) => void
}

export default function PostDetail({ post, isOwner, onVolver, onVote, onDelete, onComentar, onEditar, onTagClick, onAbrirUsuario }: Props) {
  const [texto, setTexto] = useState('')
  const [editando, setEditando] = useState(false)
  const [tituloEdit, setTituloEdit] = useState(post.titulo)
  const [cuerpoEdit, setCuerpoEdit] = useState(post.cuerpo)
  const [catEdit, setCatEdit] = useState<Categoria>(post.categoria)

  return (
    <div className="space-y-4">
      <button onClick={onVolver} className="text-sm text-[#A78BFA]">← Volver al feed</button>

      <article className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-6">
        <div className="flex gap-2 flex-wrap">
          <span className="bg-[#2E1065] px-2 py-0.5 rounded-full text-xs">{post.categoria}</span>
          {post.tags.map(t => (
            <button key={t} onClick={() => onTagClick?.(t)} className="text-xs text-[#FF8A00] bg-[#FF8A00]/10 border border-[#FF8A00]/30 px-2 py-0.5 rounded-full hover:bg-[#FF8A00] hover:text-black">#{t}</button>
          ))}
        </div>

        {editando ? (
          <div className="space-y-2 mt-3">
            <input value={tituloEdit} onChange={e => setTituloEdit(e.target.value)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
            <select value={catEdit} onChange={e => setCatEdit(e.target.value as Categoria)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3">
              {['Música', 'Gatos', 'Tecnología', 'Humor', 'Vida', 'Gaming'].map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea value={cuerpoEdit} onChange={e => setCuerpoEdit(e.target.value)} rows={5} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
            <div className="flex gap-2">
              <button onClick={() => { onEditar({ titulo: tituloEdit, cuerpo: cuerpoEdit, categoria: catEdit }); setEditando(false) }} className="bg-violet-600 px-4 py-2 rounded-xl font-bold text-sm">Guardar</button>
              <button onClick={() => setEditando(false)} className="bg-[#2E1065] px-4 py-2 rounded-xl text-sm">Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black mt-2">{post.titulo}</h2>
            <button onClick={() => onAbrirUsuario(post.autor)} className="text-sm text-[#A78BFA] mt-1 hover:text-[#FF8A00]">
              {post.autor.avatar} {post.autor.nombre} @{post.autor.username} · {post.createdAt}
            </button>
            <p className="mt-4 whitespace-pre-wrap">{post.cuerpo}</p>
          </>
        )}

        <div className="flex items-center gap-4 mt-4">
          <button onClick={onVote} className="bg-[#2E1065] px-4 py-2 rounded-full font-bold hover:bg-[#FF8A00] hover:text-black">▲ {post.puntos} puntos</button>
          {isOwner && (
            <>
              <button onClick={() => setEditando(true)} className="text-sm text-[#A78BFA]">✏️ Editar</button>
              <button onClick={onDelete} className="text-sm text-red-300">Borrar</button>
            </>
          )}
        </div>
      </article>

      <div className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4">
        <h3 className="font-bold">💬 {post.comentarios?.length || 0} comentarios</h3>
        <div className="space-y-2 mt-3">
          {post.comentarios?.map(c => (
            <div key={c.id} className="bg-[#0B0714] p-3 rounded-xl">
              <button onClick={() => onAbrirUsuario(c.autor)} className="text-sm font-bold hover:text-[#FF8A00]">{c.autor.avatar} {c.autor.nombre} <span className="text-[#A78BFA] font-normal">@{c.autor.username}</span></button>
              <p className="text-sm mt-1">{c.texto}</p>
              <p className="text-xs text-[#A78BFA]">{c.createdAt}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribí un comentario..." className="flex-1 bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
          <button onClick={() => { if (texto.trim()) { onComentar(texto); setTexto('') } }} className="bg-violet-600 px-4 rounded-xl text-sm font-bold">Enviar</button>
        </div>
      </div>
    </div>
  )
}