'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos')
      setLoading(false)
    } else {
      router.push('/war-room')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">FTD Nexus</h1>
        <p className="text-gray-500 mb-6">Entre com seu e-mail e senha</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  )
}
