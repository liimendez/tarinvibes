import { useState } from 'react'
import type { Post, Categoria } from '../data/types'

type Props = {
  post: Post
  onVote: () => void
  onDelete: () => void
  onComentar: (texto: string, parentId?: string | null) => void
  onEditar?: (datos: { titulo: string, cuerpo: string, categoria: Categoria, descripcion?: string, imagen_url?: string | null }) => void
  onTagClick?: (tag: string) => void
  onAbrirPost?: () => void
  onAbrirUsuario?: () => void
  isOwner?: boolean
}

export default function PostCard({ post, onVote, onDelete, onComentar, onEditar, onTagClick, onAbrirPost, onAbrirUsuario, isOwner }: Props) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(false)
  const [tituloEdit, setTituloEdit] = useState(post.titulo)
  const [cuerpoEdit, setCuerpoEdit] = useState(post.cuerpo)
  const [catEdit, setCatEdit] = useState<Categoria>(post.categoria)
  const [descripcionEdit, setDescripcionEdit] = useState(post.descripcion || '')
  const [imagenEdit, setImagenEdit] = useState(post.imagen_url || '')
  const [respondiendoA, setRespondiendoA] = useState<string | null>(null)
  const [textoRespuesta, setTextoRespuesta] = useState('')

  const descripcion = post.descripcion || (post.cuerpo ? post.cuerpo.slice(0, 140) + (post.cuerpo.length > 140 ? '...' : '') : '')

  function formatearFecha(fecha: string) {
    const d = new Date(fecha)
    if (isNaN(d.getTime())) return fecha
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function guardarEdicion() {
    if (!tituloEdit.trim()) return alert('Poné un título')
    onEditar?.({ titulo: tituloEdit, cuerpo: cuerpoEdit, categoria: catEdit, descripcion: descripcionEdit, imagen_url: imagenEdit || null })
    setEditando(false)
  }

  const comentariosPadre = (post.comentarios || []).filter(c => !c.parentId)
  const respuestasDe = (parentId: string) => (post.comentarios || []).filter(c => c.parentId === parentId)

  return (
    <article onClick={() => { if (!editando) onAbrirPost?.() }} className="bg-[#171029] border border-[#3B2A66] rounded-2xl overflow-hidden cursor-pointer hover:border-violet-500 transition flex flex-col h-full">
      {post.imagen_url && !editando && (
        <img src={post.imagen_url} alt={post.titulo} className="w-full h-36 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      )}

      <div className="p-3 flex gap-2 flex-1">
        <div className="flex flex-col items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onVote}
            className="bg-[#2E1065] w-8 h-8 rounded-full font-bold text-sm hover:bg-[#FF8A00] hover:text-black"
          >
            ▲
          </button>
          <b className="text-sm">{post.puntos}</b>
          <span className="text-xs text-[#A78BFA]">puntos</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
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
            <div className="space-y-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <input value={tituloEdit} onChange={e => setTituloEdit(e.target.value)} placeholder="Título" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
              <input value={descripcionEdit} onChange={e => setDescripcionEdit(e.target.value)} placeholder="Breve descripción (lo que se ve en la tarjeta)" maxLength={160} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
              <input value={imagenEdit} onChange={e => setImagenEdit(e.target.value)} placeholder="Link de imagen (opcional)" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
              {imagenEdit && <img src={imagenEdit} alt="preview" className="w-full h-28 object-cover rounded-xl" />}
              <select value={catEdit} onChange={e => setCatEdit(e.target.value as Categoria)} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm">
                {['Música', 'Gatos', 'Tecnología', 'Humor', 'Vida', 'Gaming'].map(c => <option key={c}>{c}</option>)}
              </select>
              <textarea value={cuerpoEdit} onChange={e => setCuerpoEdit(e.target.value)} rows={3} placeholder="Escribí tu post..." className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
              <div className="flex gap-2">
                <button onClick={guardarEdicion} className="bg-violet-600 px-3 py-1 rounded-xl text-sm font-bold">Guardar</button>
                <button onClick={() => { setEditando(false); setTituloEdit(post.titulo); setCuerpoEdit(post.cuerpo); setCatEdit(post.categoria); setDescripcionEdit(post.descripcion || ''); setImagenEdit(post.imagen_url || '') }} className="bg-[#2E1065] px-3 py-1 rounded-xl text-sm">Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-base leading-tight font-bold mt-1 hover:text-[#FF8A00] line-clamp-2">{post.titulo}</h3>
              <p className="text-xs text-[#A78BFA] mt-0.5" onClick={(e) => { e.stopPropagation(); onAbrirUsuario?.() }}>
                <span className="cursor-pointer hover:underline">{post.autor.avatar} {post.autor.nombre} @{post.autor.username}</span> · {formatearFecha(post.createdAt)}
              </p>
              <p className="text-sm mt-1.5 text-white/80 line-clamp-2 leading-snug">{descripcion}</p>
              <p className="text-xs text-violet-300 mt-1">Ver post completo →</p>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setAbierto(!abierto)} className="text-sm text-[#A78BFA] mt-1.5 block">
              💬 {post.comentarios?.length || 0} comentarios
            </button>

            {abierto && (
              <div className="mt-2 space-y-2">
                {comentariosPadre.map(c => (
                  <div key={c.id} className="space-y-1">
                    <div className="bg-[#0B0714] p-2 rounded-xl text-sm">
                      <b>{c.autor.avatar} {c.autor.nombre}</b> · {c.texto}
                      <button onClick={() => { setRespondiendoA(respondiendoA === c.id ? null : c.id); setTextoRespuesta('') }} className="text-xs text-[#A78BFA] block mt-1 hover:text-[#FF8A00]">
                        ↩ Responder
                      </button>
                      {respondiendoA === c.id && (
                        <div className="flex gap-2 mt-2">
                          <input value={textoRespuesta} onChange={e => setTextoRespuesta(e.target.value)} placeholder={`Respondiendo a @${c.autor.username}...`} className="flex-1 bg-[#171029] border border-[#3B2A66] rounded-xl p-2 text-sm" />
                          <button onClick={() => { if (textoRespuesta.trim()) { onComentar(textoRespuesta, c.id); setTextoRespuesta(''); setRespondiendoA(null) } }} className="bg-violet-600 px-3 rounded-xl text-sm font-bold">Enviar</button>
                        </div>
                      )}
                    </div>
                    {respuestasDe(c.id).map(r => (
                      <p key={r.id} className="bg-[#0B0714]/60 p-2 rounded-xl text-sm ml-6 border-l-2 border-violet-500">
                        <b>{r.autor.avatar} {r.autor.nombre}</b> · {r.texto}
                      </p>
                    ))}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="Escribí un comentario..." className="flex-1 bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
                  <button onClick={() => { if (texto.trim()) { onComentar(texto); setTexto('') } }} className="bg-violet-600 px-3 rounded-xl text-sm font-bold">Enviar</button>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="flex gap-3 mt-1.5">
                {onEditar && (
                  <button onClick={() => setEditando(true)} className="text-xs text-[#A78BFA] block">
                    ✏ Editar
                  </button>
                )}
                <button onClick={onDelete} className="text-xs text-red-300 block">
                  Borrar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}