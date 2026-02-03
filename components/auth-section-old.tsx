"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, UserIcon, MapPin, Phone, Briefcase, Eye, EyeOff, Check, AlertCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordRecovery } from "@/components/password-recovery"
import { SecurityValidation } from "@/components/security-badge"
import { SimpleSignup } from "@/components/simple-signup"
import type { Page } from "@/app/page"
import type { User } from "@/hooks/use-api-data"
import { validateSignup } from "@/lib/validation"
import { useUsers } from "@/hooks/use-api-data"

interface AuthSectionProps {
  setCurrentPage: (page: Page) => void
  setCurrentUser: (user: User | null) => void
}

const SUPER_ADMIN_EMAIL = "admin@bankassawards.com"
const SUPER_ADMIN_PASSWORD = "admin2024"

export function AuthSection({ setCurrentPage, setCurrentUser }: AuthSectionProps) {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)
  const [securityValidation, setSecurityValidation] = useState<any>(null)
  
  const { users } = useUsers()

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
    setSecurityValidation(null)

    // Valider les données avec le système de sécurité
    const signupData = {
      fullName: signupName,
      email: signupEmail,
      phone: signupPhone,
      domain: signupDomain,
      city: signupCity,
      password: signupPassword
    }

    const validation = validateSignup(signupData, users || [])
    setSecurityValidation(validation)

    if (!validation.isValid) {
      setMessage({ 
        type: "error", 
        text: `Erreur de sécurité: ${validation.errors[0]}` 
      })
      setIsLoading(false)
      return
    }

    // Afficher les avertissements s'il y en a
    if (validation.warnings.length > 0) {
      setMessage({ 
        type: "error", 
        text: `Avertissement: ${validation.warnings[0]}` 
      })
    }

    await new Promise((r) => setTimeout(r, 500))

    if (signupEmail === SUPER_ADMIN_EMAIL) {
      setMessage({ type: "error", text: "Cet email est réservé" })
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
          domain: signupDomain,
          city: signupCity,
          phone: signupPhone,
          role: "VOTER",
        })
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Inscription réussie ! Votre compte a été validé avec succès." })
        setTimeout(() => {
          setActiveTab("login")
          setLoginEmail(signupEmail)
        }, 1500)

        // Réinitialiser le formulaire
        setSignupName("")
        setSignupEmail("")
        setSignupPassword("")
        setSignupDomain("")
        setSignupCity("")
        setSignupPhone("")
        setSecurityValidation(null)
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Erreur lors de l'inscription" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erreur de connexion. Veuillez réessayer." })
    }

    setIsLoading(false)
  }

  if (showPasswordRecovery) {
    return (
      <section className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Récupération de mot de passe temporairement désactivée</p>
          <Button onClick={() => setShowPasswordRecovery(false)} className="mt-4">
            Retour
          </Button>
        </div>
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
                      Admin: Connectez-vous avec un compte administrateur pour accéder à la section admin 
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
                <SimpleSignup
                  onSuccess={(user) => {
                    setCurrentUser(user)
                    setCurrentPage("home")

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
                          Admin: Connectez-vous avec un compte administrateur pour accéder à la section admin 
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
                    <SimpleSignup
                      onSuccess={(user) => {
                        setCurrentUser(user)
                        setCurrentPage("home")
                      }}
                      onSwitchToLogin={() => setActiveTab("login")}
                      existingUsers={users || []}
                    />
                  )}
                </AnimatePresence>

                {/* Messages */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
                        message.type === 'success' 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span>{message.text}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </section>
      )
    }
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
