import { useState } from 'react'
import type { Post } from '../data/types'

type Props = {
  post: Post
  onVote: () => void
  onDelete: () => void
  onComentar: (texto: string) => void
}

export default function PostCard({ post, onVote, onDelete, onComentar }: Props) {
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)

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
            <span key={t} className="text-xs text-[#A78BFA]">
              #{t}
            </span>
          ))}
        </div>

        <h3 className="text-lg font-bold mt-1">{post.titulo}</h3>
        <p className="text-sm text-[#A78BFA]">
          {post.autor.avatar} {post.autor.nombre} @{post.autor.username} · {post.createdAt}
        </p>
        <p className="text-sm mt-2">{post.cuerpo}</p>

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

        <button onClick={onDelete} className="text-xs text-red-300 mt-2 block">
          Borrar
        </button>
      </div>
    </article>
  )
}