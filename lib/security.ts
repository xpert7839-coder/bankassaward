// Configuration de sécurité pour l'inscription et les votes
export const SECURITY_CONFIG = {
  // Vérification des doublons
  preventDuplicateAccounts: true,
  
  // Champs obligatoires pour la vérification
  requiredFields: {
    fullName: true,
    email: true,
    phone: true,
    domain: true,
    city: true
  },
  
  // Limites de sécurité
  maxAccountsPerIP: 3, // Maximum 3 comptes par adresse IP
  maxVotesPerCategory: 1, // 1 vote par catégorie par utilisateur
  voteCooldownMinutes: 5, // 5 minutes entre les votes
  
  // Vérification avancée
  enablePhoneVerification: false, // Pour l'instant, vérification simple
  enableEmailVerification: false, // Pour l'instant, vérification simple
  
  // Messages d'erreur
  errorMessages: {
    duplicateEmail: "Cet email est déjà utilisé",
    duplicatePhone: "Ce numéro de téléphone est déjà utilisé",
    duplicateName: "Ce nom complet est déjà utilisé",
    ipLimitReached: "Trop de comptes créés depuis cette adresse IP",
    alreadyVoted: "Vous avez déjà voté dans cette catégorie",
    voteCooldown: "Veuillez patienter avant de voter à nouveau"
  }
}

// Fonction pour normaliser le nom complet (pour éviter les variations)
export function normalizeFullName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/[^\w\s]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, ' ') // Nettoyer à nouveau
}

// Fonction pour normaliser le numéro de téléphone
export function normalizePhoneNumber(phone: string): string {
  return phone
    .replace(/\s+/g, '') // Supprimer les espaces
    .replace(/[^\d+]/g, '') // Garder seulement les chiffres et le +
    .replace(/^0/, '+223') // Ajouter l'indicatif du Mali si nécessaire
}

// Fonction pour vérifier si un nom complet est suspect
export function isSuspiciousName(name: string): boolean {
  const normalized = normalizeFullName(name)
  
  // Noms trop courts
  if (normalized.length < 3) return true
  
  // Noms avec seulement des lettres répétées
  if (/^[a-zA-Z]$/.test(normalized)) return true
  
  // Noms avec caractères suspects
  if (/[^a-zA-Z\s]/.test(normalized)) return true
  
  // Noms avec trop d'espaces
  if ((name.match(/\s/g) || []).length > 3) return true
  
  return false
}

// Fonction pour vérifier si un email est suspect
export function isSuspiciousEmail(email: string): boolean {
  const emailLower = email.toLowerCase()
  
  // Emails temporaires connus
  const tempEmails = [
    'tempmail.org', '10minutemail', 'guerrillamail',
    'mailinator', 'yopmail', 'temp-mail'
  ]
  
  return tempEmails.some(temp => emailLower.includes(temp))
}

// Fonction pour générer un fingerprint utilisateur
export function generateUserFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // Dessiner un pattern unique
  ctx!.textBaseline = 'top'
  ctx!.font = '14px Arial'
  ctx!.fillText('BANKASS_SECURITY_FINGERPRINT', 2, 2)
  
  const fingerprint = canvas.toDataURL()
  return btoa(fingerprint).slice(0, 32)
}

// Fonction pour valider la force du mot de passe
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  // Longueur minimale
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push("Au moins 8 caractères")
  }
  
  // Contient des chiffres
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push("Au moins un chiffre")
  }
  
  // Contient des majuscules
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Au moins une majuscule")
  }
  
  // Contient des minuscules
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push("Au moins une minuscule")
  }
  
  // Contient des caractères spéciaux
  if (/[!@#$%^&*]/.test(password)) {
    score += 1
  } else {
    feedback.push("Au moins un caractère spécial (!@#$%^&*)")
  }
  
  return {
    isValid: score >= 3,
    score,
    feedback
  }
}

// Fonction pour détecter les bots
export function detectBot(): boolean {
  // Vérifier si l'utilisateur navigue trop vite
  if (performance.timing.loadEventEnd - performance.timing.navigationStart < 100) {
    return true
  }
  
  // Vérifier si l'utilisateur a des propriétés de navigateur inhabituelles
  if (!navigator.userAgent || navigator.userAgent.length < 10) {
    return true
  }
  
  return false
}

// Fonction pour limiter les tentatives
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map()
  
  constructor(private maxAttempts: number, private windowMs: number) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(key)
    
    if (!record) {
      this.attempts.set(key, { count: 1, lastAttempt: now })
      return true
    }
    
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(key, { count: 1, lastAttempt: now })
      return true
    }
    
    if (record.count >= this.maxAttempts) {
      return false
    }
    
    record.count++
    record.lastAttempt = now
    return true
  }
  
  reset(key: string): void {
    this.attempts.delete(key)
  }
}

// Rate limiters globaux
export const signupRateLimiter = new RateLimiter(3, 15 * 60 * 1000) // 3 tentatives par 15 minutes
export const voteRateLimiter = new RateLimiter(5, 10 * 60 * 1000) // 5 votes par 10 minutes
