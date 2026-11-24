import type { Post, User } from '../data/types'

type Props = {
  usuario: User
  posts: Post[]
  onVolver: () => void
  onAbrirPost: (post: Post) => void
  onTagClick?: (tag: string) => void
}

export default function UserPanel({ usuario, posts, onVolver, onAbrirPost, onTagClick }: Props) {
  const misPosts = posts.filter(p => p.autor.id === usuario.id)
  const totalPuntos = misPosts.reduce((acc, p) => acc + p.puntos, 0)
  const totalComentarios = posts.reduce((acc, p) => acc + (p.comentarios?.filter(c => c.autor.id === usuario.id).length || 0), 0)

  return (
    <div className="space-y-4">
      <button onClick={onVolver} className="text-sm text-[#A78BFA]">← Volver al feed</button>

      <div className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-6 text-center">
        <div className="text-6xl">{usuario.avatar}</div>
        <h2 className="text-2xl font-black mt-2">{usuario.nombre}</h2>
        <p className="text-[#A78BFA]">@{usuario.username}</p>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div><b className="block text-lg">{misPosts.length}</b>posts</div>
          <div><b className="block text-lg">{totalPuntos}</b>puntos</div>
          <div><b className="block text-lg">{totalComentarios}</b>comentarios</div>
        </div>
      </div>

      <h3 className="font-bold">Posts de @{usuario.username}</h3>
      {misPosts.length === 0 ? (
        <p className="bg-[#171029] p-4 rounded-2xl">Todavía no publicó nada.</p>
      ) : misPosts.map(p => (
        <article key={p.id} onClick={() => onAbrirPost(p)} className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 cursor-pointer hover:border-[#FF8A00]">
          <div className="flex gap-2 flex-wrap">
            <span className="bg-[#2E1065] px-2 py-0.5 rounded-full text-xs">{p.categoria}</span>
            {p.tags.map(t => (
              <span key={t} onClick={(e) => { e.stopPropagation(); onTagClick?.(t) }} className="text-xs text-[#FF8A00] bg-[#FF8A00]/10 border border-[#FF8A00]/30 px-2 py-0.5 rounded-full">#{t}</span>
            ))}
          </div>
          <h4 className="font-bold mt-1">{p.titulo}</h4>
          <p className="text-sm text-[#A78BFA] mt-1">{p.puntos} puntos · 💬 {p.comentarios?.length || 0} comentarios · {p.createdAt}</p>
          <p className="text-sm mt-1 line-clamp-2">{p.cuerpo}</p>
        </article>
      ))}
    </div>
  )
}