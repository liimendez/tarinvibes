import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Post, User } from '../data/types'

type Props = {
  usuario: User
  posts: Post[]
  isOwn?: boolean
  onVolver: () => void
  onAbrirPost: (post: Post) => void
  onTagClick?: (tag: string) => void
  onPerfilActualizado?: () => void
}

const AVATARES = ['🦇', '🐱', '🎸', '🔥', '🌙', '🎤', '🐺', '💜', '🦋', '🎮']

export default function UserPanel({ usuario, posts, isOwn, onVolver, onAbrirPost, onTagClick, onPerfilActualizado }: Props) {
  const [editando, setEditando] = useState(false)
  const [nombreEdit, setNombreEdit] = useState(usuario.nombre)
  const [usernameEdit, setUsernameEdit] = useState(usuario.username)
  const [avatarEdit, setAvatarEdit] = useState(usuario.avatar)
  const [bioEdit, setBioEdit] = useState(usuario.bio || '')
  const [ciudadEdit, setCiudadEdit] = useState(usuario.ciudad || '')
  const [peliEdit, setPeliEdit] = useState(usuario.peli_fav || '')
  const [nuevaClave, setNuevaClave] = useState('')
  const [repetirClave, setRepetirClave] = useState('')
  const [guardando, setGuardando] = useState(false)

  const misPosts = posts.filter(p => p.autor.id === usuario.id)
  const totalPuntos = misPosts.reduce((acc, p) => acc + p.puntos, 0)
  const totalComentarios = posts.reduce((acc, p) => acc + (p.comentarios?.filter(c => c.autor.id === usuario.id).length || 0), 0)

  async function guardar() {
    if (!nombreEdit.trim()) return alert('Poné un nombre')
    if (!usernameEdit.trim()) return alert('Poné un username')
    if (nuevaClave && nuevaClave.length < 6) return alert('La clave tiene que tener mínimo 6 caracteres')
    if (nuevaClave && nuevaClave !== repetirClave) return alert('Las claves no coinciden')

    const usernameLimpio = usernameEdit.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '')

    const { data: existe } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', usernameLimpio)
      .neq('id', usuario.id)
      .maybeSingle()

    if (existe) return alert('Ese username ya está usado, elegí otro')

    setGuardando(true)

    const { error } = await supabase.from('profiles').update({
      nombre: nombreEdit.trim(),
      username: usernameLimpio,
      avatar: avatarEdit,
      bio: bioEdit.trim(),
      ciudad: ciudadEdit.trim(),
      peli_fav: peliEdit.trim(),
    }).eq('id', usuario.id)

    if (error) {
      setGuardando(false)
      return alert('Error al guardar perfil: ' + error.message)
    }

    if (nuevaClave) {
      const { error: errorClave } = await supabase.auth.updateUser({ password: nuevaClave })
      if (errorClave) {
        setGuardando(false)
        return alert('Perfil guardado, pero la clave no se pudo cambiar: ' + errorClave.message)
      }
    }

    setGuardando(false)
    setEditando(false)
    setNuevaClave('')
    setRepetirClave('')
    alert('¡Perfil actualizado!')
    onPerfilActualizado?.()
  }

  function cancelar() {
    setEditando(false)
    setNombreEdit(usuario.nombre)
    setUsernameEdit(usuario.username)
    setAvatarEdit(usuario.avatar)
    setBioEdit(usuario.bio || '')
    setCiudadEdit(usuario.ciudad || '')
    setPeliEdit(usuario.peli_fav || '')
    setNuevaClave('')
    setRepetirClave('')
  }

  return (
    <div className="space-y-4">
      <button onClick={onVolver} className="text-sm text-[#A78BFA]">← Volver al feed</button>

      <div className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-6 text-center">
        <div className="text-6xl">{editando ? avatarEdit : usuario.avatar}</div>
        {!editando ? (
          <>
            <h2 className="text-2xl font-black mt-2">{usuario.nombre}</h2>
            <p className="text-[#A78BFA]">@{usuario.username}</p>
            {usuario.bio && <p className="mt-2 text-sm max-w-md mx-auto">{usuario.bio}</p>}
            {usuario.ciudad && <p className="text-xs text-[#A78BFA] mt-1">📍 {usuario.ciudad}</p>}
            {usuario.peli_fav && <p className="text-xs text-[#A78BFA] mt-1">🎬 Película favorita: {usuario.peli_fav}</p>}
          </>
        ) : (
          <div className="space-y-2 mt-3 text-left max-w-sm mx-auto">
            <label className="text-xs text-[#A78BFA]">Nombre</label>
            <input value={nombreEdit} onChange={e => setNombreEdit(e.target.value)} placeholder="Tu nombre" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <label className="text-xs text-[#A78BFA]">Username</label>
            <input value={usernameEdit} onChange={e => setUsernameEdit(e.target.value)} placeholder="tu username sin @" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <label className="text-xs text-[#A78BFA]">Avatar</label>
            <div className="flex gap-2 flex-wrap justify-center">
              {AVATARES.map(a => (
                <button key={a} type="button" onClick={() => setAvatarEdit(a)} className={avatarEdit === a ? 'text-2xl bg-violet-600 rounded-xl p-1' : 'text-2xl bg-[#0B0714] border border-[#3B2A66] rounded-xl p-1'}>{a}</button>
              ))}
            </div>
            <label className="text-xs text-[#A78BFA]">Sobre mí</label>
            <textarea value={bioEdit} onChange={e => setBioEdit(e.target.value)} placeholder="Contanos algo de vos... ej: fan de Jim Carrey" rows={2} className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <label className="text-xs text-[#A78BFA]">Ciudad</label>
            <input value={ciudadEdit} onChange={e => setCiudadEdit(e.target.value)} placeholder="Ej: Temperley" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <label className="text-xs text-[#A78BFA]">Película favorita</label>
            <input value={peliEdit} onChange={e => setPeliEdit(e.target.value)} placeholder="Ej: La máscara" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <hr className="border-[#3B2A66] my-2" />
            <p className="text-sm font-bold">🔒 Cambiar contraseña <span className="text-xs text-[#A78BFA] font-normal">(dejalo vacío si no querés cambiarla)</span></p>
            <input type="password" value={nuevaClave} onChange={e => setNuevaClave(e.target.value)} placeholder="Nueva contraseña" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <input type="password" value={repetirClave} onChange={e => setRepetirClave(e.target.value)} placeholder="Repetí la nueva contraseña" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-2 text-sm" />
            <div className="flex gap-2 justify-center">
              <button onClick={guardar} disabled={guardando} className="bg-violet-600 px-4 py-2 rounded-xl font-bold text-sm">{guardando ? 'Guardando...' : 'Guardar'}</button>
              <button onClick={cancelar} className="bg-[#2E1065] px-4 py-2 rounded-xl text-sm">Cancelar</button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div><b className="block text-lg">{misPosts.length}</b>posts</div>
          <div><b className="block text-lg">{totalPuntos}</b>puntos</div>
          <div><b className="block text-lg">{totalComentarios}</b>comentarios</div>
        </div>

        {isOwn && !editando && (
          <button onClick={() => setEditando(true)} className="mt-4 bg-violet-600 px-4 py-2 rounded-xl font-bold text-sm">✏️ Editar mi perfil</button>
        )}
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