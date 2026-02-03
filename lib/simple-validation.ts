import { 
  validateMalianPhone, 
  normalizePhone,
  generateSecurePassword,
  checkPhoneExists,
  SIMPLE_SECURITY_CONFIG
} from './sms-service'
import { normalizeFullName } from './security'
import type { User } from '@/hooks/use-api-data'

export interface SimpleValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  generatedPassword?: string
}

export interface SimpleSignupData {
  fullName: string
  phone: string
  domain: string
  city: string
}

// Fonction simplifiée de validation d'inscription
export function validateSimpleSignup(data: SimpleSignupData, existingUsers: User[]): SimpleValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  let generatedPassword: string | undefined

  // 1. Validation des champs obligatoires
  Object.entries(SIMPLE_SECURITY_CONFIG.requiredFields).forEach(([field, required]) => {
    if (required && !data[field as keyof SimpleSignupData]) {
      errors.push(`Le champ ${field} est obligatoire`)
    }
  })

  // 2. Validation du nom complet (simplifiée)
  if (data.fullName) {
    const normalizedName = normalizeFullName(data.fullName)
    
    // Vérifier si le nom est trop court
    if (data.fullName.length < 2) {
      errors.push("Le nom complet doit contenir au moins 2 caractères")
    }
    
    // Vérifier si le nom est trop long
    if (data.fullName.length > 50) {
      errors.push("Le nom complet ne doit pas dépasser 50 caractères")
    }
    
    // Vérifier les caractères de base (lettres, espaces, tirets)
    if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(data.fullName)) {
      errors.push("Le nom ne doit contenir que des lettres, espaces, tirets et apostrophes")
    }
    
    // Vérifier les doublons de noms (moins strict)
    const duplicateNames = existingUsers.filter(user => 
      normalizeFullName(user.name) === normalizedName
    )
    
    if (duplicateNames.length > 2) { // Tolérer 2 doublons (familles)
      warnings.push("Ce nom est déjà utilisé plusieurs fois")
    }
  }

  // 3. Validation du téléphone (très importante maintenant)
  if (data.phone) {
    const normalizedPhone = normalizePhone(data.phone)
    
    // Validation stricte du format malien
    if (!validateMalianPhone(normalizedPhone)) {
      errors.push(SIMPLE_SECURITY_CONFIG.messages.phoneInvalid)
    }
    
    // Vérifier les doublons de téléphones (très strict)
    if (checkPhoneExists(data.phone, existingUsers)) {
      errors.push(SIMPLE_SECURITY_CONFIG.messages.phoneExists)
    }
  }

  // 4. Validation du domaine
  if (data.domain) {
    const validDomains = [
      "Musique", "Audiovisuel", "Journalisme", "Marketing", 
      "Communication", "Production", "Événementiel", "Art", 
      "Culture", "Sport", "Éducation", "Technologie", "Autre"
    ]
    
    if (!validDomains.includes(data.domain)) {
      errors.push("Le domaine sélectionné n'est pas valide")
    }
  }

  // 5. Validation de la ville
  if (data.city) {
    if (data.city.length < 2) {
      errors.push("Le nom de la ville doit contenir au moins 2 caractères")
    }
    
    if (data.city.length > 30) {
      errors.push("Le nom de la ville ne doit pas dépasser 30 caractères")
    }
  }

  // 6. Générer le mot de passe si tout est valide
  if (errors.length === 0) {
    generatedPassword = generateSecurePassword(6) // 6 chiffres
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    generatedPassword
  }
}

// Fonction pour créer un utilisateur avec validation simplifiée
export function createSimpleUser(
  data: SimpleSignupData, 
  password: string,
  existingUsers: User[]
): Omit<User, 'id' | 'createdAt'> & { password: string } {
  const validation = validateSimpleSignup(data, existingUsers)
  
  if (!validation.isValid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`)
  }
  
  return {
    name: data.fullName,
    email: `${normalizePhone(data.phone).replace('+', '')}@bankass-awards.sms`, // Email fictif basé sur le téléphone
    password: password,
    domain: data.domain,
    city: data.city,
    phone: normalizePhone(data.phone),
    role: "VOTER" as const
  }
}

// Fonction pour vérifier si un utilisateur peut voter (simplifiée)
export function canUserVote(userId: string, categoryId: string, votes: any[]): boolean {
  // Un utilisateur ne peut voter qu'une fois par catégorie
  const userVotesInCategory = votes.filter(vote => 
    vote.userId === userId && vote.categoryId === categoryId
  )
  
  return userVotesInCategory.length === 0
}

// Fonction pour détecter les comportements suspects (simplifiée)
export function detectSuspiciousBehavior(users: User[], votes: any[]): {
  suspiciousUsers: User[]
  suspiciousVotes: any[]
  warnings: string[]
} {
  const suspiciousUsers: User[] = []
  const suspiciousVotes: any[] = []
  const warnings: string[] = []

  // 1. Utilisateurs avec des informations incomplètes
  users.forEach(user => {
    let riskScore = 0
    
    if (!user.phone) riskScore += 30
    if (!user.city) riskScore += 10
    if (user.domain === "Autre") riskScore += 5
    
    if (riskScore > 20) {
      suspiciousUsers.push(user)
    }
  })

  // 2. Votes anormaux
  const votesByUser = new Map<string, number>()
  votes.forEach(vote => {
    const count = votesByUser.get(vote.userId) || 0
    votesByUser.set(vote.userId, count + 1)
  })

  votesByUser.forEach((count, userId) => {
    if (count > 10) { // Plus de 10 votes suspects
      const user = users.find(u => u.id === userId)
      if (user) {
        suspiciousUsers.push(user)
        warnings.push(`L'utilisateur ${user.name} a voté ${count} fois`)
      }
    }
  })

  return {
    suspiciousUsers,
    suspiciousVotes,
    warnings
  }
}
