"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Vote, Shield, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { validateVote, hasPhoneVotedToday } from "@/lib/anti-fraud"
import type { User } from "@/hooks/use-api-data"

interface SecureVoteButtonProps {
  userId: string
  candidateId: string
  candidateName: string
  userPhone?: string
  onVoteSuccess?: () => void
  onVoteError?: (error: string) => void
}

export function SecureVoteButton({ 
  userId, 
  candidateId, 
  candidateName, 
  userPhone,
  onVoteSuccess,
  onVoteError 
}: SecureVoteButtonProps) {
  const [isVoting, setIsVoting] = useState(false)
  const [voteStatus, setVoteStatus] = useState<'idle' | 'checking' | 'voting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>("")

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      return 'unknown'
    }
  }

  const getUserAgent = (): string => {
    return navigator.userAgent || 'unknown'
  }

  const handleVote = async () => {
    if (isVoting) return

    setIsVoting(true)
    setVoteStatus('checking')
    setMessage("Vérification de sécurité en cours...")

    try {
      // 1. Obtenir l'IP et le User-Agent
      const ip = await getClientIP()
      const userAgent = getUserAgent()

      // 2. Vérification préliminaire locale
      if (userPhone) {
        const phoneCheck = hasPhoneVotedToday(userPhone)
        if (phoneCheck.voted) {
          setVoteStatus('error')
          setMessage("🚨 Ce numéro de téléphone a déjà été utilisé pour voter aujourd'hui")
          onVoteError?.("Ce numéro de téléphone a déjà voté aujourd'hui")
          return
        }
      }

      setVoteStatus('voting')
      setMessage("Enregistrement de votre vote...")

      // 3. Envoyer le vote au serveur avec vérification anti-fraude
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-For': ip
        },
        body: JSON.stringify({
          userId,
          candidateId,
          phone: userPhone
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setVoteStatus('success')
        setMessage(`✅ Vote enregistré avec succès pour ${candidateName} !`)
        onVoteSuccess?.()

        // Réinitialiser après 3 secondes
        setTimeout(() => {
          setVoteStatus('idle')
          setMessage("")
        }, 3000)

      } else {
        setVoteStatus('error')
        
        if (result.fraudDetected) {
          setMessage(`🚨 ${result.error}`)
          console.error("Tentative de fraude détectée:", result)
        } else {
          setMessage(`❌ ${result.error}`)
        }
        
        onVoteError?.(result.error)
      }

    } catch (error) {
      setVoteStatus('error')
      setMessage("❌ Erreur de connexion. Veuillez réessayer.")
      onVoteError?.("Erreur de connexion")
      console.error("Erreur lors du vote:", error)
    } finally {
      setIsVoting(false)
    }
  }

  const getButtonContent = () => {
    switch (voteStatus) {
      case 'checking':
        return (
          <>
            <Shield className="w-4 h-4 mr-2 animate-pulse" />
            Vérification...
          </>
        )
      case 'voting':
        return (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Vote en cours...
          </>
        )
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Vote enregistré
          </>
        )
      case 'error':
        return (
          <>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Erreur
          </>
        )
      default:
        return (
          <>
            <Vote className="w-4 h-4 mr-2" />
            Voter pour {candidateName}
          </>
        )
    }
  }

  const getButtonVariant = () => {
    switch (voteStatus) {
      case 'success':
        return "default"
      case 'error':
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handleVote}
        disabled={isVoting || voteStatus === 'success'}
        variant={getButtonVariant()}
        className="w-full h-12 font-medium"
        size="lg"
      >
        {getButtonContent()}
      </Button>

      {/* Message de statut */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm p-3 rounded-lg text-center ${
            voteStatus === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : voteStatus === 'error'
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-blue-100 text-blue-700 border border-blue-200'
          }`}
        >
          {message}
        </motion.div>
      )}

      {/* Informations de sécurité */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3" />
          <span>Vote sécurisé avec vérification anti-fraude</span>
        </div>
        <div className="flex items-center gap-2">
          <Vote className="w-3 h-3" />
          <span>Un vote par téléphone par jour</span>
        </div>
        {userPhone && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            <span>Téléphone vérifié: {userPhone.slice(0, -4)}****</span>
          </div>
        )}
      </div>
    </div>
  )
}
