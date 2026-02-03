"use client"

import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"

interface SecurityBadgeProps {
  score: number
  showDetails?: boolean
}

export function SecurityBadge({ score, showDetails = false }: SecurityBadgeProps) {
  const getSecurityLevel = (score: number) => {
    if (score >= 80) return { level: "Élevé", color: "text-emerald-500", icon: CheckCircle }
    if (score >= 60) return { level: "Moyen", color: "text-amber-500", icon: AlertTriangle }
    return { level: "Faible", color: "text-red-500", icon: XCircle }
  }

  const security = getSecurityLevel(score)
  const Icon = security.icon

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${security.color}`} />
      <span className={`text-sm font-medium ${security.color}`}>
        Sécurité: {security.level} ({score}/100)
      </span>
      {showDetails && (
        <div className="ml-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3 inline mr-1" />
          Plus le score est élevé, plus votre compte est sécurisé
        </div>
      )}
    </div>
  )
}

interface SecurityValidationProps {
  validation: {
    isValid: boolean
    errors: string[]
    warnings: string[]
    securityScore: number
  }
  showScore?: boolean
}

export function SecurityValidation({ validation, showScore = true }: SecurityValidationProps) {
  if (validation.isValid && validation.errors.length === 0 && validation.warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <CheckCircle className="w-4 h-4 text-emerald-500" />
        <span className="text-sm text-emerald-500">Inscription sécurisée validée</span>
        {showScore && <SecurityBadge score={validation.securityScore} />}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {showScore && <SecurityBadge score={validation.securityScore} showDetails />}
      
      {validation.errors.length > 0 && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">Erreurs à corriger:</span>
          </div>
          <ul className="text-xs text-red-500 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {validation.warnings.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-500">Avertissements:</span>
          </div>
          <ul className="text-xs text-amber-500 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
