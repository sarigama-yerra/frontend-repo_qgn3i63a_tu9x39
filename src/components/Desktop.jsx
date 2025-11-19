import { useEffect, useMemo, useState } from 'react'
import { Menu, AppWindow, Folder, Calculator, Grid, Orbit, Search, Sparkles } from 'lucide-react'

const icons = { Calculator, Grid, Orbit }

function Dock({ apps, onOpen }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2 flex gap-3 shadow-2xl">
      {apps.map((app) => {
        const Icon = icons[app.icon] || AppWindow
        return (
          <button
            key={app.id}
            onClick={() => onOpen(app)}
            title={app.title}
            className="group relative px-3 py-2 rounded-xl hover:bg-white/10 transition flex items-center gap-2 text-white"
          >
            <Icon className="w-5 h-5 drop-shadow" />
            <span className="text-sm hidden sm:block opacity-80 group-hover:opacity-100">{app.title}</span>
            {app.hint && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-black/70 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                {app.hint}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Window({ app, onClose, children }) {
  const Icon = icons[app.icon] || AppWindow
  return (
    <div className="absolute inset-10 bg-slate-900/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between bg-white/10 px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <Icon className="w-4 h-4" />
          <span className="font-semibold">{app.title}</span>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
      </div>
      <div className="h-full overflow-auto">
        {children}
      </div>
    </div>
  )
}

function NumberPlay({ send }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const sum = useMemo(() => (Number(a||0) + Number(b||0)), [a,b])
  useEffect(() => {
    if (a && b) {
      send({ app: 'NumberPlay', type: 'action', payload: { operation: 'add', values: [Number(a), Number(b)] } })
    }
  }, [a,b])
  return (
    <div className="p-6 text-white space-y-4">
      <p className="opacity-80">Play with numbers. What patterns do you notice?</p>
      <div className="grid grid-cols-3 gap-3 max-w-md">
        <input value={a} onChange={e=>setA(e.target.value)} placeholder="a" className="col-span-1 bg-white/10 border border-white/10 px-3 py-2 rounded" />
        <span className="col-span-1 place-self-center text-2xl">+</span>
        <input value={b} onChange={e=>setB(e.target.value)} placeholder="b" className="col-span-1 bg-white/10 border border-white/10 px-3 py-2 rounded" />
      </div>
      <div className="text-3xl font-bold">= {isNaN(sum) ? '—' : sum}</div>
      <p className="text-sm opacity-70">Try different pairs that make the same total.</p>
    </div>
  )
}

function PatternGarden({ send }) {
  const [cells, setCells] = useState(Array(25).fill(false))
  const toggle = (i) => setCells(prev => {
    const next = [...prev]; next[i] = !next[i]; return next;
  })
  useEffect(() => {
    const active = cells.filter(Boolean).length
    if (active >= 8) {
      send({ app: 'PatternGarden', type: 'discovery', payload: { active } })
    }
  }, [cells])
  return (
    <div className="p-6 text-white">
      <p className="opacity-80 mb-3">Click to paint a pattern. Can you create symmetry?</p>
      <div className="grid grid-cols-5 gap-1 w-64">
        {cells.map((on,i) => (
          <button key={i} onClick={() => toggle(i)} className={`aspect-square ${on? 'bg-emerald-400' : 'bg-white/10'} rounded-sm`} />
        ))}
      </div>
    </div>
  )
}

function Forces({ send }) {
  const [left, setLeft] = useState(1)
  const [right, setRight] = useState(1)
  const balanced = left === right
  useEffect(() => {
    if (balanced) send({ app: 'Sandboxes/Forces', type: 'milestone', payload: { built: 'bridge' } })
  }, [balanced])
  return (
    <div className="p-6 text-white space-y-4">
      <p className="opacity-80">Balance the scale by adjusting weights.</p>
      <div className="flex gap-6 items-center">
        <input type="range" min="1" max="10" value={left} onChange={e=>setLeft(Number(e.target.value))} />
        <span className={`text-xl ${balanced? 'text-emerald-400' : 'text-yellow-300'}`}>{balanced? 'Balanced' : 'Tilting'}</span>
        <input type="range" min="1" max="10" value={right} onChange={e=>setRight(Number(e.target.value))} />
      </div>
    </div>
  )
}

export default function Desktop() {
  const [sessionId] = useState(() => Math.random().toString(36).slice(2))
  const [openApp, setOpenApp] = useState(null)
  const [suggestions, setSuggestions] = useState([
    { id: 'NumberPlay', title: 'Number Play', icon: 'Calculator', hint: 'Try making the same total in many ways' },
    { id: 'PatternGarden', title: 'Pattern Garden', icon: 'Grid', hint: 'Paint symmetry and repetition' },
    { id: 'Forces', title: 'Forces Sandbox', icon: 'Orbit', hint: 'Find equilibrium' },
  ])

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const send = async (e) => {
    try {
      await fetch(`${baseUrl}/event`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...e, session_id: sessionId })
      })
      // refresh suggestions silently
      const res = await fetch(`${baseUrl}/suggest/${sessionId}`)
      const data = await res.json()
      if (data?.suggestions) setSuggestions(data.suggestions)
    } catch (err) {
      // ignore for demo resilience
    }
  }

  const handleOpen = (app) => {
    setOpenApp(app)
    send({ app: app.id, type: 'open_app' })
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.15),transparent_40%),radial-gradient(circle_at_80%_100%,rgba(168,85,247,0.15),transparent_40%)]" />

      <header className="relative z-10 flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-2 opacity-80">
          <Menu className="w-5 h-5" />
          <span>LearnOS</span>
        </div>
        <div className="flex items-center gap-2 text-sm opacity-80">
          <Search className="w-4 h-4" />
          <span>Follow your curiosity</span>
        </div>
      </header>

      <main className="relative z-10">
        {openApp ? (
          <Window app={openApp} onClose={() => setOpenApp(null)}>
            {openApp.id === 'NumberPlay' && <NumberPlay send={send} />}
            {openApp.id === 'PatternGarden' && <PatternGarden send={send} />}
            {openApp.id === 'Forces' && <Forces send={send} />}
          </Window>
        ) : (
          <div className="pt-24 pb-36 flex flex-col items-center gap-6">
            <div className="text-center text-white">
              <h1 className="text-4xl font-bold tracking-tight mb-2">Play your way to understanding</h1>
              <p className="opacity-80">Open any app. Tinker. Patterns will emerge. The desktop adapts to you.</p>
            </div>
            <Dock apps={suggestions} onOpen={handleOpen} />
            <div className="absolute bottom-6 right-6 text-white/80 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Adaptive mode
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
