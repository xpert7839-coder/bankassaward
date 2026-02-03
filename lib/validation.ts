import { 
  SECURITY_CONFIG, 
  normalizeFullName, 
  normalizePhoneNumber, 
  isSuspiciousName, 
  isSuspiciousEmail, 
  validatePasswordStrength,
  signupRateLimiter 
} from './security'
import type { User } from '@/hooks/use-api-data'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  securityScore: number // 0-100
}

export interface SignupData {
  fullName: string
  email: string
  phone: string
  domain: string
  city: string
  password: string
}

// Fonction principale de validation d'inscription
export function validateSignup(data: SignupData, existingUsers: User[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let securityScore = 100

  // 1. Validation des champs obligatoires
  Object.entries(SECURITY_CONFIG.requiredFields).forEach(([field, required]) => {
    if (required && !data[field as keyof SignupData]) {
      errors.push(`Le champ ${field} est obligatoire`)
      securityScore -= 20
    }
  })

  // 2. Validation du nom complet
  if (data.fullName) {
    const normalizedName = normalizeFullName(data.fullName)
    
    // Vérifier si le nom est suspect
    if (isSuspiciousName(data.fullName)) {
      errors.push("Le nom complet semble suspect ou invalide")
      securityScore -= 30
    }
    
    // Vérifier les doublons de noms
    const duplicateNames = existingUsers.filter(user => 
      normalizeFullName(user.name) === normalizedName
    )
    
    if (duplicateNames.length > 0) {
      errors.push(SECURITY_CONFIG.errorMessages.duplicateName)
      securityScore -= 40
    }
    
    // Vérifier la longueur
    if (data.fullName.length < 3) {
      errors.push("Le nom complet doit contenir au moins 3 caractères")
      securityScore -= 15
    }
    
    if (data.fullName.length > 50) {
      errors.push("Le nom complet ne doit pas dépasser 50 caractères")
      securityScore -= 10
    }
  }

  // 3. Validation de l'email
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(data.email)) {
      errors.push("L'email n'est pas valide")
      securityScore -= 25
    }
    
    // Vérifier si l'email est suspect
    if (isSuspiciousEmail(data.email)) {
      warnings.push("Cet email semble temporaire, utilisez un email permanent")
      securityScore -= 15
    }
    
    // Vérifier les doublons d'emails
    const duplicateEmails = existingUsers.filter(user => 
      user.email.toLowerCase() === data.email.toLowerCase()
    )
    
    if (duplicateEmails.length > 0) {
      errors.push(SECURITY_CONFIG.errorMessages.duplicateEmail)
      securityScore -= 40
    }
  }

  // 4. Validation du téléphone
  if (data.phone) {
    const normalizedPhone = normalizePhoneNumber(data.phone)
    
    // Vérifier le format
    const phoneRegex = /^\+?\d{8,15}$/
    if (!phoneRegex.test(normalizedPhone)) {
      errors.push("Le numéro de téléphone n'est pas valide")
      securityScore -= 20
    }
    
    // Vérifier les doublons de téléphones
    const duplicatePhones = existingUsers.filter(user => 
      user.phone && normalizePhoneNumber(user.phone) === normalizedPhone
    )
    
    if (duplicatePhones.length > 0) {
      errors.push(SECURITY_CONFIG.errorMessages.duplicatePhone)
      securityScore -= 40
    }
  }

  // 5. Validation du mot de passe
  if (data.password) {
    const passwordValidation = validatePasswordStrength(data.password)
    
    if (!passwordValidation.isValid) {
      errors.push("Le mot de passe n'est pas assez sécurisé")
      errors.push(...passwordValidation.feedback)
      securityScore -= 25
    }
    
    // Vérifier si le mot de passe n'est pas trop simple
    const simplePasswords = ['password', '123456', 'qwerty', 'admin', 'mali']
    if (simplePasswords.includes(data.password.toLowerCase())) {
      errors.push("Le mot de passe est trop simple")
      securityScore -= 30
    }
  }

  // 6. Validation du domaine
  if (data.domain) {
    const validDomains = [
      "Musique", "Audiovisuel", "Journalisme", "Marketing", 
      "Communication", "Production", "Événementiel", "Art", 
      "Culture", "Sport", "Éducation", "Technologie", "Autre"
    ]
    
    if (!validDomains.includes(data.domain)) {
      errors.push("Le domaine sélectionné n'est pas valide")
      securityScore -= 10
    }
  }

  // 7. Rate limiting
  const rateLimitKey = data.email || data.phone || 'anonymous'
  if (!signupRateLimiter.isAllowed(rateLimitKey)) {
    errors.push("Trop de tentatives d'inscription. Veuillez réessayer plus tard.")
    securityScore -= 50
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    securityScore: Math.max(0, securityScore)
  }
}

// Fonction pour calculer le score de risque d'un utilisateur
export function calculateRiskScore(user: User): number {
  let riskScore = 0
  
  // Risque basé sur le nom
  if (isSuspiciousName(user.name)) {
    riskScore += 30
  }
  
  // Risque basé sur l'email
  if (isSuspiciousEmail(user.email)) {
    riskScore += 25
  }
  
  // Risque basé sur le téléphone (si manquant)
  if (!user.phone) {
    riskScore += 15
  }
  
  // Risque basé sur le domaine (si "Autre")
  if (user.domain === "Autre") {
    riskScore += 10
  }
  
  // Risque basé sur la date de création (compte récent)
  const daysSinceCreation = (Date.now() - new Date(user.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceCreation < 1) {
    riskScore += 20
  }
  
  return Math.min(100, riskScore)
}

// Fonction pour détecter les comptes suspects
export function detectSuspiciousAccounts(users: User[]): User[] {
  return users.filter(user => calculateRiskScore(user) > 50)
}

// Fonction pour regrouper les comptes potentiellement dupliqués
export function findPotentialDuplicates(users: User[]): Array<{
  field: string
  value: string
  accounts: User[]
}> {
  const duplicates: Array<{ field: string; value: string; accounts: User[] }> = []
  
  // Regrouper par nom normalisé
  const nameGroups = new Map<string, User[]>()
  users.forEach(user => {
    const normalizedName = normalizeFullName(user.name)
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, [])
    }
    nameGroups.get(normalizedName)!.push(user)
  })
  
  nameGroups.forEach((accounts, name) => {
    if (accounts.length > 1) {
      duplicates.push({ field: 'nom', value: name, accounts })
    }
  })
  
  // Regrouper par téléphone normalisé
  const phoneGroups = new Map<string, User[]>()
  users.forEach(user => {
    if (user.phone) {
      const normalizedPhone = normalizePhoneNumber(user.phone)
      if (!phoneGroups.has(normalizedPhone)) {
        phoneGroups.set(normalizedPhone, [])
      }
      phoneGroups.get(normalizedPhone)!.push(user)
    }
  })
  
  phoneGroups.forEach((accounts, phone) => {
    if (accounts.length > 1) {
      duplicates.push({ field: 'téléphone', value: phone, accounts })
    }
  })
  
  return duplicates
}
