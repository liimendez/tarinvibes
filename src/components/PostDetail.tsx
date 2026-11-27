import { useState } from 'react'
import type { Post, Categoria } from '../data/types'

type Props = {
  post: Post
  isOwner: boolean
  onVolver: () => void
  onVote: () => void
  onDelete: () => void
  onComentar: (texto: string) => void
  onEditar: (datos: { titulo: string, cuerpo: string, categoria: Categoria, descripcion?: string, imagen_url?: string | null }) => void
  onTagClick?: (tag: string) => void
  onAbrirUsuario: (autor: Post['autor']) => void
  onReaccionarComentario?: (commentId: string, tipo: string) => void
}

const REACCIONES = [
  { emoji: '👍', tipo: 'like' },
  { emoji: '❤️', tipo: 'love' },
  { emoji: '😂', tipo: 'haha' },
  { emoji: '😮', tipo: 'wow' },
  { emoji: '😢', tipo: 'sad' },
  { emoji: '😡', tipo: 'angry' },
  { emoji: '👎', tipo: 'dislike' },
]

export default function PostDetail({ post, isOwner, onVolver, onVote, onDelete, onComentar, onEditar, onTagClick, onAbrirUsuario, onReaccionarComentario }: Props) {
  const [texto, setTexto] = useState('')
  const [editando, setEditando] = useState(false)
  const [tituloEdit, setTituloEdit] = useState(post.titulo)
  const [cuerpoEdit, setCuerpoEdit] = useState(post.cuerpo)
  const [catEdit, setCatEdit] = useState<Categoria>(post.categoria)
  const [descripcionEdit, setDescripcionEdit] = useState(post.descripcion || '')
  const [imagenEdit, setImagenEdit] = useState(post.imagen_url || '')

  function formatearFecha(fecha: string) {
    const d = new Date(fecha)
    if (isNaN(d.getTime())) return fecha
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
      <button onClick={onVolver} className="text-sm text-[#A78BFA]">← Volver al feed</button>

      <article className="bg-[#171029] border border-[#3B2A66] rounded-2xl overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row gap-5">
          {post.imagen_url && !editando && (
            <div className="shrink-0 mx-auto sm:mx-0">
              <img src={post.imagen_url} alt={post.titulo} className="w-72 h-48 object-contain bg-black rounded-xl border border-[#3B2A66]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex gap-2 flex-wrap">
              <span className="bg-[#2E1065] px-2 py-0.5 rounded-full text-xs">{post.categoria}</span>
              {post.tags.map(t => (
                <button key={t} onClick={() => onTagClick?.(t)} className="text-xs text-[#FF8A00] bg-[#FF8A00]/10 border border-[#FF8A00]/30 px-2 py-0.5 rounded-full hover:bg-[#FF8A00] hover:text-black">#{t}</button>
              ))}
            </div>

            {editando ? (
              <div className="space-y-2 mt-3">
                <input value={tituloEdit} onChange={e => setTituloEdit(e.target.value)} placeholder="Título" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                <input value={descripcionEdit} onChange={e => setDescripcionEdit(e.target.value)} placeholder="Breve descripción" maxLength={160} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                <input value={imagenEdit} onChange={e => setImagenEdit(e.target.value)} placeholder="Link de imagen" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                {imagenEdit && <img src={imagenEdit} alt="preview" className="w-full h-40 object-cover rounded-xl" />}
                <select value={catEdit} onChange={e => setCatEdit(e.target.value as Categoria)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3">
                  {['Música', 'Gatos', 'Tecnología', 'Humor', 'Vida', 'Gaming'].map(c => <option key={c}>{c}</option>)}
                </select>
                <textarea value={cuerpoEdit} onChange={e => setCuerpoEdit(e.target.value)} rows={5} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
                <div className="flex gap-2">
                  <button onClick={() => { onEditar({ titulo: tituloEdit, cuerpo: cuerpoEdit, categoria: catEdit, descripcion: descripcionEdit, imagen_url: imagenEdit || null }); setEditando(false) }} className="bg-violet-600 px-4 py-2 rounded-xl font-bold text-sm">Guardar</button>
                  <button onClick={() => setEditando(false)} className="bg-[#2E1065] px-4 py-2 rounded-xl text-sm">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black mt-2 leading-tight">{post.titulo}</h2>
                <button onClick={() => onAbrirUsuario(post.autor)} className="text-sm text-[#A78BFA] mt-1 hover:text-[#FF8A00] block text-left">
                  {post.autor.avatar} {post.autor.nombre} @{post.autor.username} · {formatearFecha(post.createdAt)}
                </button>
                {post.descripcion && <p className="text-[#A78BFA] italic mt-2 text-sm">{post.descripcion}</p>}
                <div className="flex items-center gap-4 mt-3">
                  <button onClick={onVote} className="bg-[#2E1065] px-4 py-2 rounded-full font-bold hover:bg-[#FF8A00] hover:text-black text-sm">▲ {post.puntos} puntos</button>
                  {isOwner && (
                    <>
                      <button onClick={() => setEditando(true)} className="text-sm text-[#A78BFA]">✏ Editar</button>
                      <button onClick={onDelete} className="text-sm text-red-300">Borrar</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {!editando && (
          <div className="px-6 pb-6 border-t border-[#3B2A66] pt-4">
            <p className="whitespace-pre-wrap leading-relaxed">{post.cuerpo}</p>
          </div>
        )}
      </article>

      <div className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4">
        <h3 className="font-bold">💬 {post.comentarios?.length || 0} comentarios</h3>
        <div className="space-y-2 mt-3">
          {post.comentarios?.map(c => (
            <div key={c.id} className="bg-[#0B0714] p-3 rounded-xl">
              <button onClick={() => onAbrirUsuario(c.autor)} className="text-sm font-bold hover:text-[#FF8A00]">{c.autor.avatar} {c.autor.nombre} <span className="text-[#A78BFA] font-normal">@{c.autor.username}</span></button>
              <p className="text-sm mt-1">{c.texto}</p>
              <p className="text-xs text-[#A78BFA]">{formatearFecha(c.createdAt)}</p>

              <div className="flex gap-1 mt-2 flex-wrap">
                {REACCIONES.map(r => {
                  const cantidad = c.reacciones?.[r.tipo] || 0
                  const activa = c.miReaccion === r.tipo
                  return (
                    <button
                      key={r.tipo}
                      onClick={() => onReaccionarComentario?.(c.id, r.tipo)}
                      className={`text-xs px-2 py-1 rounded-full flex gap-1 items-center font-bold ${activa ? 'bg-violet-600 text-white border border-violet-400' : cantidad > 0 ? 'bg-violet-600/30 text-violet-200 border border-violet-500' : 'bg-[#171029] border border-[#3B2A66] hover:bg-[#2E1065]'}`}
                    >
                      <span>{r.emoji}</span>
                      {cantidad > 0 && <span>{cantidad}</span>}
                    </button>
                  )
                })}
              </div>
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