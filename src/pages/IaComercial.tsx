import { useEffect, useRef, useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Button, Input } from '../components/ui/Field'
import { formatTime } from '../lib/date'

const SUGGESTIONS = [
  'Quem eu preciso contatar hoje?',
  'Quem está há 60 dias sem comprar?',
  'Me dá um resumo da carteira',
  'Faça follow-up com o João daqui 30 dias sobre o orçamento de fechaduras',
]

export default function IaComercial() {
  const { aiMessages, askAi } = useAppStore()
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages.length])

  function submit(value?: string) {
    const q = (value ?? text).trim()
    if (!q) return
    askAi(q)
    setText('')
  }

  return (
    <div className="flex h-[calc(100dvh-96px)] flex-col sm:h-[calc(100dvh-104px)]">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#3FA9A0]/15 text-[#3FA9A0]">
          <Sparkles size={17} />
        </div>
        <div>
          <h1 className="text-[16px] font-bold">IA Comercial</h1>
          <p className="text-[12px] text-[#8F8676]">Pergunte sobre sua carteira ou peça para agendar um follow-up</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-[#E4DCC8] bg-[#FFFFFF] p-4">
        {aiMessages.map((m) => (
          <div key={m.id} className={`flex ${m.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] whitespace-pre-line rounded-[10px] px-3.5 py-2.5 text-[13px] ${m.autor === 'usuario' ? 'bg-[#E2963C]/15 text-[#2B2620]' : 'bg-[#ECE5D6] text-[#2B2620]'}`}>
              {m.texto}
              <div className="mono mt-1.5 text-[10px] text-[#8F8676]">{formatTime(m.hora)}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => submit(s)} className="rounded-full border border-[#E4DCC8] bg-[#F3EEE3] px-2.5 py-1 text-[11.5px] text-[#8F8676] hover:text-[#5A5346]">
            {s}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Pergunte algo sobre sua carteira…"
          className="flex-1"
        />
        <Button onClick={() => submit()}><Send size={14} /></Button>
      </div>
    </div>
  )
}
