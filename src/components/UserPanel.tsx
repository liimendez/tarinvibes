import type { Post, User } from '../data/types'

type Props = {
  usuario: User
  posts: Post[]
  isOwn: boolean
  onVolver: () => void
  onAbrirPost: (p: Post) => void
  onTagClick?: (tag: string) => void
  onPerfilActualizado?: () => void
  onMensaje?: (usuario: User) => void
}

export default function UserPanel({ usuario, posts, isOwn, onVolver, onAbrirPost, onTagClick, onMensaje }: Props) {
  const misPosts = posts.filter(p => p.autor.id === usuario.id)
  const misPuntos = misPosts.reduce((acc, p) => acc + p.puntos, 0)
  const misComentarios = posts.reduce((acc, p) => acc + p.comentarios.filter(c => c.autor.id === usuario.id).length, 0)

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
      <button onClick={onVolver} className="text-sm text-[#A78BFA]">← Volver al feed</button>

      <div className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-6 text-center">
        <div className="text-6xl">{usuario.avatar}</div>
        <h2 className="text-2xl font-black mt-2">{usuario.nombre}</h2>
        <p className="text-[#A78BFA]">@{usuario.username}</p>

        {usuario.bio && <p className="mt-2 text-sm">{usuario.bio}</p>}
        {usuario.ciudad && <p className="text-xs text-[#A78BFA] mt-1">📍 {usuario.ciudad}</p>}
        {usuario.peli_fav && <p className="text-xs text-[#A78BFA] mt-1">🎬 Película favorita: {usuario.peli_fav}</p>}

        {/* BOTON MENSAJE - solo si NO es mi perfil */}
        {!isOwn && (
          <button
            onClick={() => onMensaje?.(usuario)}
            className="mt-4 bg-violet-600 hover:bg-violet-500 px-5 py-2 rounded-full font-bold text-sm"
          >
            💬 Enviar mensaje
          </button>
        )}

        {isOwn && (
          <p className="mt-4 text-xs text-[#A78BFA]">Este es tu perfil</p>
        )}

        <div className="flex justify-center gap-8 mt-4 text-sm">
          <div className="text-center">
            <p className="font-bold text-lg">{misPosts.length}</p>
            <p className="text-[#A78BFA] text-xs">posts</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{misPuntos}</p>
            <p className="text-[#A78BFA] text-xs">puntos</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">{misComentarios}</p>
            <p className="text-[#A78BFA] text-xs">comentarios</p>
          </div>
        </div>
      </div>

      <h3 className="font-bold">Posts de @{usuario.username}</h3>

      {misPosts.length === 0 ? (
        <p className="bg-[#171029] p-4 rounded-2xl text-sm text-[#A78BFA]">Todavía no publicó nada.</p>
      ) : (
        <div className="space-y-3">
          {misPosts.map(p => (
            <div key={p.id} onClick={() => onAbrirPost(p)} className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-4 cursor-pointer hover:border-violet-500">
              <div className="flex gap-2 flex-wrap">
                <span className="bg-[#2E1065] px-2 py-0.5 rounded-full text-xs">{p.categoria}</span>
                {p.tags.map(t => (
                  <button key={t} onClick={(e) => { e.stopPropagation(); onTagClick?.(t) }} className="text-xs text-[#FF8A00] bg-[#FF8A00]/10 border border-[#FF8A00]/30 px-2 py-0.5 rounded-full">#{t}</button>
                ))}
              </div>
              <h4 className="font-bold mt-2">{p.titulo}</h4>
              <p className="text-xs text-[#A78BFA] mt-1">{p.puntos} puntos · 💬 {p.comentarios.length} comentarios · {p.createdAt}</p>
              {p.descripcion && <p className="text-sm mt-2 line-clamp-2">{p.descripcion}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}