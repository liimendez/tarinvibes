import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [msg, setMsg] = useState('')

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

  return (
    <div className="bg-[#171029] border border-[#3B2A66] rounded-2xl p-6 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-black mb-1">Tarin<span className="text-[#FF8A00]">Vibes</span></h2>
      <p className="text-[#A78BFA] text-sm mb-4">{modo === 'login' ? 'Iniciá sesión para postear' : 'Creá tu cuenta'}</p>
      <form onSubmit={enviar} className="space-y-3">
        {modo === 'registro' && (
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Tu username, ej: lii" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
        )}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" className="w-full bg-[#0B0714] border border-[#3B2A66] rounded-xl p-3" />
        <button className="w-full bg-violet-600 p-3 rounded-xl font-bold">{modo === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
      </form>
      <button onClick={() => setModo(modo === 'login' ? 'registro' : 'login')} className="text-sm text-[#A78BFA] mt-3 w-full">
        {modo === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
      </button>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </div>
  )
}