"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { UserIcon, MapPin, Phone, Briefcase, Shield, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateSimpleSignup } from "@/lib/simple-validation"
import { SMSService } from "@/lib/sms-service"
import { validateSignup, recordUserConnection } from "@/lib/anti-fraud"
import type { User } from "@/hooks/use-api-data"

interface SimpleSignupProps {
  onSuccess: (user: User) => void
  onSwitchToLogin: () => void
  existingUsers: User[]
}

type SignupStep = "form" | "validation" | "success"

export function SimpleSignup({ onSuccess, onSwitchToLogin, existingUsers }: SimpleSignupProps) {
  const [currentStep, setCurrentStep] = useState<SignupStep>("form")
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    domain: "",
    city: ""
  })
  
  const [startTime] = useState(Date.now())
  
  const [validationCode, setValidationCode] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [validation, setValidation] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [canResendCode, setCanResendCode] = useState(true)
  const [resendCountdown, setResendCountdown] = useState(0)

  const domains = [
    "Musique", "Audiovisuel", "Journalisme", "Marketing", 
    "Communication", "Production", "Événementiel", "Art", 
    "Culture", "Sport", "Éducation", "Technologie", "Autre"
  ]

  const smsService = SMSService.getInstance()

  // Obtenir l'IP client (simplifié pour le développement)
  const getClientIP = (): string | undefined => {
    // En production, utiliser une vraie détection d'IP
    if (typeof window !== 'undefined') {
      return undefined // Pour le développement
    }
    return undefined
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidation(null)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      // 1. Validation anti-fraude avancée
      const fraudDetection = validateSignup(
        { ...formData, startTime },
        existingUsers,
        getClientIP()
      )

      if (!fraudDetection.allowed) {
        setMessage({
          type: "error",
          text: `Inscription bloquée pour sécurité. Raison: ${fraudDetection.reasons.join(", ")}`
        })
        setIsSubmitting(false)
        return
      }

      if (fraudDetection.riskLevel === "MEDIUM") {
        setMessage({
          type: "error",
          text: `Risque détecté: ${fraudDetection.reasons.join(", ")}. Veuillez contacter l'administration.`
        })
        setIsSubmitting(false)
        return
      }

      // 2. Valider les données de base
      const validationResult = validateSimpleSignup(formData, existingUsers)
      setValidation(validationResult)

      if (!validationResult.isValid) {
        setMessage({
          type: "error",
          text: validationResult.errors[0]
        })
        setIsSubmitting(false)
        return
      }

      // Envoyer le code de validation par SMS
      const smsResult = await smsService.sendValidationCode(formData.phone)

      if (!smsResult.success) {
        setMessage({
          type: "error",
          text: "Erreur lors de l'envoi du SMS. Vérifiez le numéro de téléphone."
        })
        setIsSubmitting(false)
        return
      }

      // Stocker le mot de passe généré
      setGeneratedPassword(validationResult.generatedPassword!)
      
      // Auto-saisir le code et valider automatiquement
      setValidationCode(smsResult.code!)
      
      // Passer directement à l'étape de validation avec auto-validation
      setCurrentStep("validation")
      setCanResendCode(false)
      startResendCountdown()
      
      setMessage({
        type: "success",
        text: `Code reçu pour ${formData.phone}. Validation automatique en cours...`
      })

      // Valider automatiquement le code après 2 secondes
      setTimeout(async () => {
        await handleAutoValidation(smsResult.code!)
      }, 2000)

    } catch (error) {
      setMessage({
        type: "error",
        text: "Erreur de connexion. Veuillez réessayer."
      })
    }

    setIsSubmitting(false)
  }

  const handleAutoValidation = async (code: string) => {
    setIsSubmitting(true)
    setMessage({
      type: "success",
      text: "Validation du code en cours..."
    })

    try {
      const validationResult = smsService.validateCode(formData.phone, code)

      if (!validationResult.success) {
        setMessage({
          type: "error",
          text: validationResult.message
        })
        setIsSubmitting(false)
        return
      }

      // Code validé, créer l'utilisateur
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.phone,
          password: generatedPassword,
          domain: formData.domain,
          city: formData.city,
          role: "VOTER",
        })
      })

      if (response.ok) {
        // Envoyer le mot de passe par SMS
        await smsService.sendPassword(formData.phone, generatedPassword)
        
        const newUser = await response.json()
        
        // Enregistrer la connexion pour la sécurité
        recordUserConnection(newUser, getClientIP(), navigator.userAgent)
        
        // Stocker l'utilisateur et le connecter directement
        localStorage.setItem('user', JSON.stringify(newUser))
        localStorage.setItem('isLoggedIn', 'true')
        
        setCurrentStep("success")
        setMessage({
          type: "success",
          text: `Compte créé et connecté avec succès ! Mot de passe envoyé au ${formData.phone}`
        })
        
        // Rediriger vers la page d'accueil après 2 secondes
        setTimeout(() => {
          onSuccess(newUser)
        }, 2000)
      } else {
        const error = await response.json()
        // Messages d'erreur clairs en français
        let errorMessage = "Une erreur est survenue lors de l'inscription"
        
        if (error.error) {
          if (error.error.includes('téléphone est déjà utilisé')) {
            errorMessage = "❌ Ce numéro de téléphone est déjà enregistré. Veuillez vous connecter."
          } else if (error.error.includes('email est requise')) {
            errorMessage = "⚠️ Erreur technique: Veuillez réessayer ou contacter l'administrateur."
          } else if (error.error.includes('null value in column')) {
            errorMessage = "⚠️ Erreur de base de données. L'équipe technique a été notifiée."
          } else {
            errorMessage = `❌ ${error.error}`
          }
        }
        
        setMessage({
          type: "error",
          text: errorMessage
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erreur de connexion. Veuillez réessayer."
      })
    }

    setIsSubmitting(false)
  }

  const handleCodeValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const validationResult = smsService.validateCode(formData.phone, validationCode)

      if (!validationResult.success) {
        setMessage({
          type: "error",
          text: validationResult.message
        })
        setIsSubmitting(false)
        return
      }

      // Code validé, créer l'utilisateur
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.phone,
          password: generatedPassword,
          domain: formData.domain,
          city: formData.city,
          role: "VOTER",
        })
      })

      if (response.ok) {
        // Envoyer le mot de passe par SMS
        await smsService.sendPassword(formData.phone, generatedPassword)
        
        const newUser = await response.json()
        setCurrentStep("success")
        setMessage({
          type: "success",
          text: "Compte créé avec succès ! Mot de passe envoyé par SMS."
        })
        
        setTimeout(() => {
          onSuccess(newUser)
        }, 2000)
      } else {
        const error = await response.json()
        // Messages d'erreur clairs en français
        let errorMessage = "Une erreur est survenue lors de l'inscription"
        
        if (error.error) {
          if (error.error.includes('téléphone est déjà utilisé')) {
            errorMessage = "❌ Ce numéro de téléphone est déjà enregistré. Veuillez vous connecter."
          } else if (error.error.includes('email est requise')) {
            errorMessage = "⚠️ Erreur technique: Veuillez réessayer ou contacter l'administrateur."
          } else if (error.error.includes('null value in column')) {
            errorMessage = "⚠️ Erreur de base de données. L'équipe technique a été notifiée."
          } else {
            errorMessage = `❌ ${error.error}`
          }
        }
        
        setMessage({
          type: "error",
          text: errorMessage
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erreur de connexion. Veuillez réessayer."
      })
    }

    setIsSubmitting(false)
  }

  const handleResendCode = async () => {
    if (!canResendCode) return

    setIsSubmitting(true)
    try {
      const smsResult = await smsService.sendValidationCode(formData.phone)
      
      if (smsResult.success) {
        setMessage({
          type: "success",
          text: `Nouveau code envoyé. Pour le développement: ${smsResult.code}`
        })
        setCanResendCode(false)
        startResendCountdown()
      } else {
        setMessage({
          type: "error",
          text: "Erreur lors de l'envoi du code"
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erreur de connexion"
      })
    }
    setIsSubmitting(false)
  }

  const startResendCountdown = () => {
    setResendCountdown(60)
    const interval = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setCanResendCode(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const resetForm = () => {
    setCurrentStep("form")
    setFormData({ fullName: "", phone: "", domain: "", city: "" })
    setValidationCode("")
    setValidation(null)
    setMessage(null)
    setCanResendCode(true)
    setResendCountdown(0)
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
            {currentStep === "form" && "Inscription par SMS"}
            {currentStep === "validation" && "Validation du Code"}
            {currentStep === "success" && "Inscription Réussie"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {currentStep === "form" && "Inscrivez-vous avec votre numéro malien"}
            {currentStep === "validation" && "Entrez le code reçu par SMS"}
            {currentStep === "success" && "Votre compte est prêt"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === "form" ? "bg-primary text-primary-foreground" : 
              currentStep === "validation" || currentStep === "success" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${
              currentStep === "validation" || currentStep === "success" ? "bg-emerald-500" : "bg-muted"
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === "validation" ? "bg-primary text-primary-foreground" : 
              currentStep === "success" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${
              currentStep === "success" ? "bg-emerald-500" : "bg-muted"
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === "success" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Formulaire */}
        {currentStep === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Nom complet */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Votre nom complet"
                  className="pl-11 h-12"
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
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
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Numéro malien valide requis
              </p>
            </div>

            {/* Domaine et Ville */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domaine</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <select
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => handleInputChange("domain", e.target.value)}
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
                <Label htmlFor="city">Ville</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Votre ville"
                    className="pl-11 h-12"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Validation */}
            {validation && (
              <div className="space-y-2">
                {validation.isValid ? (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-500">
                      Données validées ! Code de validation sera envoyé.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">
                      {validation.errors[0]}
                    </span>
                  </div>
                )}
              </div>
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

            {/* Bouton */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi du code...
                </>
              ) : (
                "Envoyer le code de validation"
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Validation du code */}
        {currentStep === "validation" && (
          <form onSubmit={handleCodeValidation} className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                Entrez le code à 6 chiffres envoyé au {formData.phone}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="validationCode">Code de validation</Label>
              <Input
                id="validationCode"
                type="text"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="h-12 text-center text-lg font-mono"
                maxLength={6}
                required
              />
            </div>

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

            {/* Boutons */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg"
                disabled={isSubmitting || validationCode.length !== 6}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  "Valider le code"
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={handleResendCode}
                disabled={!canResendCode || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {canResendCode ? "Renvoyer le code" : `Réessayer dans ${resendCountdown}s`}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-10"
                onClick={resetForm}
              >
                Modifier mes informations
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Succès et Connexion Directe */}
        {currentStep === "success" && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">✅ Compte Créé et Connecté !</h3>
              <p className="text-muted-foreground">
                Votre compte a été créé avec succès.<br />
                Vous êtes maintenant connecté automatiquement.<br />
                Votre mot de passe a été envoyé au {formData.phone}.
              </p>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>🔐 Vos identifiants de connexion :</strong><br />
                📱 Téléphone : {formData.phone}<br />
                🔑 Mot de passe : Envoyé par SMS<br /><br />
                <strong>📝 Pour vos prochaines connexions :</strong><br />
                1. Utilisez votre numéro de téléphone<br />
                2. Saisissez le mot de passe reçu par SMS<br />
                3. Accédez à votre espace pour voter
              </p>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>🛡️ Sécurité garantie :</strong><br />
                • Un seul compte par numéro de téléphone<br />
                • Protection contre les votes multiples<br />
                • Connexion sécurisée par mot de passe<br />
                • Traçabilité de tous les votes
              </p>
            </div>

            <Button
              className="w-full h-12"
              onClick={() => window.location.href = '/'}
            >
              Accéder à la plateforme
            </Button>
          </div>
        )}

        {/* Footer */}
        {currentStep !== "success" && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline font-medium"
              >
                Connectez-vous
              </button>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
