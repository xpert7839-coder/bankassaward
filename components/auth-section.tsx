"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, UserIcon, MapPin, Phone, Briefcase, Eye, EyeOff, Check, AlertCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordRecovery } from "@/components/password-recovery"
import type { Page } from "@/app/page"
import type { User } from "@/hooks/use-api-data"

interface AuthSectionProps {
  setCurrentPage: (page: Page) => void
  setCurrentUser: (user: User | null) => void
  users: User[]
  setUsers: (users: User[]) => void
}

const SUPER_ADMIN_EMAIL = "admin@bankassawards.com"
const SUPER_ADMIN_PASSWORD = "admin2024"

export function AuthSection({ setCurrentPage, setCurrentUser, users, setUsers }: AuthSectionProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Signup form state
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupDomain, setSignupDomain] = useState("")
  const [signupCity, setSignupCity] = useState("")
  const [signupPhone, setSignupPhone] = useState("")

  const domains = [
    "Sport",
    "Musique",
    "Entrepreneuriat",
    "Événementiel",
    "Technologie",
    "Social/Communautaire",
    "Éducation",
    "Autre",
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    await new Promise((r) => setTimeout(r, 500))

    // Vérifier si c'est l'admin
    if (loginEmail === SUPER_ADMIN_EMAIL && loginPassword === SUPER_ADMIN_PASSWORD) {
      const adminUser: User = {
        id: "super_admin_001",
        name: "Super Admin",
        email: SUPER_ADMIN_EMAIL,
        role: "SUPER_ADMIN",
        createdAt: new Date().toISOString(),
      }
      setCurrentUser(adminUser)
      setMessage({ type: "success", text: "Connexion administrateur réussie !" })
      setTimeout(() => setCurrentPage("admin"), 1000)
      setIsLoading(false)
      return
    }

    // Vérifier l'authentification via l'API
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      })
      
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
        setMessage({ type: "success", text: "Connexion réussie !" })
        setTimeout(() => setCurrentPage("vote"), 1000)
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Email ou mot de passe incorrect" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur de connexion" })
    }

    setIsLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    await new Promise((r) => setTimeout(r, 500))

    if (users.find((u) => u.email === signupEmail)) {
      setMessage({ type: "error", text: "Cet email est déjà utilisé" })
      setIsLoading(false)
      return
    }

    if (signupEmail === SUPER_ADMIN_EMAIL) {
      setMessage({ type: "error", text: "Cet email est réservé" })
      setIsLoading(false)
      return
    }

    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      domain: signupDomain,
      city: signupCity,
      phone: signupPhone,
      role: "VOTER",
      createdAt: new Date().toISOString(),
    }

    setUsers([...users, newUser as User])
    setMessage({ type: "success", text: "Inscription réussie ! Vous pouvez maintenant vous connecter." })
    setTimeout(() => {
      setActiveTab("login")
      setLoginEmail(signupEmail)
    }, 1500)

    setIsLoading(false)
  }

  if (showPasswordRecovery) {
    return (
      <section className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
        <PasswordRecovery users={users} setUsers={setUsers} onBack={() => setShowPasswordRecovery(false)} />
      </section>
    )
  }

  return (
    <section className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex bg-muted/50">
            {(["login", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setMessage(null)
                }}
                className={`flex-1 py-4 text-sm font-semibold transition-all relative ${
                  activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "login" ? "Connexion" : "Inscription"}
                {activeTab === tab && (
                  <motion.div layoutId="authTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Bon retour !</h2>
                    <p className="text-muted-foreground text-sm">Connectez-vous pour continuer à VOTER</p>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Admin: admin@bankassawards.com / admin2024
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="loginEmail"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="loginPassword">Mot de passe</Label>
                      <button
                        type="button"
                        onClick={() => setShowPasswordRecovery(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-11 pr-11 h-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Créer un compte</h2>
                    <p className="text-muted-foreground text-sm">Rejoignez la communauté BANKASS AWARDS</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupName">Nom complet</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signupName"
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Votre nom"
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signupEmail"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signupDomain">Domaine</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                          id="signupDomain"
                          value={signupDomain}
                          onChange={(e) => setSignupDomain(e.target.value)}
                          className="w-full h-12 pl-11 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                          required
                        >
                          <option value="">Sélectionnez...</option>
                          {domains.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signupCity">Ville</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="signupCity"
                          type="text"
                          value={signupCity}
                          onChange={(e) => setSignupCity(e.target.value)}
                          placeholder="Votre ville"
                          className="pl-11 h-12"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPhone">
                      Téléphone <span className="text-muted-foreground text-xs">(optionnel)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signupPhone"
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="+223 XX XX XX XX"
                        className="pl-11 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-11 pr-11 h-12"
                        required
                        minLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      "S'inscrire"
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
                    message.type === "success"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {message.type === "success" ? (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
