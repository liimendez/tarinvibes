import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [nuevaPass, setNuevaPass] = useState('')
  const [mostrarPass, setMostrarPass] = useState(false)
  const [mostrarNuevaPass, setMostrarNuevaPass] = useState(false)
  const [modo, setModo] = useState<'login' | 'registro' | 'forgot' | 'reset'>(() => window.location.hash.includes('type=recovery') ? 'reset' : 'login')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (window.location.hash.includes('otp_expired')) {
      setMsg('El link expiró o ya se usó. Pedí un link nuevo de recuperación.')
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setModo('reset')
        setMsg('Poné tu nueva contraseña')
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Cargando...')

    if (modo === 'registro') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setMsg('Error: ' + error.message); return }
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: username || email.split('@')[0],
          nombre: username || email.split('@')[0],
          avatar: '🦇',
        })
        setMsg('¡Cuenta creada! Ya podés entrar.')
        setModo('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMsg('Error: ' + error.message); return }
      onLogin()
    }
  }

  async function recuperar(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Cargando...')
    if (!email.trim()) {
      setMsg('Poné tu email para recuperar tu contraseña')
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('¡Listo! Te mandamos un mail con el link para cambiar tu contraseña. Revisá tu bandeja y spam.')
  }

  async function cambiarPass(e: React.FormEvent) {
    e.preventDefault()
    setMsg('Cargando...')
    if (nuevaPass.length < 6) {
      setMsg('La nueva contraseña tiene que tener al menos 6 caracteres')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: nuevaPass })
    if (error) { setMsg('Error: ' + error.message); return }
    setMsg('¡Contraseña cambiada! Ya podés entrar.')
    setModo('login')
    setNuevaPass('')
  }

  return (
    <div className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-6 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-black mb-1">Tarin<span className="text-[#FF8A00]">Vibes</span></h2>
      <p className="text-[#A78BFA] text-sm mb-4">
        {modo === 'login' ? 'Iniciá sesión para postear' : modo === 'registro' ? 'Creá tu cuenta' : modo === 'forgot' ? 'Recuperá tu contraseña' : 'Cambiar contraseña'}
      </p>

      {modo === 'reset' ? (
        <form onSubmit={cambiarPass} className="space-y-3">
          <div className="relative">
            <input type={mostrarNuevaPass ? 'text' : 'password'} value={nuevaPass} onChange={e => setNuevaPass(e.target.value)} placeholder="Nueva contraseña" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3 pr-12" />
            <button type="button" onClick={() => setMostrarNuevaPass(!mostrarNuevaPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xl" title={mostrarNuevaPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {mostrarNuevaPass ? '🙈' : '👁️'}
            </button>
          </div>
          <button className="w-full bg-violet-600 p-3 rounded-xl font-bold">Cambiar contraseña</button>
        </form>
      ) : modo === 'forgot' ? (
        <form onSubmit={recuperar} className="space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Tu email" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
          <button className="w-full bg-violet-600 p-3 rounded-xl font-bold">Enviar link de recuperación</button>
          <button type="button" onClick={() => { setModo('login'); setMsg('') }} className="text-sm text-[#A78BFA] w-full">
            Volver a Entrar
          </button>
        </form>
      ) : (
        <form onSubmit={enviar} className="space-y-3">
          {modo === 'registro' && (
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Tu username, ej: lii" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
          )}
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
          {/* 👇 ACÁ ESTÁ EL OJITO */}
          <div className="relative">
            <input type={mostrarPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3 pr-12" />
            <button type="button" onClick={() => setMostrarPass(!mostrarPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xl" title={mostrarPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {mostrarPass ? '🙈' : '👁️'}
            </button>
          </div>
          <button className="w-full bg-violet-600 p-3 rounded-xl font-bold">{modo === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
        </form>
      )}

      {(modo === 'login' || modo === 'registro') && (
        <button onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setMsg('') }} className="text-sm text-[#A78BFA] mt-3 w-full">
          {modo === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      )}

      {modo === 'login' && msg.startsWith('Error') && (
        <div className="mt-4 bg-[#FF8A00]/10 border border-[#FF8A00] rounded-xl p-3 text-center">
          <p className="text-sm">¿Has olvidado tu contraseña?</p>
          <button onClick={() => { setModo('forgot'); setMsg('') }} className="text-sm font-bold text-[#FF8A00] underline">
            Recuperala acá
          </button>
        </div>
      )}

      {msg && <p className="text-sm mt-2">{msg}</p>}
    </div>
  )
}