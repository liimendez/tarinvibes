type Props = {
  q: string
  setQ: (v: string) => void
  onInicio: () => void
  onMiPerfil: () => void
  onSalir: () => void
  onNotificaciones: () => void
  onMensajes: () => void
  notificacionesSinLeer: number
  mensajesSinLeer: number
  vistaActual: string
  tema: 'oscuro' | 'claro'
  onCambiarTema: () => void
}

export default function Navbar({ q, setQ, onInicio, onMiPerfil, onSalir, onNotificaciones, onMensajes, notificacionesSinLeer, mensajesSinLeer, vistaActual, tema, onCambiarTema }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-[#0B0714] border-b border-[#3B2A66]">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
        <button onClick={onInicio} className="flex items-center gap-2 shrink-0 text-left">
          <img src="/logo.png" alt="TarinVibes" className="w-14 h-14 object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
          <span className="text- leading-none font-black hidden sm:inline">Tarin<span className="text-orange-500">Vibes</span></span>
        </button>

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar posts..."
          className="flex-1 bg-[#171029] border border-[#3B2A66] rounded-full px-4 py-2 text-sm outline-none focus:border-violet-500"
        />

        <nav className="flex items-center gap-1 shrink-0">
          <button
            onClick={onInicio}
            title="Inicio"
            className={`p-2 rounded-full text-lg ${vistaActual === 'feed' ? 'bg-violet-600' : 'hover:bg-[#2E1065]'}`}
          >
            🏠
          </button>

          <button
            onClick={onNotificaciones}
            title="Notificaciones"
            className="relative p-2 rounded-full text-lg hover:bg-[#2E1065]"
          >
            🔔
            {notificacionesSinLeer > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text- font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {notificacionesSinLeer}
              </span>
            )}
          </button>

          <button
            onClick={onMensajes}
            title="Mensajes"
            className="relative p-2 rounded-full text-lg hover:bg-[#2E1065]"
          >
            💬
            {mensajesSinLeer > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text- font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {mensajesSinLeer}
              </span>
            )}
          </button>

          <button
            onClick={onMiPerfil}
            title="Mi perfil"
            className="p-2 rounded-full text-lg hover:bg-[#2E1065]"
          >
            👤
          </button>

          <button
            onClick={onCambiarTema}
            title={tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-full text-lg hover:bg-[#2E1065]"
          >
            {tema === 'oscuro' ? '☀️' : '🌙'}
          </button>

          <button onClick={onSalir} title="Salir" className="bg-red-500/20 border border-red-500 px-3 py-1 rounded-full text-sm">
            Salir
          </button>
        </nav>
      </div>

      <p className="max-w-7xl mx-auto px-4 pb-2 text-xs text-violet-300 hidden sm:block">
        La comunidad volvió, con otras vibes
      </p>
    </header>
  )
}