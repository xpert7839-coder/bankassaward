"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Phone, Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { recordUserConnection } from "@/lib/anti-fraud"
import type { User } from "@/hooks/use-api-data"

interface SimpleLoginProps {
  onSuccess: (user: User) => void
  onSwitchToSignup: () => void
}

export function SimpleLogin({ onSuccess, onSwitchToSignup }: SimpleLoginProps) {
  const [formData, setFormData] = useState({
    phone: "",
    password: ""
  })
  
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminData, setAdminData] = useState({
    email: "",
    password: ""
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockTimeLeft, setBlockTimeLeft] = useState(0)

  // Obtenir l'IP client
  const getClientIP = (): string | undefined => {
    if (typeof window !== 'undefined') {
      return undefined
    }
    return undefined
  }

  const handleInputChange = (field: string, value: string) => {
    if (isAdminMode) {
      setAdminData(prev => ({ ...prev, [field]: value }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    setMessage(null)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      // Connexion admin via API
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminData.email,
          password: adminData.password
        })
      })

      if (response.ok) {
        const { user } = await response.json()
        
        // Enregistrer la connexion admin
        recordUserConnection(user, getClientIP(), navigator.userAgent)
        
        // Stocker la session admin
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('isAdmin', 'true')
        
        setMessage({
          type: "success",
          text: "Connexion administrateur réussie ! Redirection..."
        })
        
        setTimeout(() => {
          onSuccess(user)
        }, 1500)
        
      } else {
        const error = await response.json()
        setMessage({
          type: "error",
          text: error.error || "Identifiants administrateur incorrects"
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erreur de connexion admin. Veuillez réessayer."
      })
    }

    setIsSubmitting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isBlocked) {
      setMessage({
        type: "error",
        text: `Compte temporairement bloqué. Réessayez dans ${blockTimeLeft} secondes.`
      })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      // Normaliser le numéro de téléphone
      const normalizedPhone = formData.phone.replace(/\D/g, '')
      const formattedPhone = normalizedPhone.startsWith('223') ? `+${normalizedPhone}` : `+223${normalizedPhone}`

      // Tenter la connexion
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          password: formData.password
        })
      })

      if (response.ok) {
        const { user } = await response.json()
        
        // Enregistrer la connexion pour la sécurité
        recordUserConnection(user, getClientIP(), navigator.userAgent)
        
        // Stocker la session
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('loginTime', Date.now().toString())
        
        setMessage({
          type: "success",
          text: "Connexion réussie ! Redirection en cours..."
        })
        
        // Réinitialiser les tentatives
        setAttempts(0)
        
        setTimeout(() => {
          onSuccess(user)
        }, 1500)
        
      } else {
        const error = await response.json()
        
        // Incrémenter les tentatives
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        
        // Bloquer après 3 tentatives échouées
        if (newAttempts >= 3) {
          setIsBlocked(true)
          setBlockTimeLeft(300) // 5 minutes
          startBlockCountdown()
          
          setMessage({
            type: "error",
            text: "Trop de tentatives échouées. Compte bloqué pendant 5 minutes."
          })
        } else {
          setMessage({
            type: "error",
            text: error.error || `Identifiants incorrects. Tentative ${newAttempts}/3`
          })
        }
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erreur de connexion. Veuillez réessayer."
      })
    }

    setIsSubmitting(false)
  }

  const startBlockCountdown = () => {
    const interval = setInterval(() => {
      setBlockTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsBlocked(false)
          setAttempts(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isAdminMode ? "Connexion Administrateur" : "Connexion Sécurisée"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isAdminMode 
              ? "Accédez à votre espace d'administration"
              : "Accédez à votre espace avec votre numéro de téléphone"
            }
          </p>
        </div>

        {/* Toggle Admin/User */}
        <div className="mb-6 flex items-center justify-center">
          <div className="bg-muted/50 rounded-lg p-1 flex">
            <button
              onClick={() => setIsAdminMode(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !isAdminMode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Utilisateur
            </button>
            <button
              onClick={() => setIsAdminMode(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isAdminMode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Administrateur
            </button>
          </div>
        </div>

        {/* Alertes de sécurité */}
        {attempts > 0 && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4" />
              <span>
                {attempts === 1 && "Attention : Vérifiez bien vos identifiants"}
                {attempts === 2 && "Dernière tentative avant blocage"}
                {attempts >= 3 && "Compte bloqué temporairement"}
              </span>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={isAdminMode ? handleAdminLogin : handleSubmit} className="space-y-6">
          {isAdminMode ? (
            // Formulaire Admin
            <>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email administrateur</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="admin@bankassawards.com"
                    className="pl-11 h-12"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="admin-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={adminData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Mot de passe administrateur"
                    className="pl-11 pr-11 h-12"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Formulaire Utilisateur
            <>
              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+223 XX XX XX XX"
                    className="pl-11 h-12"
                    required
                    disabled={isSubmitting || isBlocked}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Numéro malien valide requis
                </p>
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="Votre mot de passe"
                    className="pl-11 pr-11 h-12"
                    required
                    disabled={isSubmitting || isBlocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isSubmitting || isBlocked}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </motion.div>
          )}

          {/* Bouton de connexion */}
          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
            disabled={isSubmitting || isBlocked || (!isAdminMode && (!formData.phone || !formData.password)) || (isAdminMode && (!adminData.email || !adminData.password))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isAdminMode ? "Connexion admin..." : "Connexion en cours..."}
              </>
            ) : isBlocked ? (
              `Bloqué (${formatTime(blockTimeLeft)})`
            ) : (
              isAdminMode ? "Se connecter en tant qu'admin" : "Se connecter"
            )}
          </Button>
        </form>

        {/* Informations de sécurité */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2">
            🔐 Sécurité de connexion
          </h4>
          <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <li>• Protection contre les tentatives multiples</li>
            <li>• Blocage automatique après 3 échecs</li>
            <li>• Traçabilité des connexions</li>
            <li>• Un seul compte par numéro de téléphone</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Pas encore de compte ?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-primary hover:underline font-medium"
            >
              Inscrivez-vous
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Mot de passe oublié ? Contactez l'administration
          </p>
        </div>
      </div>
    </motion.div>
  )
}
