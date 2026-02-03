// Système anti-fraude avancé pour prévenir multiconnexion et multivote
import type { User } from "@/hooks/use-api-data"

export interface FraudDetection {
  riskScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  reasons: string[]
  allowed: boolean
  action?: string
}

export interface VoteRecord {
  userId: string
  candidateId: string
  timestamp: number
  ip?: string
  userAgent?: string
  phoneHash: string
}

export interface ConnectionRecord {
  userId: string
  timestamp: number
  ip?: string
  userAgent?: string
  phoneHash: string
  isActive: boolean
}

// Stockage en mémoire (en production, utiliser une base de données)
const voteRecords: Map<string, VoteRecord[]> = new Map()
const connectionRecords: Map<string, ConnectionRecord[]> = new Map()
const suspiciousUsers: Set<string> = new Set()
const blockedIPs: Set<string> = new Set()

export class AntiFraudSystem {
  private static instance: AntiFraudSystem
  
  static getInstance(): AntiFraudSystem {
    if (!AntiFraudSystem.instance) {
      AntiFraudSystem.instance = new AntiFraudSystem()
    }
    return AntiFraudSystem.instance
  }

  // Générer un hash du numéro de téléphone pour la détection
  private hashPhone(phone: string): string {
    if (!phone) return ''
    // Hash simple pour la détection (en production, utiliser bcrypt ou argon2)
    return btoa(phone.replace(/\D/g, '')).slice(0, 16)
  }

  // Détecter les tentatives de fraude à l'inscription
  detectSignupFraud(userData: any, existingUsers: User[], ip?: string): FraudDetection {
    const reasons: string[] = []
    let riskScore = 0

    // 1. Vérifier les doublons de numéro de téléphone
    const phoneExists = existingUsers.some(user => 
      user.phone && this.normalizePhone(user.phone) === this.normalizePhone(userData.phone)
    )
    if (phoneExists) {
      riskScore += 40
      reasons.push("Numéro de téléphone déjà utilisé")
    }

    // 2. Vérifier les doublons de nom complet
    const nameExists = existingUsers.some(user => 
      user.name && user.name.toLowerCase().trim() === userData.fullName.toLowerCase().trim()
    )
    if (nameExists) {
      riskScore += 30
      reasons.push("Nom complet déjà utilisé")
    }

    // 3. Vérifier les IP suspectes
    if (ip && blockedIPs.has(ip)) {
      riskScore += 50
      reasons.push("IP bloquée pour activités suspectes")
    }

    // 4. Vérifier les patterns de noms suspects
    if (this.isSuspiciousName(userData.fullName)) {
      riskScore += 20
      reasons.push("Nom complet suspect")
    }

    // 5. Vérifier la rapidité de l'inscription (moins de 30 secondes = suspect)
    const signupTime = Date.now() - (userData.startTime || Date.now())
    if (signupTime < 30000) {
      riskScore += 15
      reasons.push("Inscription trop rapide")
    }

    // Déterminer le niveau de risque
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW"
    let allowed = true
    let action: string | undefined

    if (riskScore >= 70) {
      riskLevel = "CRITICAL"
      allowed = false
      action = "BLOCK"
    } else if (riskScore >= 50) {
      riskLevel = "HIGH"
      allowed = false
      action = "MANUAL_REVIEW"
    } else if (riskScore >= 30) {
      riskLevel = "MEDIUM"
      action = "ADDITIONAL_VERIFICATION"
    }

    return {
      riskScore,
      riskLevel,
      reasons,
      allowed,
      action
    }
  }

  // Enregistrer une connexion
  recordConnection(user: User, ip?: string, userAgent?: string): void {
    const phoneHash = this.hashPhone(user.phone || '')
    const record: ConnectionRecord = {
      userId: user.id,
      timestamp: Date.now(),
      ip,
      userAgent,
      phoneHash,
      isActive: true
    }

    if (!connectionRecords.has(user.id)) {
      connectionRecords.set(user.id, [])
    }
    connectionRecords.get(user.id)!.push(record)

    // Nettoyer les anciennes connexions (plus de 24h)
    this.cleanupOldConnections(user.id)

    // Détecter les connexions multiples
    this.detectMultipleConnections(user.id, phoneHash)
  }

  // Enregistrer un vote
  recordVote(userId: string, candidateId: string, ip?: string, userAgent?: string): { allowed: boolean; reason?: string } {
    const userRecords = voteRecords.get(userId) || []
    const phoneHash = this.getUserPhoneHash(userId)

    // 1. Vérifier si l'utilisateur a déjà voté pour ce candidat
    const existingVote = userRecords.find(record => 
      record.candidateId === candidateId && 
      (Date.now() - record.timestamp) < 24 * 60 * 60 * 1000 // 24 heures
    )
    if (existingVote) {
      return { allowed: false, reason: "Vous avez déjà voté pour ce candidat aujourd'hui" }
    }

    // 2. Vérifier le nombre total de votes aujourd'hui
    const todayVotes = userRecords.filter(record => 
      (Date.now() - record.timestamp) < 24 * 60 * 60 * 1000
    )
    if (todayVotes.length >= 10) { // Maximum 10 votes par jour
      return { allowed: false, reason: "Limite de votes journalière atteinte" }
    }

    // 3. Vérifier les votes depuis la même IP
    if (ip) {
      const sameIPVotes = this.getVotesFromIP(ip, 24 * 60 * 60 * 1000)
      if (sameIPVotes >= 5) { // Maximum 5 votes par IP par jour
        return { allowed: false, reason: "Trop de votes depuis cette adresse IP" }
      }
    }

    // 4. Vérifier les votes avec le même hash de téléphone
    if (phoneHash) {
      const samePhoneVotes = this.getVotesFromPhoneHash(phoneHash, 24 * 60 * 60 * 1000)
      if (samePhoneVotes >= 3) { // Maximum 3 votes par hash de téléphone par jour
        return { allowed: false, reason: "Activité de vote suspecte détectée" }
      }
    }

    // Enregistrer le vote
    const voteRecord: VoteRecord = {
      userId,
      candidateId,
      timestamp: Date.now(),
      ip,
      userAgent,
      phoneHash: phoneHash || ''
    }

    if (!voteRecords.has(userId)) {
      voteRecords.set(userId, [])
    }
    voteRecords.get(userId)!.push(voteRecord)

    return { allowed: true }
  }

  // Détecter les connexions multiples
  private detectMultipleConnections(userId: string, phoneHash: string): void {
    const userConnections = connectionRecords.get(userId) || []
    const activeConnections = userConnections.filter(conn => 
      conn.isActive && (Date.now() - conn.timestamp) < 30 * 60 * 1000 // 30 minutes
    )

    if (activeConnections.length > 3) {
      console.warn(`🚨 Connexions multiples détectées pour l'utilisateur ${userId}`)
      suspiciousUsers.add(userId)
    }

    // Vérifier les connexions avec le même hash de téléphone
    let samePhoneConnections = 0
    for (const [uid, connections] of connectionRecords.entries()) {
      const activeSamePhone = connections.filter(conn => 
        conn.phoneHash === phoneHash && 
        conn.isActive && 
        (Date.now() - conn.timestamp) < 30 * 60 * 1000
      )
      samePhoneConnections += activeSamePhone.length
    }

    if (samePhoneConnections > 1) {
      console.warn(`🚨 Même numéro de téléphone utilisé depuis plusieurs comptes: ${phoneHash}`)
      suspiciousUsers.add(userId)
    }
  }

  // Normaliser le numéro de téléphone
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '').replace(/^223/, '').replace(/^0/, '')
  }

  // Vérifier si un nom est suspect
  private isSuspiciousName(name: string): boolean {
    const suspiciousPatterns = [
      /^[A-Z]{2,}\s[A-Z]{2,}$/, // Initiales uniquement
      /^.{1,2}$/, // Noms trop courts
      /^.{50,}$/, // Noms trop longs
      /(.)\1{3,}/, // Caractères répétés
      /\d{4,}/, // Plus de 3 chiffres
      /test|demo|fake|admin|user/i // Mots suspects
    ]
    return suspiciousPatterns.some(pattern => pattern.test(name))
  }

  // Obtenir le hash de téléphone d'un utilisateur
  private getUserPhoneHash(userId: string): string | undefined {
    // En production, récupérer depuis la base de données
    return undefined
  }

  // Obtenir les votes depuis une IP
  private getVotesFromIP(ip: string, timeWindow: number): number {
    let count = 0
    for (const [userId, votes] of voteRecords.entries()) {
      const recentVotes = votes.filter(vote => 
        vote.ip === ip && 
        (Date.now() - vote.timestamp) < timeWindow
      )
      count += recentVotes.length
    }
    return count
  }

  // Obtenir les votes depuis un hash de téléphone
  private getVotesFromPhoneHash(phoneHash: string, timeWindow: number): number {
    let count = 0
    for (const [userId, votes] of voteRecords.entries()) {
      const recentVotes = votes.filter(vote => 
        vote.phoneHash === phoneHash && 
        (Date.now() - vote.timestamp) < timeWindow
      )
      count += recentVotes.length
    }
    return count
  }

  // Nettoyer les anciennes connexions
  private cleanupOldConnections(userId: string): void {
    const connections = connectionRecords.get(userId) || []
    const recentConnections = connections.filter(conn => 
      (Date.now() - conn.timestamp) < 24 * 60 * 60 * 1000 // 24 heures
    )
    connectionRecords.set(userId, recentConnections)
  }

  // Obtenir les statistiques de fraude
  getFraudStats(): {
    totalVotes: number
    suspiciousUsers: number
    blockedIPs: number
    averageRiskScore: number
  } {
    let totalVotes = 0
    for (const votes of voteRecords.values()) {
      totalVotes += votes.length
    }

    return {
      totalVotes,
      suspiciousUsers: suspiciousUsers.size,
      blockedIPs: blockedIPs.size,
      averageRiskScore: 0 // Calculer si nécessaire
    }
  }

  // Bloquer une IP
  blockIP(ip: string): void {
    blockedIPs.add(ip)
    console.log(`🚫 IP bloquée: ${ip}`)
  }

  // Marquer un utilisateur comme suspect
  markUserAsSuspicious(userId: string): void {
    suspiciousUsers.add(userId)
    console.log(`🚨 Utilisateur marqué comme suspect: ${userId}`)
  }

  // Vérifier si un utilisateur est suspect
  isUserSuspicious(userId: string): boolean {
    return suspiciousUsers.has(userId)
  }

  // Vérifier si une IP est bloquée
  isIPBlocked(ip: string): boolean {
    return blockedIPs.has(ip)
  }
}

// Fonctions utilitaires pour l'intégration
export const antiFraud = AntiFraudSystem.getInstance()

export function validateSignup(userData: any, existingUsers: User[], ip?: string): FraudDetection {
  return antiFraud.detectSignupFraud(userData, existingUsers, ip)
}

export function recordUserConnection(user: User, ip?: string, userAgent?: string): void {
  antiFraud.recordConnection(user, ip, userAgent)
}

export function validateVote(userId: string, candidateId: string, ip?: string, userAgent?: string): { allowed: boolean; reason?: string } {
  return antiFraud.recordVote(userId, candidateId, ip, userAgent)
}
